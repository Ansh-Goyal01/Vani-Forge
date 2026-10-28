import { GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

/** Every Gemini call lives in this file so the provider can be swapped here. */

export class LlmConfigError extends Error {}
export class LlmBusyError extends Error {
  constructor() {
    super("The free AI service is busy right now. Please wait a few seconds and try again.");
  }
}
export class LlmOutputError extends Error {}

const RETRY_DELAYS_MS = [2000, 4000, 8000];
/** Tried in order only if the configured model returns 404. Recorded in DECISIONS.md. */
const FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash-lite"];

function statusOf(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as { status?: number; code?: number; message?: string };
    if (typeof e.status === "number") return e.status;
    if (typeof e.code === "number") return e.code;
    const m = /"code"\s*:\s*(\d{3})/.exec(e.message ?? "") ?? /\b(429|404|503)\b/.exec(e.message ?? "");
    if (m) return Number(m[1]);
  }
  return undefined;
}

export const isRetryable = (err: unknown) => [429, 503].includes(statusOf(err) ?? 0);
export const isNotFound = (err: unknown) => statusOf(err) === 404;

/** Retry on 429/503 with backoff. `sleep` is injectable for tests. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { delays?: number[]; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  const delays = opts.delays ?? RETRY_DELAYS_MS;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err)) throw err;
      if (attempt >= delays.length) throw new LlmBusyError();
      await sleep(delays[attempt]);
    }
  }
}

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmConfigError("GEMINI_API_KEY is not set. Add it to .env.local.");
  return new GoogleGenAI({ apiKey });
}

export function llmConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type GenerateJsonInput<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Extra inline parts, e.g. an uploaded PDF. */
  parts?: Part[];
};

export async function generateJson<T>(input: GenerateJsonInput<T>): Promise<T> {
  const ai = client();
  const jsonSchema = z.toJSONSchema(input.schema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  const models = [process.env.GEMINI_MODEL || "gemini-2.5-flash", ...FALLBACK_MODELS];
  let lastErr: unknown;
  for (const model of models) {
    try {
      const res = await withRetry(() =>
        ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: input.prompt }, ...(input.parts ?? [])] }],
          config: {
            systemInstruction: input.system,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
            temperature: 0.4,
          },
        }),
      );
      let raw: unknown;
      try {
        raw = JSON.parse(res.text ?? "");
      } catch {
        throw new LlmOutputError("The AI answered in a format we could not read. Please try again.");
      }
      const parsed = input.schema.safeParse(raw);
      if (!parsed.success) {
        throw new LlmOutputError(
          "The AI's answer was incomplete: " + parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "),
        );
      }
      return parsed.data;
    } catch (err) {
      lastErr = err;
      if (isNotFound(err)) continue; // try the next model
      throw err;
    }
  }
  throw lastErr;
}
