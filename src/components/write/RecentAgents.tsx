"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../ui";

type Row = { agentId: string; name: string; version: number };

/** Compact list of agents saved on this computer, for the builder's side panel. */
export function RecentAgents() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api<{ agents: Row[] }>("/api/agents")
      .then((r) => setRows(r.agents))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="rounded-card border-[1.5px] border-ink bg-card p-5">
      <p className="label text-mute">Your agents</p>
      {failed ? (
        <p className="mt-3 text-sm text-mute">We could not read your saved agents.</p>
      ) : rows === null ? (
        <div className="mt-3 space-y-2" aria-busy="true" aria-label="Loading your agents">
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-mute">Your first agent will appear here once it is created.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/15">
          {rows.map((r) => (
            <li key={r.agentId}>
              <Link href={`/studio/${r.agentId}`} className="group flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-semibold group-hover:underline group-hover:underline-offset-4">{r.name}</span>
                  <span className="label block text-mute">Version {r.version}</span>
                </span>
                <span aria-hidden className="font-mono text-problem transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
