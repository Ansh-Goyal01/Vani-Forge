"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionNumber, api } from "../ui";

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
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <SectionNumber n="03" />
        <div className="pt-1">
          <h2 id="agents-title" className="text-[clamp(2rem,4.6vw,4rem)]">Your agents</h2>
          <p className="mt-3 text-[17px] text-mute">Agents created on this computer. Open one to test, refine, break and deploy it.</p>
        </div>
      </div>
      {failed ? (
        <p className="mt-4 text-mute">We could not read your saved agents.</p>
      ) : rows === null ? (
        <p className="label mt-4 text-mute">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-card border-[1.5px] border-ink bg-card px-5 py-4">No agents yet. Describe one above and it will appear here.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.agentId}>
              <Link href={`/studio/${r.agentId}`} className="rule block rounded-card bg-card px-5 py-4 transition-colors hover:bg-ink hover:text-paper">
                <span className="block font-display text-2xl font-bold tracking-tight">{r.name}</span>
                <span className="label mt-1 block opacity-70">Version {r.version} · {r.agentId.slice(0, 14)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
