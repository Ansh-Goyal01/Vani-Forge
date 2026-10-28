import { ElevenLabsClient, type ElevenLabs } from "@elevenlabs/elevenlabs-js";
import type { AgentPayload } from "./compile";

/**
 * All ElevenLabs calls (server side). Field names verified against the SDK
 * types in node_modules/@elevenlabs/elevenlabs-js (v2.74.0). Keys are read here
 * and nowhere in the browser.
 */

export class ElevenConfigError extends Error {}

export function elevenConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

function client(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new ElevenConfigError("ELEVENLABS_API_KEY is not set. Add it to .env.local.");
  return new ElevenLabsClient({ apiKey });
}

export async function createAgent(payload: AgentPayload): Promise<string> {
  const res = await client().conversationalAi.agents.create({
    name: payload.name,
    conversationConfig: payload.conversationConfig,
    platformSettings: payload.platformSettings,
  });
  return res.agentId;
}

export async function updateAgent(agentId: string, payload: AgentPayload): Promise<void> {
  await client().conversationalAi.agents.update(agentId, {
    name: payload.name,
    conversationConfig: payload.conversationConfig,
    platformSettings: payload.platformSettings,
  });
}

export async function deleteAgent(agentId: string): Promise<void> {
  await client().conversationalAi.agents.delete(agentId);
}

export async function getSignedUrl(agentId: string): Promise<string> {
  const res = await client().conversationalAi.conversations.getSignedUrl({ agentId });
  return res.signedUrl;
}

export type VoiceSummary = {
  voiceId: string;
  name: string;
  previewUrl?: string;
  labels: Record<string, string>;
  description?: string;
};

export async function listVoices(opts: { search?: string; useCase?: string } = {}): Promise<VoiceSummary[]> {
  const res = await client().voices.search({
    pageSize: 100,
    search: opts.search,
    useCases: opts.useCase,
    sort: "name",
  });
  return res.voices.map((v) => ({
    voiceId: v.voiceId,
    name: v.name ?? v.voiceId,
    previewUrl: v.previewUrl,
    labels: v.labels ?? {},
    description: v.description,
  }));
}

/**
 * Credits left. TODO(verify): ElevenLabs bills "credits"; the subscription object
 * exposes them as characterLimit / characterCount (kept for backward compatibility).
 */
export async function getCredits(): Promise<{ remaining: number; used: number; limit: number; tier: string }> {
  const sub = await client().user.subscription.get();
  return {
    remaining: Math.max(0, sub.characterLimit - sub.characterCount),
    used: sub.characterCount,
    limit: sub.characterLimit,
    tier: sub.tier,
  };
}

export async function transcribe(file: Blob): Promise<string> {
  const res = await client().speechToText.convert({ file, modelId: "scribe_v2" });
  // The union also covers multichannel / webhook responses; the single-channel one has `text`.
  if ("text" in res && typeof res.text === "string") return res.text;
  throw new Error("Unexpected transcription response shape"); // TODO(verify)
}

export async function createPronunciationDictionary(
  name: string,
  rules: { grapheme: string; alias: string }[],
): Promise<{ id: string; versionId?: string }> {
  const res = await client().pronunciationDictionaries.createFromRules({
    name,
    rules: rules.map((r) => ({ type: "alias" as const, stringToReplace: r.grapheme, alias: r.alias })),
  });
  return { id: res.id, versionId: res.versionId };
}

export type { ElevenLabs };
