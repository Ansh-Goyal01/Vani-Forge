import { z } from "zod";
import { firstFailure, personaName, type ChaosRun, type Sample } from "./chaos";
import { generateJson } from "./llm";
import { applyOps, describeChanges, PatchError, RawOp, type ChangeLine } from "./patch";
import { personaById } from "./personas";
import type { VoiceIR } from "./voiceir";

const HealResult = z.object({
  evidence: z.string().describe("The exact words the AGENT said (copied from the transcript) that broke the promise. Empty if the agent failed by staying silent or not acting."),
  explanation: z.string().describe("Two plain sentences for a non-technical shop owner: what went wrong and what the fix changes. No jargon."),
  summary: z.string().describe("One short sentence naming the change."),
  ops: z.array(RawOp),
});

const SYSTEM = `You fix a voice agent that broke one of its owner's promises during a test call.
You get the agent's JSON specification (VoiceIR), the broken promise, the test caller, and the transcript.
Return an RFC 6902 JSON Patch against the VoiceIR (ops with op add|remove|replace, a JSON Pointer path, and for add/replace the new value as a JSON string in valueJson; append to an array with a path ending in /-).
The promises are the owner's own words: never reword, weaken, replace or remove an existing promise. Fix the agent so it keeps them.
Prefer the smallest fix that targets the cause:
- Wrong or missing behaviour: tighten the matching conversation step goal (/states/N/goal) or add a clearer, more specific promise of the same kind at /promises/-.
- The agent spoke while the caller was pausing mid-sentence (it answered half-finished sentences, or the transcript shows "[the caller interrupted the agent]"): set /speech/turnEagerness to "patient". If /speech does not exist, add the whole object {"interruptionIgnoreTerms":[],"asrKeywords":[],"turnEagerness":"patient"} at path /speech.
- The agent was interrupted by backchannel words such as "haan ji": add them to /speech/interruptionIgnoreTerms. If /speech does not exist, add the whole object {"interruptionIgnoreTerms":[...],"asrKeywords":[]} at path /speech.
- The agent misheard a name or word (compare "caller said" and "agent heard"): add it to /speech/asrKeywords.
- A name was pronounced badly: add to /lexicon with a phonetic alias.
Never touch /version or /tools. Keep persona.firstMessage saying it is an AI assistant. Use only fictional data.`;

export type HealProposal = {
  promiseId: string;
  personaId: string;
  personaName: string;
  promiseText: string;
  evidence: string;
  explanation: string;
  summary: string;
  ops: RawOp[];
  changes: ChangeLine[];
};

/** Heal may append promises but never edit or remove the owner's own (they are the test's yardstick). */
export function assertKeepsPromises(ops: RawOp[]): void {
  const touchesOwnerPromise = ops.some((o) => /^\/promises(\/|$)/.test(o.path) && !(o.op === "add" && o.path === "/promises/-"));
  if (touchesOwnerPromise) {
    throw new PatchError("The fix changed one of the owner's promises. Promises are the owner's own words: fix the agent instead.");
  }
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function transcriptText(sample: Sample): string {
  const lines = sample.transcript.map((l) => `${l.role === "caller" ? "CALLER" : "AGENT"}: ${l.text}`).join("\n");
  const heard = sample.heard?.length
    ? "\n\nWhat the agent's speech recognition heard (audio test):\n" + sample.heard.map((h) => `caller said: "${h.said}" / agent heard: "${h.heard}"`).join("\n")
    : "";
  return lines + heard + (sample.rationale ? `\n\nJudge's note: ${sample.rationale}` : "");
}

export async function proposeHeal(ir: VoiceIR, run: ChaosRun, personaId: string, promiseId: string): Promise<HealProposal> {
  const sample = firstFailure(run, personaId, promiseId);
  const promise = ir.promises.find((p) => p.id === promiseId);
  const persona = personaById(personaId);
  if (!sample || !promise || !persona) throw new PatchError("We could not find that failed run to fix.");

  const base = `VoiceIR:\n${JSON.stringify(ir, null, 2)}\n\nBroken promise (${promise.kind}): "${promise.text}" (id ${promise.id})\nTest caller: ${persona.name}: ${persona.summary}\n\nTranscript:\n${transcriptText(sample)}`;
  let prompt = base;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await generateJson({ system: SYSTEM, prompt, schema: HealResult });
    try {
      if (res.ops.length === 0) throw new PatchError("The fix was empty.");
      assertKeepsPromises(res.ops);
      applyOps(ir, res.ops); // validates
      // "[the caller interrupted the agent]" markers are ours, not words the agent said.
      const agentText = sample.transcript.filter((l) => l.role === "agent" && !l.text.startsWith("[")).map((l) => l.text);
      const quoted = res.evidence.trim();
      // The quote must really be in the transcript; otherwise fall back to the agent's last line.
      const evidence = quoted && agentText.some((t) => norm(t).includes(norm(quoted))) ? quoted : (agentText.at(-1) ?? "");
      return {
        promiseId,
        personaId,
        personaName: personaName(personaId),
        promiseText: promise.text,
        evidence,
        explanation: res.explanation,
        summary: res.summary,
        ops: res.ops,
        changes: describeChanges(ir, res.ops),
      };
    } catch (err) {
      if (!(err instanceof PatchError)) throw err;
      lastError = err.message;
      prompt = `${base}\n\nYour previous patch failed: ${lastError}\nReturn a corrected patch.`;
    }
  }
  throw new PatchError("We could not work out a safe fix automatically: " + lastError);
}
