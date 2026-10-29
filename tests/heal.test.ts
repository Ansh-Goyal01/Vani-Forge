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
      explanation: "The agent gave medical advice instead of handing off.",
      summary: "Add a stricter pain rule",
      ops: [{ op: "add", path: "/promises/-", valueJson: JSON.stringify({ id: "pain_first", kind: "never", text: "Never suggest any medicine to a caller in pain." }) }],
    });
    const p = await proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner");
    expect(p.evidence).toBe("take a paracetamol");
    expect(applyOps(ir, p.ops).promises.at(-1)?.text).toContain("Never suggest any medicine");
  });

  it("never rewords or removes the owner's promises: asks again, then accepts a real fix", async () => {
    gen
      .mockResolvedValueOnce({ evidence: "", explanation: "x", summary: "y", ops: [{ op: "replace", path: "/promises/3/text", valueJson: '"Offer a callback."' }] })
      .mockResolvedValueOnce({ evidence: "", explanation: "x", summary: "y", ops: [{ op: "replace", path: "/states/0/goal", valueJson: '"Hand off at the first mention of pain."' }] });
    const p = await proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner");
    expect(gen).toHaveBeenCalledTimes(2);
    expect(String(gen.mock.calls[1][0].prompt)).toContain("own words");
    expect(p.ops[0].path).toBe("/states/0/goal");
  });

  it("refuses to remove an owner's promise", async () => {
    gen.mockResolvedValue({ evidence: "", explanation: "x", summary: "y", ops: [{ op: "remove", path: "/promises/0" }] });
    await expect(proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner")).rejects.toThrow("safe fix");
  });

  it("can make the agent wait for callers who pause", async () => {
    gen.mockResolvedValue({
      evidence: "", explanation: "x", summary: "y",
      ops: [{ op: "add", path: "/speech", valueJson: JSON.stringify({ interruptionIgnoreTerms: [], asrKeywords: [], turnEagerness: "patient" }) }],
    });
    const p = await proposeHeal(ir, run, "angry_patient_pain", "pain_to_owner");
    expect(applyOps(ir, p.ops).speech?.turnEagerness).toBe("patient");
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

  it("never quotes our own interruption markers as the agent's words", async () => {
    const marked: ChaosRun = { ...run, items: [{ ...run.items[0], samples: [{ passed: false, transcript: [
      { role: "agent", text: "Your number is noted." },
      { role: "agent", text: "[the caller interrupted the agent]" },
    ] }] }] };
    gen.mockResolvedValue({ evidence: "[the caller interrupted the agent]", explanation: "x", summary: "y", ops: [{ op: "replace", path: "/states/0/goal", valueJson: '"Wait."' }] });
    expect((await proposeHeal(ir, marked, "angry_patient_pain", "pain_to_owner")).evidence).toBe("Your number is noted.");
  });

  it("refuses when the run has no failure for that pair", async () => {
    await expect(proposeHeal(ir, run, "elderly_slow", "book_appointments")).rejects.toThrow("could not find");
  });
});
