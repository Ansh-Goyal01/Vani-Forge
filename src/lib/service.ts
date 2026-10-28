import { compile } from "./compile";
import { createAgent, createPronunciationDictionary, deleteAgent, elevenConfigured, getCredits, updateAgent } from "./eleven";
import { sha256 } from "./hash";
import * as store from "./store";
import { addVersion, undo as undoHistory, undoTarget } from "./versions";
import { evaluateCredits, type CreditGuard } from "./credits";
import { VoiceIR } from "./voiceir";

/** Glue: VoiceIR + files in /data + the ElevenLabs agent. Used by route handlers and scripts. */

function transferNumber(): string | undefined {
  return process.env.OWNER_TRANSFER_NUMBER?.trim() || undefined;
}

/** Creates (once per lexicon) the pronunciation dictionary and compiles the agent config. */
async function buildPayload(ir: VoiceIR, meta: store.AgentMeta | null) {
  let dictionary = meta?.dictionary;
  let locators: { pronunciationDictionaryId: string; versionId?: string }[] = [];
  if (ir.lexicon.length > 0) {
    const hash = sha256(JSON.stringify(ir.lexicon));
    if (dictionary?.hash !== hash) {
      const created = await createPronunciationDictionary(`${ir.business.name} ${hash.slice(0, 8)}`, ir.lexicon);
      dictionary = { hash, id: created.id, versionId: created.versionId };
    }
    locators = [{ pronunciationDictionaryId: dictionary!.id, versionId: dictionary!.versionId }];
  } else {
    dictionary = undefined;
  }
  return { payload: compile(ir, { transferNumber: transferNumber(), pronunciationDictionaryLocators: locators }), dictionary };
}

export async function createAgentFromIR(ir: VoiceIR): Promise<{ agentId: string }> {
  const { payload, dictionary } = await buildPayload(ir, null);
  const agentId = await createAgent(payload);
  const meta = await store.createAgentRecord(agentId, ir);
  if (dictionary) await store.saveMeta({ ...meta, dictionary });
  return { agentId };
}

export async function getAgentState(agentId: string) {
  const meta = await store.getMeta(agentId);
  if (!meta) return null;
  const ir = await store.loadVersion(agentId, meta.history.current);
  if (!ir) return null;
  return { meta, ir };
}

/** Saves `next` as a new version (v2, v3...) and pushes it to ElevenLabs. */
export async function saveNewVersion(agentId: string, next: VoiceIR, note: string) {
  const state = await getAgentState(agentId);
  if (!state) throw new Error("Agent not found");
  const history = addVersion(state.meta.history, note);
  const ir = VoiceIR.parse({ ...next, version: history.current });
  const { payload, dictionary } = await buildPayload(ir, state.meta);
  await updateAgent(agentId, payload);
  await store.saveVersion(agentId, ir);
  await store.saveMeta({ ...state.meta, history, dictionary });
  return { ir, meta: { ...state.meta, history, dictionary } };
}

/** Moves back to the previous version and pushes it to ElevenLabs. */
export async function undoVersion(agentId: string) {
  const state = await getAgentState(agentId);
  if (!state) throw new Error("Agent not found");
  if (undoTarget(state.meta.history) === null) throw new Error("Nothing to undo.");
  const history = undoHistory(state.meta.history);
  const ir = await store.loadVersion(agentId, history.current);
  if (!ir) throw new Error("Previous version file is missing.");
  const { payload, dictionary } = await buildPayload(ir, state.meta);
  await updateAgent(agentId, payload);
  await store.saveMeta({ ...state.meta, history, dictionary });
  return { ir, meta: { ...state.meta, history, dictionary } };
}

export async function removeAgent(agentId: string) {
  await deleteAgent(agentId);
  await store.deleteAgentRecord(agentId);
}

export function describeState(state: NonNullable<Awaited<ReturnType<typeof getAgentState>>>) {
  return {
    ir: state.ir,
    history: state.meta.history,
    canUndo: undoTarget(state.meta.history) !== null,
    transferNumberSet: Boolean(transferNumber()),
  };
}

export type CreditStatus = {
  connected: boolean;
  remaining: number | null;
  limit: number | null;
  override: boolean;
  guard: CreditGuard;
  error?: string;
};

export async function getCreditStatus(): Promise<CreditStatus> {
  const { creditOverride } = await store.getSettings();
  if (!elevenConfigured()) {
    return {
      connected: false,
      remaining: null,
      limit: null,
      override: creditOverride,
      guard: evaluateCredits({ remaining: null, override: creditOverride }),
    };
  }
  try {
    const c = await getCredits();
    return {
      connected: true,
      remaining: c.remaining,
      limit: c.limit,
      override: creditOverride,
      guard: evaluateCredits({ remaining: c.remaining, override: creditOverride }),
    };
  } catch {
    return {
      connected: false,
      remaining: null,
      limit: null,
      override: creditOverride,
      guard: evaluateCredits({ remaining: null, override: creditOverride }),
      error: "Could not read the credit balance from ElevenLabs.",
    };
  }
}
