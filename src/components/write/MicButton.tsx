"use client";

import { useRef, useState } from "react";
import { api } from "../ui";

/** Records up to 30 s, sends it to /api/transcribe (ElevenLabs Scribe v2), returns the text. */
export function MicButton({ onText, onError }: { onText: (t: string) => void; onError: (m: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) return onError("This browser cannot record audio. You can type instead.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return onError("We could not use your microphone. Allow microphone access in the browser bar, or type instead.");
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setBusy(true);
      try {
        const form = new FormData();
        form.append("audio", new Blob(chunks, { type: r.mimeType || "audio/webm" }), "brief.webm");
        const { text } = await api<{ text: string }>("/api/transcribe", { method: "POST", body: form });
        onText(text);
      } catch (e) {
        onError((e as Error).message);
      } finally {
        setBusy(false);
      }
    };
    r.start();
    setRecording(true);
    timer.current = setTimeout(() => r.state === "recording" && r.stop(), 30_000);
  }

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  }

  return (
    <button type="button" className={`btn ${recording ? "btn-primary" : ""}`} onClick={recording ? stop : start} disabled={busy}>
      {busy ? "Listening back..." : recording ? "Stop recording" : "Speak instead"}
    </button>
  );
}
