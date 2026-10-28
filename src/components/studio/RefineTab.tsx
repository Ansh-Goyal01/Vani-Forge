"use client";

import { useState } from "react";
import type { RawOp } from "@/lib/patch";
import { Notice, XRay, api } from "../ui";
import type { AgentState } from "./Studio";

type Change = { op: string; path: string; label: string; before?: unknown; after?: unknown };
type Proposal = { summary: string; ops: RawOp[]; changes: Change[]; error: string | null };

const show = (v: unknown) => (v === undefined ? "nothing" : typeof v === "string" ? v : JSON.stringify(v));

export function RefineTab({ agentId, state, onState }: { agentId: string; state: AgentState; onState: (s: AgentState) => void }) {
  const [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState<"propose" | "apply" | "undo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = <T,>(path: string, body?: unknown) =>
    api<T>(`/api/agents/${agentId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

  async function propose() {
    setBusy("propose");
    setError(null);
    setProposal(null);
    try {
      setProposal(await post<Proposal>("refine", { instruction }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!proposal) return;
    setBusy("apply");
    setError(null);
    try {
      onState(await post<AgentState>("apply", { ops: proposal.ops, note: instruction.slice(0, 100) }));
      setProposal(null);
      setInstruction("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function undo() {
    setBusy("undo");
    setError(null);
    try {
      onState(await post<AgentState>("undo"));
      setProposal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const noChange = proposal && proposal.ops.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="instruction" className="label mb-2 block text-mute">Tell VaniForge what to change</label>
        <textarea
          id="instruction"
          className="field"
          rows={3}
          maxLength={500}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Make the welcome message shorter and warmer."
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={!instruction.trim() || busy !== null} onClick={propose}>
            {busy === "propose" ? "Working out the change..." : "Show me the change"}
          </button>
          <button type="button" className="btn" disabled={!state.canUndo || busy !== null} onClick={undo}>
            {busy === "undo" ? "Undoing..." : "Undo last change"}
          </button>
          {busy === "propose" && <span className="label text-mute">If the free AI is busy this can take up to 20 seconds.</span>}
        </div>
        {busy !== null && <div className="progress-track mt-4" role="progressbar" aria-label="Working" />}
      </div>

      {error && <Notice tone={/\.env\.local/.test(error) ? "keys" : "error"}>{error}</Notice>}

      {proposal?.error && <Notice tone="error">We could not make that change safely: {proposal.error}. Try wording it differently.</Notice>}
      {noChange && !proposal.error && <Notice>{proposal.summary || "Nothing needs to change for that."}</Notice>}

      {proposal && proposal.ops.length > 0 && (
        <section className="tab-in rule rounded-card bg-card p-5">
          <h3 className="text-xl font-semibold">{proposal.summary}</h3>
          <ul className="mt-4 space-y-4">
            {proposal.changes.map((c, i) => (
              <li key={i}>
                <p className="label text-mute">{c.label}</p>
                <p className="mt-1 text-sm line-through opacity-60">{show(c.before)}</p>
                <p className="mt-1 border-l-[3px] border-signal pl-3">{show(c.after)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={apply}>
              {busy === "apply" ? "Updating your agent..." : "Apply to my agent"}
            </button>
            <button type="button" className="btn" onClick={() => setProposal(null)}>Not now</button>
          </div>
          <div className="mt-5">
            <XRay title="X-Ray: JSON Patch (RFC 6902)">
              <pre>{JSON.stringify(proposal.ops, null, 2)}</pre>
            </XRay>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xl font-semibold">Versions</h3>
        <ol className="space-y-1.5">
          {[...state.history.entries].reverse().map((e) => (
            <li key={e.version} className="rule flex items-center justify-between rounded-card bg-card px-3 py-2">
              <span>
                <span className="font-mono text-sm">v{e.version}</span> <span className="ml-2">{e.note}</span>
              </span>
              <span className="label text-mute">{e.version === state.history.current ? "live now" : new Date(e.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
