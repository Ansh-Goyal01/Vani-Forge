import jsonpatch, { type Operation } from "fast-json-patch";
import { z } from "zod";
import { VoiceIR } from "./voiceir";

/**
 * RFC 6902 patches against VoiceIR. Gemini returns `valueJson` (a JSON string)
 * instead of a free-form `value`, which keeps the response schema simple.
 */
export const RawOp = z.object({
  op: z.enum(["add", "remove", "replace"]),
  path: z.string().startsWith("/"),
  valueJson: z.string().optional(),
});
export type RawOp = z.infer<typeof RawOp>;

export class PatchError extends Error {}

const FORBIDDEN_PREFIXES = ["/version", "/tools"];

export function toJsonPatch(ops: RawOp[]): Operation[] {
  return ops.map((o) => {
    if (FORBIDDEN_PREFIXES.some((p) => o.path === p || o.path.startsWith(p + "/"))) {
      throw new PatchError(`That change touches "${o.path}", which only VaniForge manages.`);
    }
    if (o.op === "remove") return { op: "remove", path: o.path } as Operation;
    if (o.valueJson === undefined) throw new PatchError(`The change to "${o.path}" has no new value.`);
    let value: unknown;
    try {
      value = JSON.parse(o.valueJson);
    } catch {
      throw new PatchError(`The new value for "${o.path}" is not valid JSON.`);
    }
    return { op: o.op, path: o.path, value } as Operation;
  });
}

/** Applies ops to a copy of the IR and validates the result. Version is left unchanged. */
export function applyOps(ir: VoiceIR, ops: RawOp[]): VoiceIR {
  const patch = toJsonPatch(ops);
  let result: unknown;
  try {
    result = jsonpatch.applyPatch(structuredClone(ir), patch, true, false).newDocument;
  } catch (err) {
    throw new PatchError("That change does not fit the agent: " + (err as Error).message);
  }
  const parsed = VoiceIR.safeParse(result);
  if (!parsed.success) {
    throw new PatchError(
      "The changed agent would be invalid: " + parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "),
    );
  }
  return parsed.data;
}

const FIELD_LABELS: [RegExp, string][] = [
  [/^\/persona\/firstMessage$/, "Welcome message"],
  [/^\/persona\/tone$/, "Tone"],
  [/^\/persona\/role$/, "Role"],
  [/^\/promises\/(\d+|-)\/text$/, "Promise wording"],
  [/^\/promises\/(\d+|-)\/kind$/, "Promise type"],
  [/^\/promises(\/(\d+|-))?$/, "Promise"],
  [/^\/languages/, "Languages"],
  [/^\/hinglish$/, "Hinglish"],
  [/^\/voice\/voiceId$/, "Voice"],
  [/^\/voice\/ttsModel$/, "Voice model"],
  [/^\/knowledge/, "Knowledge"],
  [/^\/lexicon/, "Pronunciation"],
  [/^\/speech\/interruptionIgnoreTerms/, "Words that should not interrupt"],
  [/^\/speech\/asrKeywords/, "Words to listen for"],
  [/^\/speech/, "Speech handling"],
  [/^\/states/, "Conversation step"],
  [/^\/business/, "Business details"],
];

export function labelForPath(path: string): string {
  return FIELD_LABELS.find(([re]) => re.test(path))?.[1] ?? path;
}

export type ChangeLine = { op: RawOp["op"]; path: string; label: string; before?: unknown; after?: unknown };

export function describeChanges(ir: VoiceIR, ops: RawOp[]): ChangeLine[] {
  const patch = toJsonPatch(ops);
  return patch.map((p, i) => {
    let before: unknown;
    try {
      before = jsonpatch.getValueByPointer(ir, p.path);
    } catch {
      before = undefined;
    }
    return {
      op: ops[i].op,
      path: p.path,
      label: labelForPath(p.path),
      before,
      after: "value" in p ? p.value : undefined,
    };
  });
}
