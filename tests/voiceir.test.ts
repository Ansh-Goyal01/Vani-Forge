import { describe, expect, it } from "vitest";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";
import { defaultTools, disclosesAI, draftToIR, VoiceIR, VoiceIRDraft } from "@/lib/voiceir";

describe("VoiceIR schema", () => {
  it("accepts the Smile Dental fixture", () => {
    expect(VoiceIR.safeParse(smileDentalIR()).success).toBe(true);
  });

  it("rejects a first message that does not disclose it is an AI", () => {
    const ir = smileDentalIR();
    ir.persona.firstMessage = "Namaste, Smile Dental, how can I help?";
    const res = VoiceIR.safeParse(ir);
    expect(res.success).toBe(false);
  });

  it("recognises English and Hindi disclosures", () => {
    expect(disclosesAI("I'm an AI assistant")).toBe(true);
    expect(disclosesAI("Main ek AI sahayak hoon")).toBe(true);
    expect(disclosesAI("मैं एक एआई सहायक हूँ")).toBe(true);
    expect(disclosesAI("Hello, this is Priya")).toBe(false);
  });

  it("rejects unknown promise kinds and empty languages", () => {
    const ir = smileDentalIR() as Record<string, unknown>;
    expect(VoiceIR.safeParse({ ...ir, languages: [] }).success).toBe(false);
    expect(
      VoiceIR.safeParse({ ...ir, promises: [{ id: "x", kind: "maybe", text: "t" }] }).success,
    ).toBe(false);
  });

  it("builds an IR from a draft with deterministic tools", () => {
    const { voice, tools, version, ...rest } = smileDentalIR();
    void voice; void tools; void version;
    const draft = VoiceIRDraft.parse(rest);
    const withNumber = draftToIR(draft, "v1", true);
    expect(withNumber.version).toBe(1);
    expect(withNumber.tools.map((t) => t.kind)).toEqual(["end_call", "transfer_to_number"]);
    expect(draftToIR(draft, "v1", false).tools.map((t) => t.kind)).toEqual(["end_call"]);
    expect(defaultTools({ promises: [] }, true)).toHaveLength(1);
  });
});
