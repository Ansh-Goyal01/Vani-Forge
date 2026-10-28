"use client";

import { useState } from "react";
import { Notice } from "../ui";
import type { AgentState } from "./Studio";

const SCRIPT = "https://unpkg.com/@elevenlabs/convai-widget-embed";

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => setDone(false),
        );
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function DeployTab({ agentId, state }: { agentId: string; state: AgentState }) {
  const link = typeof window === "undefined" ? `/a/${agentId}` : `${window.location.origin}/a/${agentId}`;
  const snippet = `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>\n<script src="${SCRIPT}" async type="text/javascript"></script>`;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-3xl font-semibold">Share a test page.</h2>
        <p className="mt-2 max-w-2xl text-mute">Anyone with this link can talk to your agent in their browser. It only works while this app is reachable at that address.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rule rounded-card bg-card px-3 py-2 font-mono text-sm">{link}</code>
          <Copy text={link} label="Copy link" />
          <a className="btn" href={`/a/${agentId}`} target="_blank" rel="noreferrer">Open</a>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Put it on your website.</h2>
        <p className="mt-2 max-w-2xl text-mute">Paste this where you want the call button to appear.</p>
        <pre className="panel-dark mt-4 overflow-auto p-4 font-mono text-xs">{snippet}</pre>
        <div className="mt-3">
          <Copy text={snippet} label="Copy snippet" />
        </div>
        <p className="mt-3 text-sm text-mute">Public embeds need the agent to allow public access (the default). Calls from the page spend your ElevenLabs credits.</p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Answer a real phone number.</h2>
        <Notice>No phone number is connected yet. This prototype has no number, so the steps below are documented but not done.</Notice>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-mute">
          <li>Buy or port a number with Twilio or Exotel (Exotel suits Indian numbers).</li>
          <li>In the ElevenLabs dashboard open Agents, then Phone Numbers, and choose Import number (Twilio or SIP trunk for Exotel).</li>
          <li>Enter the number and the provider credentials, then save.</li>
          <li>Open the number, assign agent <code className="font-mono text-ink">{agentId}</code>, and save.</li>
          <li>Call the number from your phone to test.</li>
        </ol>
        <button type="button" className="btn mt-4" disabled>Phone: not connected</button>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Hand-off to you.</h2>
        {state.transferNumberSet ? (
          <p className="mt-2 text-mute">A transfer number is set. Calls that match a hand-off promise are transferred to it.</p>
        ) : (
          <Notice>Transfer number not set. Set OWNER_TRANSFER_NUMBER (with country code, like +91...) in .env.local and create or update the agent to turn on live transfer.</Notice>
        )}
      </section>
    </div>
  );
}
