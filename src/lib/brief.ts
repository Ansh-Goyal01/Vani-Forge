import type { Part } from "@google/genai";
import { getCached, putCached } from "./store";
import { sha256 } from "./hash";
import { generateJson } from "./llm";
import { VoiceIRDraft } from "./voiceir";

export const BRIEF_MAX_CHARS = 1000;

const SYSTEM = `You turn a business owner's plain-language brief into a voice-agent specification for a phone receptionist.
Rules:
- The owner may write in English, Hindi or Hinglish. Write all fields in clear English, except persona.firstMessage and lexicon aliases, which follow the languages the agent speaks.
- persona.firstMessage MUST say the caller is speaking with an AI assistant (for example "I'm an AI assistant"), name the business, and be at most two short sentences.
- promises: the owner's own rules, in their words. kind "must" = always do; "never" = never do; "handoff" = transfer to a human when. id is a short snake_case slug, unique.
- If the brief mentions pain, emergencies or a person to escalate to, add a "handoff" promise naming that person.
- Always add a "never" promise against inventing prices or facts that are not in the knowledge, and (for health businesses) against giving medical advice.
- states: 3 to 6 conversation steps with short ids, one-sentence goals, and next = ids of steps that may follow.
- knowledge: put prices, hours, addresses and policies the owner gave. Do not invent any numbers that were not supplied. If none were supplied, return an empty array.
- lexicon: proper names a TTS voice may mispronounce (especially Hindi or Indian names) with a phonetic English alias such as "Bhut-nuh-gar". Empty array if none.
- languages: "en" and/or "hi". hinglish true if the owner or callers mix Hindi and English.
- Never include real personal data; this is a prototype.`;

export type BriefInput = {
  brief: string;
  /** Plain text pulled from an uploaded .txt/.md file. */
  knowledgeText?: string;
  /** Uploaded PDF, base64. */
  pdfBase64?: string;
};

export function briefHash(input: BriefInput): string {
  return sha256(JSON.stringify([input.brief.trim(), input.knowledgeText ?? "", input.pdfBase64 ? sha256(input.pdfBase64) : ""]));
}

export async function draftFromBrief(input: BriefInput): Promise<{ draft: VoiceIRDraft; cached: boolean }> {
  const brief = input.brief.trim();
  if (brief.length === 0) throw new Error("Please describe your agent first.");
  if (brief.length > BRIEF_MAX_CHARS) throw new Error(`Please keep the description under ${BRIEF_MAX_CHARS} characters.`);

  const hash = briefHash(input);
  const hit = await getCached<VoiceIRDraft>(hash);
  if (hit) {
    const parsed = VoiceIRDraft.safeParse(hit);
    if (parsed.success) return { draft: parsed.data, cached: true };
  }

  const parts: Part[] = [];
  if (input.pdfBase64) parts.push({ inlineData: { mimeType: "application/pdf", data: input.pdfBase64 } });
  const prompt =
    `Owner's brief:\n"""\n${brief}\n"""` +
    (input.knowledgeText ? `\n\nExtra business knowledge supplied by the owner:\n"""\n${input.knowledgeText.slice(0, 20000)}\n"""` : "");

  const draft = await generateJson({ system: SYSTEM, prompt, schema: VoiceIRDraft, parts });
  await putCached(hash, draft);
  return { draft, cached: false };
}
