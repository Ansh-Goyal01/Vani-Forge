"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Notice, api } from "../ui";

type Voice = { voiceId: string; name: string; previewUrl?: string; labels: Record<string, string>; description?: string };

/** Voice list with preview playback and a use-case filter built from the labels the API returns. */
export function VoicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [error, setError] = useState<{ message: string; keys: boolean } | null>(null);
  const [useCase, setUseCase] = useState("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    api<{ voices: Voice[] }>("/api/voices")
      .then((r) => setVoices(r.voices))
      .catch((e: Error) => setError({ message: e.message, keys: /KEY|key/.test(e.message) }));
  }, []);

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

  if (error) return <Notice tone={error.keys ? "keys" : "error"}>{error.message} Voices are not connected yet.</Notice>;
  if (!voices) return <p className="label text-mute">Loading voices...</p>;
  if (voices.length === 0) return <Notice>ElevenLabs returned no voices for this account.</Notice>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="label text-mute">Filter by use</span>
        {["all", ...useCases].map((u) => (
          <button key={u} type="button" onClick={() => setUseCase(u)} className={`label rule rounded-sq px-2.5 py-1 ${useCase === u ? "bg-ink text-alu" : ""}`}>
            {u.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <ul className="grid max-h-72 gap-2 overflow-auto sm:grid-cols-2">
        {shown.map((v) => (
          <li key={v.voiceId} className={`rule flex items-center justify-between gap-3 rounded-sq px-3 py-2 ${value === v.voiceId ? "bg-ink text-alu" : "bg-paper"}`}>
            <button type="button" onClick={() => onChange(v.voiceId)} className="min-w-0 flex-1 text-left" aria-pressed={value === v.voiceId}>
              <span className="block truncate font-medium">{v.name}</span>
              <span className="label block truncate opacity-60">{Object.values(v.labels).slice(0, 3).join(" / ") || "no labels"}</span>
            </button>
            {v.previewUrl && (
              <button type="button" className="label rule rounded-sq px-2 py-1" onClick={() => preview(v)}>
                {playing === v.voiceId ? "Stop" : "Play"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
