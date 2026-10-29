import { z } from "zod";

/** First messages must say the caller is talking to an AI (CLAUDE.md rule 6). */
const AI_DISCLOSURE = /\b(ai|a\.i\.|artificial|virtual assistant|digital assistant|automated)\b|एआई|कृत्रिम|वर्चुअल/i;

export function disclosesAI(text: string): boolean {
  return AI_DISCLOSURE.test(text);
}

export const PromiseKind = z.enum(["must", "never", "handoff"]);
export type PromiseKind = z.infer<typeof PromiseKind>;

export const Language = z.enum(["en", "hi"]);
export type Language = z.infer<typeof Language>;

export const VoiceIRPromise = z.object({
  id: z.string().min(1),
  kind: PromiseKind,
  text: z.string().min(1),
});

export const VoiceIRState = z.object({
  id: z.string().min(1),
  goal: z.string().min(1),
  next: z.array(z.string()),
});

export const VoiceIRTool = z.object({
  name: z.string().min(1),
  kind: z.enum(["transfer_to_number", "end_call", "webhook"]),
  config: z.record(z.string(), z.unknown()),
});

export const VoiceIR = z.object({
  version: z.number().int().min(1),
  business: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    city: z.string().optional(),
  }),
  languages: z.array(Language).min(1),
  hinglish: z.boolean(),
  persona: z.object({
    role: z.string().min(1),
    tone: z.string().min(1),
    firstMessage: z
      .string()
      .min(1)
      .refine(disclosesAI, "The first message must say it is an AI assistant."),
  }),
  voice: z.object({ voiceId: z.string().min(1), ttsModel: z.string().min(1) }),
  promises: z.array(VoiceIRPromise),
  states: z.array(VoiceIRState),
  tools: z.array(VoiceIRTool),
  knowledge: z.array(z.object({ title: z.string().min(1), text: z.string() })),
  lexicon: z.array(z.object({ grapheme: z.string().min(1), alias: z.string().min(1) })),
  /** Speech-handling tweaks, usually added by Heal. If missing, add the whole object. */
  speech: z
    .object({
      /** Backchannel words that must not interrupt the agent, e.g. "haan ji". */
      interruptionIgnoreTerms: z.array(z.string().min(1)),
      /** Words the speech recogniser should favour, e.g. names. */
      asrKeywords: z.array(z.string().min(1)),
      /** "patient" waits longer before replying: for callers who pause mid-sentence. */
      turnEagerness: z.enum(["patient", "normal", "eager"]).optional(),
    })
    .optional(),
});
export type VoiceIR = z.infer<typeof VoiceIR>;

/**
 * What Gemini is asked to write. Voice, tools and version are filled in by
 * code so the model never invents voice ids or phone numbers.
 */
export const VoiceIRDraft = z.object({
  business: VoiceIR.shape.business,
  languages: VoiceIR.shape.languages,
  hinglish: z.boolean(),
  persona: VoiceIR.shape.persona,
  promises: z.array(VoiceIRPromise),
  states: z.array(VoiceIRState),
  knowledge: VoiceIR.shape.knowledge,
  lexicon: VoiceIR.shape.lexicon,
});
export type VoiceIRDraft = z.infer<typeof VoiceIRDraft>;

export const DEFAULT_TTS_MODEL = "eleven_flash_v2_5";

/** Deterministic tools: every agent can end a call; hand-off promises add a transfer. */
export function defaultTools(
  draft: Pick<VoiceIRDraft, "promises">,
  transferNumberSet: boolean,
): VoiceIR["tools"] {
  const tools: VoiceIR["tools"] = [{ name: "end_call", kind: "end_call", config: {} }];
  if (transferNumberSet && draft.promises.some((p) => p.kind === "handoff")) {
    tools.push({ name: "transfer_to_owner", kind: "transfer_to_number", config: {} });
  }
  return tools;
}

export function draftToIR(
  draft: VoiceIRDraft,
  voiceId: string,
  transferNumberSet: boolean,
): VoiceIR {
  return VoiceIR.parse({
    ...draft,
    version: 1,
    voice: { voiceId, ttsModel: DEFAULT_TTS_MODEL },
    tools: defaultTools(draft, transferNumberSet),
  });
}

/**
 * Without OWNER_TRANSFER_NUMBER the prompt tells the agent to promise a callback instead of
 * transferring, so tests and call scoring must grade that, not a live transfer.
 */
export const CALLBACK_HANDOFF_RULE =
  "No live transfer line is set up, so the hand-off counts as kept when the agent promptly tells the caller " +
  "that the named person will call them back and takes their name and number, without trying to handle the problem itself.";

export const PROMISE_KIND_LABEL: Record<PromiseKind, string> = {
  must: "Always",
  never: "Never",
  handoff: "Hand off to a human when",
};
