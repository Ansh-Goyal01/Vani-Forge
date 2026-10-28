"use client";

import { ConversationProvider, useConversationControls, useConversationMode, useConversationStatus } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TEST_CALL_SECONDS } from "@/lib/credits";
import { useCredits } from "../CreditsBadge";
import { Notice, Waveform, XRay, api } from "../ui";

type Line = { id: number; kind: "user" | "agent" | "interrupt"; text: string };

type Props = { agentId: string; version: number };

export function TestTab(props: Props) {
  return (
    <ConversationProvider>
      <TestConsole {...props} />
    </ConversationProvider>
  );
}

function plainError(message: string): string {
  if (/permission|notallowed|denied|microphone/i.test(message)) {
    return "We could not use your microphone. Allow microphone access in the browser bar, then press Start again.";
  }
  if (/network|websocket|socket|closed|timeout/i.test(message)) {
    return "The connection dropped. Check your internet and press Start to try again.";
  }
  return "The call could not continue. Press Start to try again; X-Ray below has the technical detail.";
}

function TestConsole({ agentId, version }: Props) {
  const { startSession, endSession, getOutputByteFrequencyData } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { credits, setOverride } = useCredits();

  const [lines, setLines] = useState<Line[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectingUrl, setConnectingUrl] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const nextId = useRef(0);

  const pushLog = useCallback((tag: string, payload: unknown) => {
    // Audio chunks are large and noisy: only note that they arrived.
    const type = (payload as { type?: string } | null)?.type;
    const body = type === "audio" ? "[audio chunk]" : JSON.stringify(payload);
    setLog((l) => [...l.slice(-299), `${new Date().toLocaleTimeString()} ${tag} ${body.slice(0, 400)}`]);
  }, []);

  const connected = status === "connected";

  // 90-second countdown, ends the call at zero.
  useEffect(() => {
    if (!connected) return;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const left = Math.max(0, TEST_CALL_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsLeft(left);
      if (left === 0) endSession();
    }, 250);
    return () => {
      clearInterval(tick);
      setSecondsLeft(null);
    };
  }, [connected, endSession]);

  // Drives the orange bars from real output audio, not a canned animation.
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => {
      const data = getOutputByteFrequencyData();
      let sum = 0;
      for (const v of data) sum += v;
      setSpeakingLevel(data.length ? sum / data.length / 255 : 0);
    }, 120);
    return () => clearInterval(t);
  }, [connected, getOutputByteFrequencyData]);

  async function start() {
    setError(null);
    setLines([]);
    setLog([]);
    setPingMs(null);
    setConnectingUrl(true);
    try {
      const { signedUrl } = await api<{ signedUrl: string }>(`/api/signed-url?agentId=${encodeURIComponent(agentId)}`);
      startSession({
        signedUrl,
        connectionType: "websocket",
        onMessage: (m) =>
          setLines((l) => [...l, { id: nextId.current++, kind: m.role === "user" ? "user" : "agent", text: m.message }]),
        onInterruption: () => setLines((l) => [...l, { id: nextId.current++, kind: "interrupt", text: "You interrupted" }]),
        onPing: (p) => typeof p?.ping_ms === "number" && setPingMs(Math.round(p.ping_ms)),
        onError: (message) => setError(plainError(String(message))),
        onDisconnect: (d) => {
          if (d.reason === "error") setError(plainError(d.message));
        },
        onIncomingEvent: (e) => pushLog("<-", e),
        onOutgoingEvent: (e) => pushLog("->", e),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConnectingUrl(false);
    }
  }

  const blocked = credits ? !credits.guard.allowed : false;
  const busy = connectingUrl || status === "connecting";

  return (
    <div className="space-y-6">
      <div className="panel-dark on-dark grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <Waveform level={speakingLevel} active={connected} />
        <div>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label flex items-center gap-2 text-paper/80">
                {(connected || busy) && <span aria-hidden className="live-dot inline-block h-2 w-2 rounded-full bg-signal" />}
                {connected ? "Live" : busy ? "Dialling" : "Ready"} · version {version}
              </p>
              <p className="font-display text-3xl">
                {connected ? (isSpeaking ? "Agent is speaking" : "Agent is listening") : busy ? "Connecting..." : "Not on a call"}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="label text-paper/80">Estimated latency</p>
              <p className="font-mono text-lg">{pingMs !== null ? `${pingMs} ms` : "not measured yet"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {connected ? (
              <button type="button" className="btn btn-primary" onClick={() => endSession()}>End call</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={start} disabled={busy || blocked}>
                {busy ? "Connecting..." : "Start test call"}
              </button>
            )}
            {connected && secondsLeft !== null && (
              <span className="font-mono text-sm" aria-live="off">
                Call ends in <strong>{secondsLeft}s</strong>
              </span>
            )}
            {!connected && <span className="label text-paper/80">Calls end by themselves after {TEST_CALL_SECONDS} seconds to save credits.</span>}
          </div>
          {connected && secondsLeft !== null && (
            <div aria-hidden className="mt-5 h-[3px] overflow-hidden rounded bg-paper/15">
              <div className="h-full bg-signal transition-[width] duration-300 ease-linear" style={{ width: `${(secondsLeft / TEST_CALL_SECONDS) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {blocked && credits && (
        <Notice tone="error">
          {credits.guard.reason}
          {credits.remaining !== null && (
            <button type="button" className="btn ml-3" onClick={() => void setOverride(true)}>Override for demo</button>
          )}
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="panel-dark min-h-40 p-6">
        <p className="label mb-3 text-paper/80">Live transcript</p>
        {lines.length === 0 ? (
          <p className="text-paper/80">The conversation will appear here as you speak.</p>
        ) : (
          <ul className="space-y-2" aria-live="polite">
            {lines.map((l) =>
              l.kind === "interrupt" ? (
                <li key={l.id} className="label"><span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-signal" />{l.text}</li>
              ) : (
                <li key={l.id}>
                  <span className={`label mr-2 ${l.kind === "agent" ? "font-semibold" : "text-paper/70"}`}>{l.kind === "agent" ? "Agent" : "You"}</span>
                  {l.text}
                </li>
              ),
            )}
          </ul>
        )}
      </div>

      <XRay title="X-Ray: raw event log">
        {log.length === 0 ? <p className="opacity-60">No events yet. Start a call.</p> : <pre className="whitespace-pre-wrap">{log.join("\n")}</pre>}
      </XRay>
    </div>
  );
}
