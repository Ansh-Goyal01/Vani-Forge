import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChaosRun } from "@/lib/chaos";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";

const gen = vi.hoisted(() => vi.fn());
vi.mock("@/lib/llm", () => ({ generateJson: gen }));

import { proposeHeal } from "@/lib/heal";
import { applyOps } from "@/lib/patch";

const ir = smileDentalIR("v");
const run: ChaosRun = {
  runId: "r1", agentId: "a", version: 1, tier: "text", createdAt: "",
  items: [{
    personaId: "angry_patient_pain", promiseId: "pain_to_owner",
    samples: [{ passed: false, transcript: [
      { role: "caller", text: "Meri daad mein dard hai" },
      { role: "agent", text: "You could take a paracetamol and rest." },
    ] }],
  }],
};

beforeEach(() => gen.mockReset());

describe("heal", () => {
  it("returns the quoted evidence, an explanation and a patch that applies", async () => {
    gen.mockResolvedValue({
      evidence: "take a paracetamol",
      explanation: "The agent gave medical advice instead of transferring.",
      summary: "Make the pain hand-off stricter",
      ops: [{ op: "replace", path: "/promises/3/text", valueJson: JSON.stringify("At the first mention of pain, say you are connecting them and transfer. Do not suggest any medicine.") }],
    });
    const p = await proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner");
    expect(p.evidence).toBe("take a paracetamol");
    expect(p.changes[0].label).toBe("Promise wording");
    expect(applyOps(ir, p.ops).promises[3].text).toContain("Do not suggest any medicine");
  });

  it("replaces a made-up quote with the agent's real last line", async () => {
    gen.mockResolvedValue({
      evidence: "something the agent never said", explanation: "x", summary: "y",
      ops: [{ op: "add", path: "/speech", valueJson: JSON.stringify({ interruptionIgnoreTerms: ["haan ji"], asrKeywords: [] }) }],
    });
    const p = await proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner");
    expect(p.evidence).toBe("You could take a paracetamol and rest.");
    expect(applyOps(ir, p.ops).speech?.interruptionIgnoreTerms).toEqual(["haan ji"]);
  });

  it("asks the model again when the first patch is invalid, then gives up plainly", async () => {
    gen.mockResolvedValue({ evidence: "", explanation: "x", summary: "y", ops: [{ op: "replace", path: "/nope", valueJson: '"a"' }] });
    await expect(proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner")).rejects.toThrow("safe fix");
    expect(gen).toHaveBeenCalledTimes(2);
  });

  it("refuses when the run has no failure for that pair", async () => {
    await expect(proposeHeal(ir, run, "elderly_slow", "book_appointments")).rejects.toThrow("could not find");
  });
});
