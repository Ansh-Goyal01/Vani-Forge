import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { criterionId } from "./compile";
import { planPairs, type ChaosItem, type ChaosRun, type Sample } from "./chaos";
import { getConversation, getSignedUrl, listVoices, ttsPcm16k, type VoiceSummary } from "./eleven";
import { sha256 } from "./hash";
import { spokenText, type Persona, type Step } from "./personas";
import * as store from "./store";
import type { VoiceIR } from "./voiceir";

/**
 * Audio tier. Persona lines are generated once with TTS (pcm_16000, cached), then
 * streamed to the agent's WebSocket as `user_audio_chunk` messages at real-time pace.
 * Event names/payloads follow the SDK's own client code (@elevenlabs/client):
 *   in:  conversation_initiation_metadata, user_transcript, agent_response, interruption, ping
 *   out: user_audio_chunk (base64 pcm), pong, conversation_initiation_client_data
 */

const SAMPLE_RATE = 16000;
const CHUNK_MS = 100;
const CHUNK_BYTES = (SAMPLE_RATE * 2 * CHUNK_MS) / 1000; // 16-bit mono
export const AUDIO_K = 1;
const REPLY_TIMEOUT_MS = 12_000;
const END_SILENCE_MS = 1500;

type ServerEvent = {
  type?: string;
  ping_event?: { event_id?: number };
  user_transcription_event?: { user_transcript?: string };
  agent_response_event?: { agent_response?: string };
  conversation_initiation_metadata_event?: { conversation_id?: string };
};

type TimelineEvent =
  | { t: number; kind: "said"; text: string; turn: number }
  | { t: number; kind: "heard"; text: string }
  | { t: number; kind: "agent"; text: string }
  | { t: number; kind: "interruption" };

export type AudioPersonaRun = {
  personaId: string;
  conversationId?: string;
  timeline: TimelineEvent[];
  error?: string;
};

export function pickVoice(voices: VoiceSummary[], hint: Persona["voiceHint"]): VoiceSummary | undefined {
  const sorted = [...voices].sort((a, b) => a.name.localeCompare(b.name));
  const score = (v: VoiceSummary) =>
    (hint.gender && v.labels.gender === hint.gender ? 2 : 0) + (hint.age && v.labels.age === hint.age ? 1 : 0);
  return sorted.sort((a, b) => score(b) - score(a))[0]; // stable: ties keep name order
}

async function cachedPcm(voiceId: string, text: string): Promise<Buffer> {
  const hash = sha256(`${voiceId}|eleven_flash_v2_5|pcm_16000|${text}`).slice(0, 40);
  const hit = await store.readAudio(hash);
  if (hit) return hit; // never regenerate a cached line
  const pcm = await ttsPcm16k(voiceId, text);
  await store.writeAudio(hash, pcm);
  return pcm;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function runAudioPersona(agentId: string, persona: Persona, voiceId: string): Promise<AudioPersonaRun> {
  // Generate (or load) every line before dialling, so TTS time never delays the call.
  const prepared: { turn: number; step: Step; pcm?: Buffer }[] = [];
  for (const [turn, steps] of persona.turns.entries()) {
    for (const step of steps) prepared.push({ turn, step, pcm: "say" in step ? await cachedPcm(voiceId, step.say) : undefined });
  }

  const signedUrl = await getSignedUrl(agentId);
  const started = Date.now();
  const timeline: TimelineEvent[] = [];
  const out: AudioPersonaRun = { personaId: persona.id, timeline };
  const now = () => Date.now() - started;

  const ws = new WebSocket(signedUrl);
  let lastAgentAt = 0;
  let agentSpoke = 0;

  ws.on("message", (raw) => {
    let msg: ServerEvent;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "conversation_initiation_metadata":
        out.conversationId = msg.conversation_initiation_metadata_event?.conversation_id;
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong", event_id: msg.ping_event?.event_id }));
        break;
      case "user_transcript":
        timeline.push({ t: now(), kind: "heard", text: msg.user_transcription_event?.user_transcript ?? "" });
        break;
      case "agent_response":
        lastAgentAt = now();
        agentSpoke++;
        timeline.push({ t: now(), kind: "agent", text: msg.agent_response_event?.agent_response ?? "" });
        break;
      case "interruption":
        timeline.push({ t: now(), kind: "interruption" });
        break;
    }
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", (e) => reject(new Error("Could not open the call: " + e.message)));
  });
  // TODO(verify): the docs show sending conversation_initiation_client_data first; the agent also works without overrides.
  ws.send(JSON.stringify({ type: "conversation_initiation_client_data" }));

  const sendAudio = async (pcm: Buffer) => {
    for (let i = 0; i < pcm.length; i += CHUNK_BYTES) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ user_audio_chunk: pcm.subarray(i, i + CHUNK_BYTES).toString("base64") }));
      await sleep(CHUNK_MS); // real-time pace
    }
  };
  const sendSilence = (ms: number) => sendAudio(Buffer.alloc(((SAMPLE_RATE * 2 * ms) / 1000) | 0));

  try {
    // Let the agent finish its greeting first.
    const greetDeadline = Date.now() + REPLY_TIMEOUT_MS;
    while (agentSpoke === 0 && Date.now() < greetDeadline && ws.readyState === WebSocket.OPEN) await sleep(200);
    await sendSilence(1500);

    let currentTurn = -1;
    for (const { turn, step, pcm } of prepared) {
      if (ws.readyState !== WebSocket.OPEN) throw new Error("The agent hung up the call.");
      if (turn !== currentTurn) {
        // End of the previous turn: leave silence so the agent's turn detection fires, wait for the reply.
        if (currentTurn !== -1) await awaitReply();
        currentTurn = turn;
      }
      if ("pause" in step) await sendSilence(step.pause);
      else {
        timeline.push({ t: now(), kind: "said", text: step.say, turn });
        await sendAudio(pcm!);
      }
    }
    await awaitReply();
  } catch (e) {
    out.error = (e as Error).message;
  } finally {
    ws.close();
  }

  async function awaitReply() {
    const before = agentSpoke;
    await sendSilence(END_SILENCE_MS);
    const deadline = Date.now() + REPLY_TIMEOUT_MS;
    while (agentSpoke === before && Date.now() < deadline && ws.readyState === WebSocket.OPEN) await sleep(200);
    // let a streamed reply finish
    while (now() - lastAgentAt < 2500 && Date.now() < deadline + 4000 && ws.readyState === WebSocket.OPEN) await sleep(300);
  }

  return out;
}

