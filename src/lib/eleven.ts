import { ElevenLabsClient, type ElevenLabs } from "@elevenlabs/elevenlabs-js";
import type { AgentPayload } from "./compile";

/**
 * All ElevenLabs calls (server side). Field names verified against the SDK
 * types in node_modules/@elevenlabs/elevenlabs-js (v2.74.0). Keys are read here
 * and nowhere in the browser.
 */

export class ElevenConfigError extends Error {}

export function elevenConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/** What a restricted ElevenLabs key must allow for every feature here (names as shown on the key settings page). */
export const REQUIRED_KEY_PERMISSIONS = [
  "ElevenLabs Agents: Write",
  "Text to Speech: Access",
  "Speech to Text: Access",
  "Voices: Read",
  "Pronunciation Dictionaries: Write",
  "User: Read",
];

/** The permission a 401 says the key lacks (e.g. "voices_read"), if that is the cause. */
export function missingPermission(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const detail = (err as { body?: { detail?: { status?: string; message?: string } } }).body?.detail;
  if (detail?.status !== "missing_permissions") return undefined;
  return /permission (\w+)/.exec(detail.message ?? "")?.[1] ?? "unknown";
}

export function missingPermissionMessage(permission: string): string {
  return (
    `Your ElevenLabs API key is missing the "${permission}" permission. ` +
    `Create a new key (ElevenLabs > Developers > API keys) that allows: ${REQUIRED_KEY_PERMISSIONS.join(", ")}. ` +
    "Paste it into .env.local and restart the app."
  );
}

function client(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new ElevenConfigError("ELEVENLABS_API_KEY is not set. Add it to .env.local.");
  return new ElevenLabsClient({ apiKey });
}

export async function createAgent(payload: AgentPayload): Promise<string> {
  const res = await client().conversationalAi.agents.create({
    name: payload.name,
    conversationConfig: payload.conversationConfig,
    platformSettings: payload.platformSettings,
  });
  return res.agentId;
}

export async function updateAgent(agentId: string, payload: AgentPayload): Promise<void> {
  await client().conversationalAi.agents.update(agentId, {
    name: payload.name,
    conversationConfig: payload.conversationConfig,
    platformSettings: payload.platformSettings,
  });
}

export async function deleteAgent(agentId: string): Promise<void> {
  await client().conversationalAi.agents.delete(agentId);
}

export async function getSignedUrl(agentId: string): Promise<string> {
  const res = await client().conversationalAi.conversations.getSignedUrl({ agentId });
  return res.signedUrl;
}

export type VoiceSummary = {
  voiceId: string;
  name: string;
  previewUrl?: string;
  labels: Record<string, string>;
  description?: string;
};

export async function listVoices(opts: { search?: string; useCase?: string } = {}): Promise<VoiceSummary[]> {
  const res = await client().voices.search({
    pageSize: 100,
    search: opts.search,
    useCases: opts.useCase,
    sort: "name",
  });
  return res.voices.map((v) => ({
    voiceId: v.voiceId,
    name: v.name ?? v.voiceId,
    previewUrl: v.previewUrl,
    labels: v.labels ?? {},
    description: v.description,
  }));
}

/**
 * Credits left. TODO(verify): ElevenLabs bills "credits"; the subscription object
 * exposes them as characterLimit / characterCount (kept for backward compatibility).
 */
export async function getCredits(): Promise<{ remaining: number; used: number; limit: number; tier: string }> {
  const sub = await client().user.subscription.get();
  return {
    remaining: Math.max(0, sub.characterLimit - sub.characterCount),
    used: sub.characterCount,
    limit: sub.characterLimit,
    tier: sub.tier,
  };
}

export async function transcribe(file: Blob): Promise<string> {
  const res = await client().speechToText.convert({ file, modelId: "scribe_v2" });
  // The union also covers multichannel / webhook responses; the single-channel one has `text`.
  if ("text" in res && typeof res.text === "string") return res.text;
  throw new Error("Unexpected transcription response shape"); // TODO(verify)
}

export async function createPronunciationDictionary(
  name: string,
  rules: { grapheme: string; alias: string }[],
): Promise<{ id: string; versionId?: string }> {
  const res = await client().pronunciationDictionaries.createFromRules({
    name,
    rules: rules.map((r) => ({ type: "alias" as const, stringToReplace: r.grapheme, alias: r.alias })),
  });
  return { id: res.id, versionId: res.versionId };
}



