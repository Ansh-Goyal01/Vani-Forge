import { describe, expect, it, vi } from "vitest";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";

vi.hoisted(() => {
  process.env.VANIFORGE_DATA_DIR = `${process.env.TMPDIR ?? "/tmp"}/vf-chaos-${process.pid}-${Date.now()}`;
});

const created: string[] = [];
vi.mock("@/lib/eleven", () => ({
  createSimulationTest: async (i: { name: string }) => (created.push(i.name), `test_${created.length}`),
  runTests: async (_agent: string, ids: string[], k: number) => `inv_${ids.length}_${k}`,
  waitForInvocation: async () => ({
    done: true,
    runs: [
      // first created test (angry/no_medical_advice) fails once out of three
      { testId: "test_1", status: "passed", lines: [{ role: "agent", text: "I can't advise on medicine." }] },
      { testId: "test_1", status: "failed", lines: [{ role: "agent", text: "Take paracetamol." }], rationale: "gave medical advice" },
      { testId: "test_1", status: "passed", lines: [] },
      { testId: "test_2", status: "passed", lines: [] },
      { testId: "test_2", status: "pending", lines: [] },
    ],
  }),
}));

import { rollupByPromise, keptLabel } from "@/lib/chaos";
import { runTextChaos } from "@/lib/text-chaos";
import * as store from "@/lib/store";

describe("text tier", () => {
  it("creates one test per persona+promise, runs them k times and aggregates 'kept n of m'", async () => {
    const ir = smileDentalIR("v");
    const run = await runTextChaos("agent_x", ir, { personaIds: ["angry_patient_pain"], k: 3 });
    expect(created).toHaveLength(2);
    const first = run.items.find((i) => i.promiseId === "no_medical_advice")!;
    expect(first.samples.map((s) => s.passed)).toEqual([true, false, true]);
    expect(keptLabel(rollupByPromise(run).find((r) => r.promiseId === "no_medical_advice")!.tally)).toBe("kept 2 of 3");
    // pending runs are dropped, not counted
    expect(run.items.find((i) => i.promiseId === "pain_to_owner")!.samples).toHaveLength(1);
    expect((await store.listRuns("agent_x"))[0].runId).toBe(run.runId);
  });

  it("reuses created tests on the next run", async () => {
    const before = created.length;
    await runTextChaos("agent_x", smileDentalIR("v"), { personaIds: ["angry_patient_pain"] });
    expect(created.length).toBe(before);
  });
});
