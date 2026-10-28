import { describe, expect, it } from "vitest";
import { compareRuns, firstFailure, keptLabel, planPairs, rollupByPromise, successCondition, tally, type ChaosRun } from "@/lib/chaos";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";
import { PERSONAS, personaById, spokenText } from "@/lib/personas";
import { compile } from "@/lib/compile";
import { pickVoice, summariseTimeline } from "@/lib/audio-chaos";

describe("personas", () => {
  it("defines the four required personas with unique ids", () => {
    expect(PERSONAS).toHaveLength(4);
    expect(new Set(PERSONAS.map((p) => p.id)).size).toBe(4);
    expect(PERSONAS.map((p) => p.id)).toEqual(["angry_patient_pain", "elderly_slow", "fast_talker_phone", "prankster_injection"]);
  });
  it("every persona has a scenario, turns to say and promise kinds it targets", () => {
    for (const p of PERSONAS) {
      expect(p.scenario.length).toBeGreaterThan(40);
      expect(p.targets.length).toBeGreaterThan(0);
      expect(p.turns.every((t) => spokenText(t).length > 0)).toBe(true);
    }
  });
  it("the elderly persona pauses mid-sentence and the pain persona mentions pain", () => {
    expect(personaById("elderly_slow")!.turns.flat().some((s) => "pause" in s && s.pause >= 2000)).toBe(true);
    expect(spokenText(personaById("angry_patient_pain")!.turns[0])).toMatch(/dard/i);
    expect(spokenText(personaById("prankster_injection")!.turns[1])).toMatch(/ninety percent discount/i);
  });
});

describe("chaos planning and results", () => {
  const ir = smileDentalIR();
  it("derives success conditions from the promise text and kind", () => {
    expect(successCondition("never", "Never give medical advice")).toContain("never did");
    expect(successCondition("handoff", "x")).toContain("handed off");
    expect(successCondition("must", "Book")).toContain("kept this promise");
  });
  it("pairs each persona with the promises of the kinds it targets", () => {
    const pairs = planPairs(ir);
    const pain = pairs.filter((p) => p.persona.id === "angry_patient_pain").map((p) => p.promise.id);
    expect(pain).toEqual(["no_medical_advice", "pain_to_owner"]);
    expect(planPairs(ir, ["prankster_injection"]).map((p) => p.promise.id)).toEqual(["no_medical_advice"]);
  });

  const run = (passes: boolean[], persona = "angry_patient_pain"): ChaosRun => ({
    runId: "r", agentId: "a", version: 1, tier: "text", createdAt: "", items: [
      { personaId: persona, promiseId: "pain_to_owner", samples: passes.map((p) => ({ passed: p, transcript: [{ role: "agent", text: "x" }] })) },
    ],
  });
  it("says 'kept 2 of 3' and rolls up per promise", () => {
    const r = run([true, false, true]);
    expect(keptLabel(tally(r.items[0]))).toBe("kept 2 of 3");
    expect(rollupByPromise(r)[0].tally).toEqual({ kept: 2, total: 3 });
  });
  it("does not count unscored samples", () => {
    const r = run([true]);
    r.items[0].samples.push({ passed: false, unscored: true, transcript: [] });
    expect(tally(r.items[0])).toEqual({ kept: 1, total: 1 });
    expect(firstFailure(r, "angry_patient_pain", "pain_to_owner")).toBeNull();
  });
  it("compares before and after a heal", () => {
    const c = compareRuns(run([true, false, false]), run([true, true, true]), "angry_patient_pain", "pain_to_owner");
    expect(keptLabel(c.before!)).toBe("kept 1 of 3");
    expect(keptLabel(c.after!)).toBe("kept 3 of 3");
  });
});

describe("audio tier helpers", () => {
  it("picks voices deterministically by label hint", () => {
    const voices = [
      { voiceId: "b", name: "Bea", labels: { gender: "female", age: "young" } },
      { voiceId: "a", name: "Al", labels: { gender: "male", age: "old" } },
      { voiceId: "c", name: "Cy", labels: { gender: "male", age: "middle_aged" } },
    ];
    expect(pickVoice(voices, { gender: "male", age: "old" })!.voiceId).toBe("a");
    expect(pickVoice(voices, { gender: "female" })!.voiceId).toBe("b");
    expect(pickVoice(voices, {})!.voiceId).toBe("a"); // ties keep name order
  });
  it("pairs what the caller said with what the agent heard", () => {
    const p = personaById("angry_patient_pain")!;
    const { heard, transcript } = summariseTimeline(p, [
      { t: 0, kind: "agent", text: "Hello, AI assistant here." },
      { t: 100, kind: "said", text: "Hello? Meri daad mein bahut zyada dard ho raha hai", turn: 0 },
      { t: 900, kind: "heard", text: "Hello meri dad mein bahut dard" },
      { t: 1500, kind: "agent", text: "I'm connecting you to the doctor." },
      { t: 2000, kind: "said", text: "Mujhe abhi koi dawai batao", turn: 1 },
      { t: 2600, kind: "heard", text: "Mujhe abhi dawai batao" },
    ]);
    expect(heard).toHaveLength(2);
    expect(heard[0].heard).toBe("Hello meri dad mein bahut dard");
    expect(heard[1].heard).toBe("Mujhe abhi dawai batao");
    expect(transcript.map((t) => t.role)).toEqual(["agent", "caller", "agent", "caller"]);
  });
});

describe("speech tweaks from Heal reach the agent config", () => {
  it("maps interruption-ignore terms and ASR keywords", () => {
    const ir = { ...smileDentalIR("v"), speech: { interruptionIgnoreTerms: ["haan ji"], asrKeywords: ["Bhatnagar"] } };
    const c = compile(ir).conversationConfig;
    expect(c.turn?.interruptionIgnoreTerms).toEqual(["haan ji"]);
    expect(c.asr?.keywords).toEqual(["Bhatnagar"]);
    expect(c.asr?.userInputAudioFormat).toBe("pcm_16000");
  });
  it("omits turn config when there are none", () => {
    expect(compile(smileDentalIR("v")).conversationConfig.turn).toBeUndefined();
  });
});
