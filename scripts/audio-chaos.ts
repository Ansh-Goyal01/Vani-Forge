import { runAudioChaos } from "../src/lib/audio-chaos";
import { keptLabel, personaName, tally } from "../src/lib/chaos";
import { PERSONA_IDS } from "../src/lib/personas";
import { getCreditStatus, getAgentState } from "../src/lib/service";
import { loadEnv } from "./env";

// Usage: npm run audio-chaos -- <agentId> [personaId ...]
// Places real calls (about 30-60 s of agent time per persona). Persona TTS is cached in data/audio.
loadEnv();

async function main() {
  const [agentId, ...personaIds] = process.argv.slice(2);
  if (!agentId) {
    console.log(`Usage: npm run audio-chaos -- <agentId> [personaId ...]\nPersonas: ${PERSONA_IDS.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const credits = await getCreditStatus();
  if (!credits.guard.allowed) {
    console.log("Blocked: " + credits.guard.reason);
    process.exitCode = 1;
    return;
  }
  const state = await getAgentState(agentId);
  if (!state) {
    console.log("No such agent in data/agents. Create one in the app or run `npm run seed`.");
    process.exitCode = 1;
    return;
  }
  const run = await runAudioChaos(agentId, state.ir, { personaIds: personaIds.length ? personaIds : undefined });
  console.log(`Run ${run.runId} (version ${run.version})`);
  for (const item of run.items) {
    const s = item.samples[0];
    console.log(`\n${personaName(state.ir, item.personaId)} / ${item.promiseId}: ${s.unscored ? "no score" : keptLabel(tally(item))}`);
    for (const h of s.heard ?? []) console.log(`  caller said: ${h.said}\n  agent heard: ${h.heard || "(nothing)"}`);
    if (s.rationale) console.log(`  note: ${s.rationale}`);
  }
  if (run.error) console.log(`\nwarning: ${run.error}`);
}

main().catch((e) => {
  console.error("audio-chaos failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
