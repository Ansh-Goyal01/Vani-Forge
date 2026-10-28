"use client";

import { PROMISE_KIND_LABEL, disclosesAI, type PromiseKind, type VoiceIRDraft } from "@/lib/voiceir";

const KINDS: PromiseKind[] = ["must", "never", "handoff"];

/** Plain-words promise sheet. The owner edits it before the agent is created. */
export function PromiseSheet({ draft, onChange }: { draft: VoiceIRDraft; onChange: (d: VoiceIRDraft) => void }) {
  const setPromise = (i: number, patch: Partial<VoiceIRDraft["promises"][number]>) =>
    onChange({ ...draft, promises: draft.promises.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const addPromise = (kind: PromiseKind) =>
    onChange({ ...draft, promises: [...draft.promises, { id: `promise_${crypto.randomUUID().slice(0, 8)}`, kind, text: "" }] });

  const disclosureOk = disclosesAI(draft.persona.firstMessage);

  return (
    <div className="space-y-8">
      <div>
        <label className="label mb-2 block text-mute" htmlFor="first-message">What the agent says first</label>
        <textarea
          id="first-message"
          className="field"
          rows={2}
          value={draft.persona.firstMessage}
          onChange={(e) => onChange({ ...draft, persona: { ...draft.persona, firstMessage: e.target.value } })}
        />
        {!disclosureOk && (
          <p className="mt-1 text-sm text-signal" role="alert">
            The first message must say it is an AI assistant, so callers always know.
          </p>
        )}
      </div>

      {KINDS.map((kind) => (
        <section key={kind}>
          <h3 className="mb-3 text-xl font-semibold">
            {kind === "handoff" ? "Hand off to a human when" : kind === "must" ? "Always" : "Never"}
          </h3>
          <ul className="space-y-2">
            {draft.promises.map((p, i) =>
              p.kind !== kind ? null : (
                <li key={p.id} className="flex gap-2">
                  <input className="field" aria-label={`${PROMISE_KIND_LABEL[kind]} promise`} value={p.text} onChange={(e) => setPromise(i, { text: e.target.value })} />
                  <select className="field !w-auto" aria-label="Promise type" value={p.kind} onChange={(e) => setPromise(i, { kind: e.target.value as PromiseKind })}>
                    {KINDS.map((k) => (
                      <option key={k} value={k}>{PROMISE_KIND_LABEL[k]}</option>
                    ))}
                  </select>
                  <button type="button" className="btn" aria-label="Remove promise" onClick={() => onChange({ ...draft, promises: draft.promises.filter((_, j) => j !== i) })}>
                    Remove
                  </button>
                </li>
              ),
            )}
          </ul>
          <button type="button" className="btn mt-3" onClick={() => addPromise(kind)}>Add</button>
        </section>
      ))}
    </div>
  );
}
