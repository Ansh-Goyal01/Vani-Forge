import Script from "next/script";
import { getAgentState } from "@/lib/service";
import { safeId } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public test page: anyone with the link can talk to the agent through the ElevenLabs widget. */
export default async function PublicAgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const agentId = safeId((await params).agentId);
  const state = await getAgentState(agentId).catch(() => null);
  const name = state?.ir.business.name;

  return (
    <section className="mx-auto max-w-2xl py-10">
      <p className="label text-mute">Voice assistant test page</p>
      <h1 className="mt-2 text-4xl font-semibold">{name ? `Talk to ${name}` : "Talk to this voice assistant"}</h1>
      <p className="mt-4 text-mute">
        This is an AI assistant. Press the call button in the corner and allow your microphone. Please do not share real personal details while it is being tested.
      </p>
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" async />
      {/* @ts-expect-error custom element from the ElevenLabs embed script */}
      <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
    </section>
  );
}
