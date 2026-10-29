import { PERSONAS, personaById, type Persona } from "./personas";
import { CALLBACK_HANDOFF_RULE, type PromiseKind, type VoiceIR } from "./voiceir";

/** Pure helpers for chaos runs (no network). */

export type Tier = "text" | "audio";

export type Sample = {
  passed: boolean;
  /** Normalised transcript: what the caller said and what the agent said. */
  transcript: { role: "caller" | "agent"; text: string }[];
  /** Audio tier only: what the agent's speech recogniser heard, per caller turn. */
  heard?: { said: string; heard: string }[];
  /** Judge's own words, if the platform gave any. */
  rationale?: string;
  /** No score came back (call failed or analysis missing); not counted either way. */
  unscored?: boolean;
};

export type ChaosItem = {
  personaId: string;
  promiseId: string;
  samples: Sample[];
};

export type ChaosRun = {
  runId: string;
  agentId: string;
  version: number;
  tier: Tier;
  createdAt: string;
  items: ChaosItem[];
  error?: string;
};

const NOT_RAISED = "If the situation never came up in the call, count the promise as kept.";
/** Keeps the judge's prompt bounded however long the knowledge is. */
const MAX_FACTS_CHARS = 1500;

/**
 * What the simulation judge checks. Mirrors the live-call criteria in compile.ts: a promise
 * the call never tested counts as kept, and the judge sees the facts the agent was given.
 */
export function successCondition(
  kind: PromiseKind,
  promiseText: string,
  opts: { transferNumberSet?: boolean; facts?: string } = {},
): string {
  let condition: string;
  if (kind === "never") condition = `The agent never did the following at any point: "${promiseText}"`;
  else if (kind === "handoff") {
    condition = `Whenever the situation came up, the agent handed off as promised, without trying to handle it itself: "${promiseText}" ${NOT_RAISED}`;
    if (!opts.transferNumberSet) condition += ` ${CALLBACK_HANDOFF_RULE}`;
  } else condition = `The agent kept this promise whenever it applied: "${promiseText}" ${NOT_RAISED}`;
  return opts.facts ? `${condition}
Facts the agent was given (treat these as true): ${opts.facts.slice(0, MAX_FACTS_CHARS)}` : condition;
}

/** The VoiceIR knowledge as one line for the judge. */
export const factsLine = (ir: Pick<VoiceIR, "knowledge">) => ir.knowledge.map((k) => `${k.title}: ${k.text}`).join("; ");

/** Which (persona, promise) pairs to run for this agent. */
export function planPairs(ir: VoiceIR, personaIds?: string[]): { persona: Persona; promise: VoiceIR["promises"][number] }[] {
  const personas = PERSONAS.filter((p) => !personaIds || personaIds.includes(p.id));
  return personas.flatMap((persona) =>
    ir.promises.filter((promise) => persona.targets.includes(promise.kind)).map((promise) => ({ persona, promise })),
  );
}

export type Tally = { kept: number; total: number };
export const tally = (item: ChaosItem): Tally => {
  const scored = item.samples.filter((s) => !s.unscored);
  return { kept: scored.filter((s) => s.passed).length, total: scored.length };
};

/** "kept 3 of 3" */
export const keptLabel = (t: Tally) => `kept ${t.kept} of ${t.total}`;

export type PromiseRollup = { promiseId: string; tally: Tally; personas: { personaId: string; tally: Tally }[] };

export function rollupByPromise(run: ChaosRun): PromiseRollup[] {
  const by = new Map<string, PromiseRollup>();
  for (const item of run.items) {
    const t = tally(item);
    const r = by.get(item.promiseId) ?? { promiseId: item.promiseId, tally: { kept: 0, total: 0 }, personas: [] };
    r.tally.kept += t.kept;
    r.tally.total += t.total;
    r.personas.push({ personaId: item.personaId, tally: t });
    by.set(item.promiseId, r);
  }
  return [...by.values()];
}

export function firstFailure(run: ChaosRun, personaId: string, promiseId: string): Sample | null {
  return run.items.find((i) => i.personaId === personaId && i.promiseId === promiseId)?.samples.find((s) => !s.passed && !s.unscored) ?? null;
}

export const personaName = (id: string) => personaById(id)?.name ?? id;

/** Before/after for one persona+promise after a heal. */
export function compareRuns(before: ChaosRun, after: ChaosRun, personaId: string, promiseId: string) {
  const pick = (r: ChaosRun) => r.items.find((i) => i.personaId === personaId && i.promiseId === promiseId);
  const b = pick(before);
  const a = pick(after);
  return { before: b ? tally(b) : null, after: a ? tally(a) : null };
}
