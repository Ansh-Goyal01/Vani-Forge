import { keptLabel, rollupByPromise } from "../src/lib/chaos";
import { listVoices } from "../src/lib/eleven";
import { smileDentalIR } from "../src/lib/fixtures/smile-dental";
import { createAgentFromIR, getCreditStatus } from "../src/lib/service";
import { runTextChaos } from "../src/lib/text-chaos";
import { loadEnv } from "./env";

// Creates the Smile Dental agent and runs one text-tier chaos pass so the demo never starts from zero.
// The Smile Dental VoiceIR is the fictional hero use case; results come from real runs only.
loadEnv();

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log("ELEVENLABS_API_KEY is missing. Run `npm run check-env`.");
    process.exit(1);
  }
  const credits = await getCreditStatus();
  console.log(`Credits left: ${credits.remaining ?? "unknown"}`);

  const voices = await listVoices();
  if (voices.length === 0) throw new Error("No voices available.");
  const ir = smileDentalIR(voices[0].voiceId);
  ir.tools = ir.tools.filter((t) => t.kind !== "transfer_to_number" || process.env.OWNER_TRANSFER_NUMBER?.trim());

  const { agentId } = await createAgentFromIR(ir);
  console.log(`Created agent ${agentId} (open /studio/${agentId})`);

  console.log("Running text-tier chaos (4 callers x k=3), this can take a few minutes...");
  const run = await runTextChaos(agentId, ir);
  for (const r of rollupByPromise(run)) {
    const text = ir.promises.find((p) => p.id === r.promiseId)?.text ?? r.promiseId;
    console.log(`  ${keptLabel(r.tally)}: ${text}`);
  }
  if (run.error) console.log(`warning: ${run.error}`);
  console.log("Done. Open the Chaos tab to heal any failures, then run the audio test.");
}

main().catch((e) => {
  console.error("seed failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
