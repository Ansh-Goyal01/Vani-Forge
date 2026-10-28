"use client";

import { useEffect, useState } from "react";
import { criterionId } from "@/lib/compile";
import type { ConversationDetail, ConversationRow } from "@/lib/eleven";
import { Notice, XRay, api } from "../ui";
import type { AgentState } from "./Studio";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const RESULT_LABEL: Record<string, string> = { success: "Kept", failure: "Broken", unknown: "Not clear" };

export function ObserveTab({ agentId, state }: { agentId: string; state: AgentState }) {
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [reloads, setReloads] = useState(0);
  useEffect(() => {
    api<{ conversations: ConversationRow[] }>(`/api/conversations?agentId=${agentId}`)
      .then((r) => {
        setError(null);
        setRows(r.conversations);
      })
      .catch((e: Error) => setError(e.message));
  }, [agentId, reloads]);
  const load = () => {
    setRows(null);
    setReloads((n) => n + 1);
  };

  function show(id: string) {
    setOpen(id);
    setDetail(null);
    setDetailError(null);
    api<{ conversation: ConversationDetail }>(`/api/conversations/${id}`)
      .then((r) => setDetail(r.conversation))
      .catch((e: Error) => setDetailError(e.message));
  }

  const promiseFor = (criteriaId: string) => state.ir.promises.find((p) => criterionId(p.id) === criteriaId)?.text ?? criteriaId;

  if (error) return <Notice tone={/\.env\.local/.test(error) ? "keys" : "error"}>{error}</Notice>;
  if (!rows) return <p className="label text-mute">Loading calls...</p>;

  const totalSecs = rows.reduce((a, r) => a + r.durationSecs, 0);
  const judged = rows.filter((r) => r.callSuccessful !== "unknown");
  const ok = judged.filter((r) => r.callSuccessful === "success").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Calls (latest 30)", String(rows.length)],
          ["Talk time", mmss(totalSecs)],
          ["Judged successful", judged.length ? `${ok} of ${judged.length}` : "no scored calls yet"],
        ].map(([k, v]) => (
          <div key={k} className="rule rounded-sq bg-paper p-4">
            <p className="label text-mute">{k}</p>
            <p className="mt-1 font-head text-3xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <Notice>No calls yet. Make a test call in the Test tab and it will show up here with its summary (it can take a minute to appear).</Notice>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.conversationId}>
                <button type="button" onClick={() => show(r.conversationId)} className={`rule w-full rounded-sq px-3 py-2 text-left ${open === r.conversationId ? "bg-ink text-alu" : "bg-paper"}`}>
                  <span className="block font-medium">{r.title || "Call"}</span>
                  <span className="label block opacity-70">
                    {new Date(r.startTimeUnixSecs * 1000).toLocaleString()} / {mmss(r.durationSecs)} / {r.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div>
            {!open && <p className="text-mute">Choose a call to read it.</p>}
            {open && !detail && !detailError && <p className="label text-mute">Loading call...</p>}
            {detailError && <Notice tone="error">{detailError}</Notice>}
            {detail && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-semibold">{detail.title || "Call"}</h3>
                  <p className="label mt-1 text-mute">{mmss(detail.durationSecs)} / {detail.status}</p>
                  <p className="mt-3">{detail.summary || "The summary is not ready yet. Try again in a minute."}</p>
                </div>
                <div>
                  <p className="label mb-2 text-mute">Your promises on this call</p>
                  {detail.criteria.length === 0 ? (
                    <p className="text-sm text-mute">No promise scores yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.criteria.map((c) => (
                        <li key={c.criteriaId} className="rule rounded-sq bg-paper px-3 py-2">
                          <span className={`label mr-2 ${c.result === "failure" ? "text-signal" : ""}`}>{RESULT_LABEL[c.result] ?? c.result}</span>
                          {promiseFor(c.criteriaId)}
                          {c.rationale && <p className="mt-1 text-sm text-mute">{c.rationale}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="panel-dark p-4">
                  <p className="label mb-2 text-alu/60">Transcript</p>
                  <ul className="space-y-2">
                    {detail.transcript.map((t, i) => (
                      <li key={i}>
                        <span className={`label mr-2 ${t.role === "agent" ? "text-signal" : "text-alu/60"}`}>{t.role === "agent" ? "Agent" : "Caller"}</span>
                        {t.message}
                        {t.interrupted && <span className="label ml-2 text-signal">(interrupted)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <XRay title="X-Ray: raw conversation">
                  <pre>{JSON.stringify(detail, null, 2)}</pre>
                </XRay>
              </div>
            )}
          </div>
        </div>
      )}
      <button type="button" className="btn" onClick={load}>Refresh</button>
    </div>
  );
}