// ---- M3: simulation tests (text tier) ----

export async function createSimulationTest(input: {
  name: string;
  scenario: string;
  successCondition: string;
  maxTurns?: number;
}): Promise<string> {
  const res = await client().conversationalAi.tests.create({
    type: "simulation",
    name: input.name,
    simulationScenario: input.scenario,
    successCondition: input.successCondition,
    simulationMaxTurns: input.maxTurns ?? 8,
  });
  return res.id;
}

export async function deleteTest(testId: string): Promise<void> {
  await client().conversationalAi.tests.delete(testId);
}

export async function runTests(agentId: string, testIds: string[], repeatCount: number): Promise<string> {
  const res = await client().conversationalAi.agents.runTests(agentId, {
    tests: testIds.map((testId) => ({ testId })),
    repeatCount,
  });
  return res.id;
}

export type TestRunSummary = {
  testId: string;
  status: "pending" | "passed" | "failed" | "cancelled";
  lines: { role: "caller" | "agent"; text: string }[];
  rationale?: string;
};

/** TODO(verify): `agentResponses` is assumed to hold the whole simulated transcript (both roles). Polls until no run is pending (or the deadline passes). */
export async function waitForInvocation(invocationId: string, timeoutMs = 240_000): Promise<{ done: boolean; runs: TestRunSummary[] }> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const inv = await client().conversationalAi.tests.invocations.get(invocationId);
    const runs: TestRunSummary[] = inv.testRuns.map((r) => ({
      testId: r.testId,
      status: r.status,
      lines: (r.agentResponses ?? [])
        .filter((m) => m.message)
        .map((m) => ({ role: m.role === "user" ? ("caller" as const) : ("agent" as const), text: m.message as string })),
      rationale: [r.conditionResult?.rationale?.summary, ...(r.conditionResult?.rationale?.messages ?? [])].filter(Boolean).join(" ") || undefined,
    }));
    const pending = runs.some((r) => r.status === "pending");
    if (!pending && runs.length > 0) return { done: true, runs };
    if (Date.now() > deadline) return { done: false, runs };
    await new Promise((r) => setTimeout(r, 4000));
  }
}

// ---- M3: persona TTS for the audio tier ----

export async function ttsPcm16k(voiceId: string, text: string): Promise<Buffer> {
  const stream = await client().textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_flash_v2_5",
    outputFormat: "pcm_16000",
  });
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// ---- M4: conversations ----

export type ConversationRow = {
  conversationId: string;
  startTimeUnixSecs: number;
  durationSecs: number;
  status: string;
  callSuccessful: string;
  title?: string;
  summary?: string;
  messageCount: number;
};

export async function listConversations(agentId: string, pageSize = 30): Promise<ConversationRow[]> {
  const res = await client().conversationalAi.conversations.list({ agentId, pageSize });
  return res.conversations.map((c) => ({
    conversationId: c.conversationId,
    startTimeUnixSecs: c.startTimeUnixSecs,
    durationSecs: c.callDurationSecs,
    status: c.status,
    callSuccessful: c.callSuccessful,
    title: c.callSummaryTitle,
    summary: c.transcriptSummary,
    messageCount: c.messageCount,
  }));
}

export type ConversationDetail = {
  conversationId: string;
  status: string;
  durationSecs: number;
  summary?: string;
  title?: string;
  callSuccessful?: string;
  transcript: { role: string; message: string; interrupted?: boolean }[];
  criteria: { criteriaId: string; result: string; rationale: string }[];
};

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const c = await client().conversationalAi.conversations.get(conversationId);
  const results = c.analysis?.evaluationCriteriaResultsList ?? Object.values(c.analysis?.evaluationCriteriaResults ?? {});
  return {
    conversationId: c.conversationId,
    status: c.status,
    durationSecs: c.metadata.callDurationSecs,
    summary: c.analysis?.transcriptSummary,
    title: c.analysis?.callSummaryTitle,
    callSuccessful: c.analysis?.callSuccessful,
    transcript: c.transcript
      .filter((t) => t.message)
      .map((t) => ({ role: t.role, message: t.message as string, interrupted: t.interrupted })),
    criteria: results.map((r) => ({ criteriaId: r.criteriaId, result: r.result, rationale: r.rationale })),
  };
}

export type { ElevenLabs };
