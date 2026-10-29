"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Notice, api } from "../ui";

const RETRY_DELAY_MS = 1500;

type Voice = { voiceId: string; name: string; previewUrl?: string; labels: Record<string, string>; description?: string };

/** Voice list with preview playback and a use-case filter built from the labels the API returns. */
export function VoicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [error, setError] = useState<{ message: string; keys: boolean } | null>(null);
  const [useCase, setUseCase] = useState("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  // One quiet retry covers a blip (e.g. the dev server still compiling); after that the owner gets a button.
  useEffect(() => {
    let cancelled = false;
    const isKeyProblem = (e: Error) => /KEY|key/.test(e.message);
    const get = () => api<{ voices: Voice[] }>("/api/voices");
    get()
      .catch((e: Error) => {
        if (isKeyProblem(e)) throw e;
        return new Promise((r) => setTimeout(r, RETRY_DELAY_MS)).then(get);
      })
      .then((r) => !cancelled && setVoices(r.voices))
      .catch((e: Error) => !cancelled && setError({ message: e.message, keys: isKeyProblem(e) }));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setError(null);
    setVoices(null);
    setReloadKey((k) => k + 1);
  }

  const useCases = useMemo(() => {
    const set = new Set<string>();
    for (const v of voices ?? []) {
      for (const [k, val] of Object.entries(v.labels)) if (/use.?case/i.test(k) && val) set.add(val);
    }
    return [...set].sort();
  }, [voices]);

  const shown = (voices ?? []).filter(
    (v) => useCase === "all" || Object.entries(v.labels).some(([k, val]) => /use.?case/i.test(k) && val === useCase),
  );

  function preview(v: Voice) {
    if (!v.previewUrl) return;
    audio.current?.pause();
    if (playing === v.voiceId) return setPlaying(null);
    const a = new Audio(v.previewUrl);
    audio.current = a;
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    void a.play().catch(() => setPlaying(null));
    setPlaying(v.voiceId);
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <Notice tone={error.keys ? "keys" : "error"}>{error.message} Voices are not connected yet.</Notice>
        </div>
        <button type="button" onClick={retry} className="label rule rounded-card px-4 py-3">
          Try again
        </button>
      </div>
    );
  }
  if (!voices) return <p className="label text-mute">Loading voices...</p>;
  if (voices.length === 0) return <Notice>ElevenLabs returned no voices for this account.</Notice>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="label text-mute">Filter by use</span>
        {["all", ...useCases].map((u) => (
          <button key={u} type="button" onClick={() => setUseCase(u)} className={`label rule rounded-card px-3.5 py-1.5 ${useCase === u ? "bg-ink text-paper" : ""}`}>
            {u.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <ul className="grid max-h-72 gap-2 overflow-auto sm:grid-cols-2">
        {shown.map((v) => (
          <li key={v.voiceId} className={`rule flex items-center justify-between gap-3 rounded-card px-4 py-2.5 ${value === v.voiceId ? "bg-ink text-paper" : "bg-card"}`}>
            <button type="button" onClick={() => onChange(v.voiceId)} className="min-w-0 flex-1 text-left" aria-pressed={value === v.voiceId}>
              <span className="block truncate font-medium">{v.name}</span>
              <span className="label block truncate opacity-60">{Object.values(v.labels).slice(0, 3).join(" / ") || "no labels"}</span>
            </button>
            {v.previewUrl && (
              <button type="button" className="label rule rounded-card px-3 py-1" onClick={() => preview(v)}>
                {playing === v.voiceId ? "Stop" : "Play"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