/** Turns a timeline into "caller said X / agent heard Y" pairs and a plain transcript. */
export function summariseTimeline(persona: Persona, timeline: TimelineEvent[]) {
  const heard: { said: string; heard: string }[] = [];
  const transcript: Sample["transcript"] = [];
  const turnStart = new Map<number, number>();
  for (const e of timeline) if (e.kind === "said" && !turnStart.has(e.turn)) turnStart.set(e.turn, e.t);
  const starts = [...turnStart.entries()].sort((a, b) => a[0] - b[0]);
  starts.forEach(([turn, t0], i) => {
    const t1 = starts[i + 1]?.[1] ?? Infinity;
    heard.push({
      said: spokenText(persona.turns[turn] ?? []),
      heard: timeline.filter((e) => e.kind === "heard" && e.t >= t0 && e.t < t1).map((e) => (e as { text: string }).text).join(" ").trim(),
    });
  });
  for (const e of timeline) {
    if (e.kind === "said") transcript.push({ role: "caller", text: e.text });
    else if (e.kind === "agent") transcript.push({ role: "agent", text: e.text });
    else if (e.kind === "interruption") transcript.push({ role: "agent", text: "[the caller interrupted the agent]" });
  }
  return { heard, transcript };
}

/** Runs the audio tier for the selected personas (k = 1). Per-promise results come from ElevenLabs conversation analysis. */
export async function runAudioChaos(agentId: string, ir: VoiceIR, opts: { personaIds?: string[] } = {}): Promise<ChaosRun> {
  const run: ChaosRun = { runId: randomUUID().slice(0, 8), agentId, version: ir.version, tier: "audio", createdAt: new Date().toISOString(), items: [] };
  const pairs = planPairs(ir, opts.personaIds);
  const personas = [...new Map(pairs.map((p) => [p.persona.id, p.persona])).values()];
  if (personas.length === 0) {
    run.error = "This agent has no promises that the selected callers test.";
    await store.saveRun(run);
    return run;
  }
  const voices = await listVoices();

  for (const persona of personas) {
    const voice = pickVoice(voices, persona.voiceHint);
    if (!voice) {
      run.error = "No stock voice was available for the callers.";
      break;
    }
    const call = await runAudioPersona(agentId, persona, voice.voiceId);
    const { heard, transcript } = summariseTimeline(persona, call.timeline);
    const relevant = pairs.filter((p) => p.persona.id === persona.id);

    let criteria: { criteriaId: string; result: string; rationale: string }[] = [];
    if (call.conversationId) {
      // Analysis is produced after the call ends; poll briefly.
      for (let i = 0; i < 15 && criteria.length === 0; i++) {
        await sleep(4000);
        try {
          criteria = (await getConversation(call.conversationId)).criteria;
        } catch {
          /* not ready yet */
        }
      }
    }
    for (const { promise } of relevant) {
      const crit = criteria.find((c) => c.criteriaId === criterionId(promise.id));
      const item: ChaosItem = {
        personaId: persona.id,
        promiseId: promise.id,
        samples: [
          {
            passed: crit?.result === "success",
            unscored: !crit || crit.result === "unknown",
            transcript,
            heard,
            rationale: crit ? crit.rationale : (call.error ?? "No score came back for this call."),
          },
        ],
      };
      run.items.push(item);
    }
    if (call.error) run.error = `${persona.name}: ${call.error}`;
  }
  await store.saveRun(run);
  return run;
}
