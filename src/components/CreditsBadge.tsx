"use client";

import { useEffect, useState } from "react";
import { api } from "./ui";

export type CreditsState = {
  connected: boolean;
  remaining: number | null;
  limit: number | null;
  override: boolean;
  guard: { allowed: boolean; reason?: string };
  error?: string;
};

export function useCredits() {
  const [credits, setCredits] = useState<CreditsState | null>(null);
  const load = () => api<CreditsState>("/api/credits").then(setCredits).catch(() => setCredits(null));
  useEffect(() => {
    void load();
  }, []);
  const setOverride = (override: boolean) =>
    api<CreditsState>("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ override }),
    }).then(setCredits);
  return { credits, setOverride, reload: load };
}

export function CreditsBadge() {
  const { credits, setOverride } = useCredits();
  const text = !credits
    ? "Credits: checking"
    : credits.remaining === null
      ? "Credits: not connected yet"
      : `Credits: ${credits.remaining.toLocaleString("en-IN")} left`;
  const low = credits && credits.remaining !== null && !credits.guard.allowed;
  return (
    <div className="flex items-center gap-3">
      <span className={`label rule rounded-sq px-3 py-1.5 ${low ? "bg-signal" : ""}`} title={credits?.guard.reason}>
        {text}
      </span>
      {credits && credits.remaining !== null && credits.remaining < 6500 && (
        <label className="label flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={credits.override} onChange={(e) => void setOverride(e.target.checked)} />
          Override for demo
        </label>
      )}
    </div>
  );
}
