import { compile } from "../src/lib/compile";
import {
  createAgent,
  createPronunciationDictionary,
  deleteAgent,
  getCredits,
  getSignedUrl,
  listVoices,
} from "../src/lib/eleven";
import { smileDentalIR } from "../src/lib/fixtures/smile-dental";
import { loadEnv, VARS } from "./env";

// No voice call is placed: this never opens a conversation, so it spends no call credits.
loadEnv();

const results: { step: string; ok: boolean; detail: string }[] = [];
async function step<T>(name: string, fn: () => Promise<T>, detail: (v: T) => string): Promise<T | undefined> {
  try {
    const v = await fn();
    results.push({ step: name, ok: true, detail: detail(v) });
    console.log(`PASS  ${name}: ${detail(v)}`);
    return v;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ step: name, ok: false, detail: msg });
    console.log(`FAIL  ${name}: ${msg}`);
    return undefined;
  }
}

async function main() {
  const missing = VARS.filter((v) => v.required && !process.env[v.name]?.trim()).map((v) => v.name);
  if (missing.includes("ELEVENLABS_API_KEY")) {
    console.log("FAIL  env: ELEVENLABS_API_KEY is missing. Add it to .env.local and run `npm run check-env`.");
    process.exit(1);
  }
  if (missing.length) console.log(`warn  env: ${missing.join(", ")} missing (Gemini is not used by smoke).`);

  const voices = await step("list voices", () => listVoices(), (v) => `${v.length} voices`);
  const voice = voices?.[0];
  if (!voice) process.exit(1);

  const ir = smileDentalIR(voice.voiceId);
  const dict = await step(
    "create pronunciation dictionary",
    () => createPronunciationDictionary("VaniForge smoke", ir.lexicon),
    (d) => d.id,
  );
  const payload = compile(ir, {
    transferNumber: process.env.OWNER_TRANSFER_NUMBER?.trim() || undefined,
    pronunciationDictionaryLocators: dict ? [{ pronunciationDictionaryId: dict.id, versionId: dict.versionId }] : [],
  });
  payload.name = "VaniForge smoke (delete me)";

  const agentId = await step("create throwaway agent", () => createAgent(payload), (id) => id);
  if (agentId) {
    await step("mint signed URL", () => getSignedUrl(agentId), (u) => `ok (${u.length} chars, not printed)`);
  }
  await step("read credit balance", () => getCredits(), (c) => `${c.remaining} left of ${c.limit} (${c.tier})`);
  if (agentId) await step("delete agent", () => deleteAgent(agentId), () => "deleted");

  const failed = results.filter((r) => !r.ok).length;
  console.log(failed === 0 ? "\nSmoke passed." : `\nSmoke failed: ${failed} step(s).`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
