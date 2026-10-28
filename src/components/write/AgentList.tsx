"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../ui";

type Row = { agentId: string; name: string; version: number };

/** Agents created on this computer (from /data). */
export function AgentList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api<{ agents: Row[] }>("/api/agents")
      .then((r) => setRows(r.agents))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section>
      <p className="label text-mute">The studio</p>
      <h2 id="agents-title" className="mt-3 text-[clamp(2rem,4.4vw,3.75rem)]">Your agents</h2>
      {failed ? (
        <p className="mt-4 text-mute">We could not read your saved agents.</p>
      ) : rows === null ? (
        <p className="label mt-4 text-mute">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-card border-[1.5px] border-plum/50 bg-blush px-5 py-4">No agents yet. Describe one above and it will appear here.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.agentId}>
              <Link href={`/studio/${r.agentId}`} className="rule block rounded-card bg-blush px-5 py-4 transition-colors hover:bg-plum hover:text-blush">
                <span className="block font-display text-2xl">{r.name}</span>
                <span className="label block opacity-70">Version {r.version}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
