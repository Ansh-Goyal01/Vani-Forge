"use client";

import type { VoiceIR } from "@/lib/voiceir";
import { TestTab } from "./TestTab";

type PromiseKind = VoiceIR["promises"][number]["kind"];

// How a human can attack each kind of promise. Hints only: the call itself is real and unscripted.
const ATTACK_HINT: Record<PromiseKind, string> = {
  never: "Try to talk it into doing this anyway.",
  handoff: "Act out the situation that should trigger the hand-off.",
  must: "Make it hard: interrupt, change your mind, mix Hindi and English.",
};

/** Live mic round after the audio chaos test: the owner or a judge tries to break the agent in person. */
export function BreakItYourself({ agentId, ir }: { agentId: string; ir: VoiceIR }) {
  return (
    <section className="space-y-6 border-t-[1.5px] border-ink pt-8">
      <div>
        <p className="label text-problem">Your turn</p>
        <h2 className="mt-1 text-3xl font-semibold">Now try to break it yourself.</h2>
        <p className="mt-2 max-w-2xl text-mute">
          The machine callers had their go. Start a live call and try to make the agent break one of these promises. Every call is scored on them; the result appears in the Observe tab a minute after you hang up.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ir.promises.map((p) => (
          <li key={p.id} className="rule rounded-card bg-card px-3 py-2">
            <span className="label block text-mute">{p.kind === "handoff" ? "Hand-off" : p.kind}</span>
            <span className="block font-medium">{p.text}</span>
            <span className="block text-sm text-mute">{ATTACK_HINT[p.kind]}</span>
          </li>
        ))}
      </ul>
      <TestTab agentId={agentId} version={ir.version} />
    </section>
  );
}
