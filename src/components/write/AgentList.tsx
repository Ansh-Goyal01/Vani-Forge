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
      <h2 className="text-2xl font-semibold">Your agents</h2>
      {failed ? (
        <p className="mt-2 text-mute">We could not read your saved agents.</p>
      ) : rows === null ? (
        <p className="label mt-2 text-mute">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-mute">No agents yet. Describe one above and it will appear here.</p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.agentId}>
              <Link href={`/studio/${r.agentId}`} className="rule block rounded-card bg-blush px-3 py-2 hover:bg-plum hover:text-blush">
                <span className="block font-medium">{r.name}</span>
                <span className="label block opacity-70">Version {r.version}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
