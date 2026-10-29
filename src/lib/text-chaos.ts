import { randomUUID } from "node:crypto";
import { factsLine, planPairs, successCondition, type ChaosItem, type ChaosRun } from "./chaos";
import { createSimulationTest, runTests, waitForInvocation } from "./eleven";
import { sha256 } from "./hash";
import * as store from "./store";
import type { VoiceIR } from "./voiceir";

export const TEXT_K = 3;

/**
 * Text tier: ElevenLabs simulation tests (a simulated caller talks to the live agent).
 * One test per persona x promise, each run k times. Tests are created once and reused.
 */
export async function runTextChaos(agentId: string, ir: VoiceIR, opts: { personaIds?: string[]; k?: number } = {}): Promise<ChaosRun> {
  const k = opts.k ?? TEXT_K;
  const pairs = planPairs(ir, opts.personaIds);
  const run: ChaosRun = { runId: randomUUID().slice(0, 8), agentId, version: ir.version, tier: "text", createdAt: new Date().toISOString(), items: [] };
  if (pairs.length === 0) {
    run.error = "This agent has no promises that the selected callers test.";
    await store.saveRun(run);
    return run;
  }

  const ids = await store.getTestIds(agentId);
  const testFor = new Map<string, (typeof pairs)[number]>();
  for (const pair of pairs) {
    const condition = successCondition(pair.promise.kind, pair.promise.text, {
      transferNumberSet: Boolean(process.env.OWNER_TRANSFER_NUMBER?.trim()),
      facts: factsLine(ir),
    });
    const key = `${pair.persona.id}:${pair.promise.id}:${sha256(condition + pair.persona.scenario).slice(0, 10)}`;
    if (!ids[key]) {
      ids[key] = await createSimulationTest({
        name: `VaniForge ${agentId.slice(-6)} ${pair.persona.id} ${pair.promise.id} ${key.slice(-4)}`,
        scenario: pair.persona.scenario,
        successCondition: condition,
      });
      await store.saveTestIds(agentId, ids);
    }
    testFor.set(ids[key], pair);
  }

  const invocationId = await runTests(agentId, [...testFor.keys()], k);
  const { done, runs } = await waitForInvocation(invocationId);
  if (!done) run.error = "Some runs were still going when we stopped waiting. Results below are partial.";

  const items = new Map<string, ChaosItem>();
  for (const r of runs) {
    const pair = testFor.get(r.testId);
    if (!pair || r.status === "pending" || r.status === "cancelled") continue;
    const key = `${pair.persona.id}:${pair.promise.id}`;
    const item = items.get(key) ?? { personaId: pair.persona.id, promiseId: pair.promise.id, samples: [] };
    item.samples.push({ passed: r.status === "passed", transcript: r.lines, rationale: r.rationale });
    items.set(key, item);
  }
  run.items = [...items.values()];
  await store.saveRun(run);
  return run;
}
