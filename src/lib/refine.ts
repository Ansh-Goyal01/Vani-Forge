import { z } from "zod";
import { generateJson } from "./llm";
import { applyOps, PatchError, RawOp } from "./patch";
import type { VoiceIR } from "./voiceir";

const RefineResult = z.object({
  summary: z.string().describe("One plain sentence describing what will change."),
  ops: z.array(RawOp),
});

const SYSTEM = `You edit a voice agent's JSON specification (VoiceIR) by returning an RFC 6902 JSON Patch.
- Return ops with op = add | remove | replace and a JSON Pointer path (for example /persona/firstMessage or /promises/1/text). For add and replace, put the new value as a JSON string in valueJson. To append to an array use path ending in /-.
- Make the smallest change that satisfies the instruction. Do not touch /version or /tools.
- persona.firstMessage must always keep saying that the agent is an AI assistant.
- Promise ids stay stable; new promises need a unique snake_case id and kind must|never|handoff.
- If the instruction cannot be done, return an empty ops array and explain in summary.
- Use only fictional data.`;

export type RefineProposal = { summary: string; ops: RawOp[]; next: VoiceIR | null; error?: string };

export async function proposeRefinement(ir: VoiceIR, instruction: string): Promise<RefineProposal> {
  const base = `Current VoiceIR:\n${JSON.stringify(ir, null, 2)}\n\nOwner's instruction:\n"""\n${instruction.trim()}\n"""`;
  let prompt = base;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await generateJson({ system: SYSTEM, prompt, schema: RefineResult });
    if (res.ops.length === 0) return { summary: res.summary, ops: [], next: null };
    try {
      return { summary: res.summary, ops: res.ops, next: applyOps(ir, res.ops) };
    } catch (err) {
      if (!(err instanceof PatchError)) throw err;
      lastError = err.message;
      prompt = `${base}\n\nYour previous patch failed: ${lastError}\nReturn a corrected patch.`;
    }
  }
  return { summary: "", ops: [], next: null, error: lastError };
}
