"use client";

import { useEffect, useState } from "react";
import { compareRuns, keptLabel, rollupByPromise, tally, type ChaosRun, type Tally, type Tier } from "@/lib/chaos";
import type { HealProposal } from "@/lib/heal";
import { useCredits } from "../CreditsBadge";
import { Check, Notice, XRay, api } from "../ui";
import type { AgentState } from "./Studio";

type PersonaInfo = { id: string; name: string; summary: string };
type Healed = { personaId: string; promiseId: string; before: Tally | null; after: Tally | null; version: number };

const personaLabel = (ps: PersonaInfo[], id: string) => ps.find((p) => p.id === id)?.name ?? id;

export function ChaosTab({ agentId, state, onState }: { agentId: string; state: AgentState; onState: (s: AgentState) => void }) {
  const { credits } = useCredits();
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [runs, setRuns] = useState<ChaosRun[] | null>(null);
  const [tier, setTier] = useState<Tier>("text");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{ runId: string; p: HealProposal } | null>(null);
  const [healed, setHealed] = useState<Healed[]>([]);

  useEffect(() => {
    api<{ personas: PersonaInfo[]; runs: ChaosRun[] }>(`/api/chaos?agentId=${agentId}`)
      .then((r) => {
        setPersonas(r.personas);
        setRuns(r.runs);
      })
      .catch((e: Error) => setError(e.message));
  }, [agentId]);

  const post = <T,>(url: string, body: unknown) =>
    api<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const latest = (t: Tier) => runs?.find((r) => r.tier === t) ?? null;
  const run = latest(tier);

  async function runText(personaIds?: string[]) {
    const { run } = await post<{ run: ChaosRun }>("/api/chaos", { agentId, tier: "text", personaIds });
    setRuns((rs) => [run, ...(rs ?? [])]);
    return run;
  }

  async function startText() {
    setBusy("Four callers are testing your agent, three times each. This takes a few minutes...");
    setError(null);
    try {
      await runText();
      setTier("text");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function startAudio() {
    setError(null);
    try {
      for (const [i, p] of personas.entries()) {
        setBusy(`Phone test ${i + 1} of ${personas.length}: ${p.name}. Real audio, real time, about a minute each...`);
        const { run } = await post<{ run: ChaosRun }>("/api/chaos", { agentId, tier: "audio", personaIds: [p.id] });
        setRuns((rs) => [run, ...(rs ?? [])]);
        setTier("audio");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function explain(r: ChaosRun, personaId: string, promiseId: string) {
    setBusy("Working out a fix...");
    setError(null);
    try {
      const { proposal } = await post<{ proposal: HealProposal }>("/api/heal", { agentId, runId: r.runId, personaId, promiseId });
      setProposal({ runId: r.runId, p: proposal });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!proposal) return;
    const { p, runId } = proposal;
    const before = runs?.find((r) => r.runId === runId);
    setError(null);
    try {
      setBusy("Updating your agent...");
      const next = await post<AgentState>(`/api/agents/${agentId}/apply`, { ops: p.ops, note: `Heal: ${p.summary}`.slice(0, 110) });
      onState(next);
      setProposal(null);
      setBusy(`Running ${personaLabel(personas, p.personaId)} again on version ${next.ir.version}...`);
      const after = await runText([p.personaId]);
      if (before) {
        const c = compareRuns(before, after, p.personaId, p.promiseId);
        setHealed((h) => [{ personaId: p.personaId, promiseId: p.promiseId, ...c, version: next.ir.version }, ...h]);
      }
      setTier("text");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const promiseText = (id: string) => state.ir.promises.find((p) => p.id === id)?.text ?? id;
  const blocked = credits ? !credits.guard.allowed : false;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold">Break it on purpose.</h2>
        <p className="mt-2 max-w-2xl text-mute">
          Four difficult callers attack your agent. Where it breaks a promise, VaniForge explains why in plain words and suggests a fix you can approve.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {personas.map((p) => (
            <li key={p.id} className="rule rounded-card bg-blush px-3 py-2">
              <span className="block font-medium">{p.name}</span>
              <span className="block text-sm text-mute">{p.summary}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" disabled={busy !== null || personas.length === 0} onClick={startText}>
          Run text test (3 times each)
        </button>
        <button type="button" className="btn" disabled={busy !== null || blocked || personas.length === 0} onClick={startAudio}>
          Run audio test
        </button>
        <span className="label text-mute">Audio uses real call credits, one run per caller.</span>
      </div>
      {blocked && credits && <Notice tone="error">{credits.guard.reason} Audio tests are paused.</Notice>}
      {busy && <Notice>{busy}</Notice>}
      {error && <Notice tone={/\.env\.local/.test(error) ? "keys" : "error"}>{error}</Notice>}

      {runs === null && !error && <p className="label text-mute">Loading past runs...</p>}
      {runs !== null && runs.length === 0 && !busy && <Notice>No chaos runs yet. Press a run button to start. Nothing is shown until a real run finishes.</Notice>}

      {healed.map((h) => (
        <section key={`${h.version}-${h.promiseId}`} className="rule rounded-card border-terracotta bg-blush p-5">
          <p className="label flex items-center gap-2"><Check /> Fixed and re-tested</p>
          <p className="mt-1 font-medium">{promiseText(h.promiseId)}</p>
          <p className="mt-2 font-mono text-sm">
            Before: {h.before ? keptLabel(h.before) : "n/a"} {"->"} After (version {h.version}): {h.after ? keptLabel(h.after) : "n/a"}
          </p>
        </section>
      ))}

      {proposal && (
        <section className="rule rounded-card bg-blush p-5">
          <p className="label text-mute">Proposed fix for: {proposal.p.personaName}</p>
          <h3 className="mt-1 text-xl font-semibold">{proposal.p.promiseText}</h3>
          {proposal.p.evidence && (
            <blockquote className="mt-3 border-l-[3px] border-terracotta pl-3">
              <span className="label block text-mute">What the agent said</span>
              {proposal.p.evidence}
            </blockquote>
          )}
          <p className="mt-3">{proposal.p.explanation}</p>
          <ul className="mt-4 space-y-3">
            {proposal.p.changes.map((c, i) => (
              <li key={i}>
                <p className="label text-mute">{c.label}</p>
                {c.before !== undefined && <p className="text-sm line-through opacity-60">{typeof c.before === "string" ? c.before : JSON.stringify(c.before)}</p>}
                <p className="border-l-[3px] border-terracotta pl-3">{typeof c.after === "string" ? c.after : JSON.stringify(c.after)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={approve}>Approve fix and test again</button>
            <button type="button" className="btn" onClick={() => setProposal(null)}>Not now</button>
          </div>
          <div className="mt-5">
            <XRay title="X-Ray: JSON Patch">
              <pre>{JSON.stringify(proposal.p.ops, null, 2)}</pre>
            </XRay>
          </div>
        </section>
      )}

      {runs && runs.length > 0 && (
        <section>
          <div role="tablist" className="mb-4 flex gap-1">
            {(["text", "audio"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tier === t} onClick={() => setTier(t)} className={`label rule rounded-card px-3 py-1.5 ${tier === t ? "bg-plum text-blush" : ""}`}>
                {t === "text" ? "Text tests" : "Audio tests"}
              </button>
            ))}
          </div>
          {!run ? (
            <Notice>No {tier} run yet.</Notice>
          ) : (
            <RunView run={run} personas={personas} promiseText={promiseText} onExplain={(pid, prid) => explain(run, pid, prid)} busy={busy !== null} />
          )}
        </section>
      )}
    </div>
  );
}

function RunView({
  run,
  personas,
  promiseText,
  onExplain,
  busy,
}: {
  run: ChaosRun;
  personas: PersonaInfo[];
  promiseText: (id: string) => string;
  onExplain: (personaId: string, promiseId: string) => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="label text-mute">
        Run {run.runId} / version {run.version} / {new Date(run.createdAt).toLocaleString()}
      </p>
      {run.error && <Notice tone="error">{run.error}</Notice>}
      {rollupByPromise(run).map((r) => (
        <article key={r.promiseId} className="rule rounded-card bg-blush p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{promiseText(r.promiseId)}</h3>
            <span className={`font-mono text-sm ${r.tally.kept < r.tally.total ? "font-semibold text-problem" : ""}`}>{r.tally.total ? keptLabel(r.tally) : "no score"}</span>
          </div>
          <ul className="mt-3 space-y-3">
            {run.items
              .filter((i) => i.promiseId === r.promiseId)
              .map((item) => {
                const t = tally(item);
                const failing = item.samples.find((s) => !s.passed && !s.unscored);
                const shown = failing ?? item.samples[0];
                return (
                  <li key={item.personaId} className="border-t border-plum/20 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>{personaLabel(personas, item.personaId)}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-sm">{t.total ? keptLabel(t) : "no score"}</span>
                        {failing && (
                          <button type="button" className="btn" disabled={busy} onClick={() => onExplain(item.personaId, item.promiseId)}>
                            Explain and fix
                          </button>
                        )}
                      </span>
                    </div>
                    {run.tier === "audio" && shown.heard && (
                      <ul className="mt-2 space-y-2 text-sm">
                        {shown.heard.map((h, i) => (
                          <li key={i} className="panel-dark px-3 py-2">
                            <span className="label text-blush/80">Caller said</span> {h.said}
                            <br />
                            <span className="label"><span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-terracotta" />Agent heard</span> {h.heard || "nothing"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {shown.rationale && <p className="mt-2 text-sm text-mute">{shown.rationale}</p>}
                    <details className="mt-2">
                      <summary className="label cursor-pointer text-mute">Transcript</summary>
                      <ul className="mt-2 space-y-1 text-sm">
                        {shown.transcript.map((l, i) => (
                          <li key={i}>
                            <span className="label mr-2 text-mute">{l.role === "caller" ? "Caller" : "Agent"}</span>
                            {l.text}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
              })}
          </ul>
        </article>
      ))}
    </div>
  );
}
