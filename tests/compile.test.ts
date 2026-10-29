import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildTurn, compile, pickTtsModel } from "@/lib/compile";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";

describe("compile (VoiceIR -> ElevenLabs config)", () => {
  const ir = smileDentalIR("voice_abc");

  it("is pure: same input gives deep-equal output and does not mutate the IR", () => {
    const snapshot = structuredClone(ir);
    expect(compile(ir, { transferNumber: "+910000000000" })).toEqual(compile(ir, { transferNumber: "+910000000000" }));
    expect(ir).toEqual(snapshot);
  });

  it("sets first message, language, hinglish, voice, an English base model and a multilingual Hindi preset", () => {
    const { conversationConfig: c } = compile(ir);
    expect(c.agent?.firstMessage).toBe(ir.persona.firstMessage);
    expect(c.agent?.language).toBe("en");
    expect(c.agent?.hinglishMode).toBe(true);
    expect(c.tts?.voiceId).toBe("voice_abc");
    // Live API: "English Agents must use turbo or flash v2."
    expect(c.tts?.modelId).toBe("eleven_flash_v2");
    expect(Object.keys(c.languagePresets ?? {})).toEqual(["hi"]);
    expect(c.languagePresets?.hi.overrides.tts?.modelId).toBe("eleven_flash_v2_5");
  });

  it("picks an English-only model for English and a multilingual one for other languages", () => {
    const v = (ttsModel: string) => ({ voiceId: "v", ttsModel });
    expect(pickTtsModel({ languages: ["en", "hi"], voice: v("eleven_flash_v2_5") })).toBe("eleven_flash_v2");
    expect(pickTtsModel({ languages: ["en"], voice: v("eleven_turbo_v2") })).toBe("eleven_turbo_v2");
    expect(pickTtsModel({ languages: ["en"], voice: v("made_up") })).toBe("eleven_flash_v2");
    expect(pickTtsModel({ languages: ["en", "hi"], voice: v("eleven_flash_v2") }, "hi")).toBe("eleven_flash_v2_5");
    expect(pickTtsModel({ languages: ["hi"], voice: v("eleven_multilingual_v2") })).toBe("eleven_multilingual_v2");
  });

  it("grades hand-offs as a callback when there is no transfer number, as the prompt instructs", () => {
    const handoff = (o: Parameters<typeof compile>[1]) =>
      compile(ir, o).platformSettings.evaluation?.criteria?.find((c) => ir.promises.find((p) => p.kind === "handoff")?.id === c.id)?.conversationGoalPrompt;
    expect(handoff({})).toContain("call them back");
    expect(handoff({ transferNumber: "+910000000000" })).not.toContain("call them back");
  });

  it("compiles turn-taking settings only when they are set", () => {
    expect(buildTurn(ir)).toBeUndefined();
    const patient = { ...ir, speech: { interruptionIgnoreTerms: [], asrKeywords: [], turnEagerness: "patient" as const } };
    expect(compile(patient).conversationConfig.turn).toEqual({ turnEagerness: "patient" });
    const terms = { ...ir, speech: { interruptionIgnoreTerms: ["haan ji"], asrKeywords: [] } };
    expect(compile(terms).conversationConfig.turn).toEqual({ interruptionIgnoreTerms: ["haan ji"], mergeWithDefaultIgnoreTerms: true });
  });

  it("writes role, promises, flow and knowledge sections into the prompt", () => {
    const p = buildSystemPrompt(ir, { transferNumber: "+910000000000" });
    for (const h of ["# Role", "# Language", "# Promises", "# Conversation flow", "# Knowledge"]) expect(p).toContain(h);
    expect(p).toContain("Never give medical advice");
    expect(p).toContain("Consultation: 500");
    expect(p).toContain("transfer_to_number");
  });

  it("falls back to a callback instruction when no transfer number is set", () => {
    const p = buildSystemPrompt(ir);
    expect(p).toContain("No transfer number is set");
    expect(compile(ir).conversationConfig.agent?.prompt?.builtInTools?.transferToNumber).toBeUndefined();
  });

  it("adds the transfer tool only when a number is given", () => {
    const tool = compile(ir, { transferNumber: "+910000000000" }).conversationConfig.agent?.prompt?.builtInTools?.transferToNumber;
    expect(tool?.params).toMatchObject({ systemToolType: "transfer_to_number" });
    expect(JSON.stringify(tool)).toContain("+910000000000");
  });

  it("scores every promise as an evaluation criterion", () => {
    const criteria = compile(ir).platformSettings.evaluation?.criteria ?? [];
    expect(criteria.map((c) => c.id)).toEqual(ir.promises.map((p) => p.id));
    expect(new Set(criteria.map((c) => c.id)).size).toBe(criteria.length);
    expect(criteria.every((c) => c.conversationGoalPrompt.length > 0)).toBe(true);
  });

  it("attaches pronunciation dictionary locators only when provided", () => {
    expect(compile(ir).conversationConfig.tts?.pronunciationDictionaryLocators).toBeUndefined();
    const withDict = compile(ir, { pronunciationDictionaryLocators: [{ pronunciationDictionaryId: "d1", versionId: "ver1" }] });
    expect(withDict.conversationConfig.tts?.pronunciationDictionaryLocators).toEqual([{ pronunciationDictionaryId: "d1", versionId: "ver1" }]);
  });

  it("adds language detection only for multi-language agents", () => {
    expect(compile(ir).conversationConfig.agent?.prompt?.builtInTools?.languageDetection).toBeDefined();
    const en = { ...ir, languages: ["en" as const] };
    expect(compile(en).conversationConfig.agent?.prompt?.builtInTools?.languageDetection).toBeUndefined();
  });
});
