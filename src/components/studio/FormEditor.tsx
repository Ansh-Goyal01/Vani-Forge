"use client";

import { useState } from "react";
import { disclosesAI, Language, VoiceIR, type PromiseKind } from "@/lib/voiceir";
import { PromiseSheet } from "../write/PromiseSheet";
import { VoicePicker } from "../write/VoicePicker";
import { Notice, api } from "../ui";

type Props = { agentId: string; ir: VoiceIR; onSaved: (state: unknown) => void };

/** Form editor: persona, first message, promises, languages, voice. Saves a new version. */
export function FormEditor({ agentId, ir, onSaved }: Props) {
  const [draft, setDraft] = useState<VoiceIR>(ir);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(ir);

  const toggleLang = (l: Language) =>
    setDraft((d) => {
      const has = d.languages.includes(l);
      const languages = has ? d.languages.filter((x) => x !== l) : [...d.languages, l];
      return languages.length ? { ...d, languages } : d;
    });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const state = await api(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ir: draft, note: "Edited in the form" }),
      });
      onSaved(state);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const promiseDraft = {
    business: draft.business,
    languages: draft.languages,
    hinglish: draft.hinglish,
    persona: draft.persona,
    promises: draft.promises,
    states: draft.states,
    knowledge: draft.knowledge,
    lexicon: draft.lexicon,
  };

  const valid = disclosesAI(draft.persona.firstMessage) && draft.promises.every((p) => p.text.trim()) && draft.voice.voiceId;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-1 block text-mute" htmlFor="role">Role</label>
          <input id="role" className="field" value={draft.persona.role} onChange={(e) => setDraft({ ...draft, persona: { ...draft.persona, role: e.target.value } })} />
        </div>
        <div>
          <label className="label mb-1 block text-mute" htmlFor="tone">Tone</label>
          <input id="tone" className="field" value={draft.persona.tone} onChange={(e) => setDraft({ ...draft, persona: { ...draft.persona, tone: e.target.value } })} />
        </div>
      </div>

      <fieldset>
        <legend className="label mb-2 text-mute">Languages</legend>
        <div className="flex flex-wrap gap-4">
          {(["en", "hi"] as const).map((l) => (
            <label key={l} className="flex items-center gap-2">
              <input type="checkbox" checked={draft.languages.includes(l)} onChange={() => toggleLang(l)} />
              {l === "en" ? "English" : "Hindi"}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={draft.hinglish} onChange={(e) => setDraft({ ...draft, hinglish: e.target.checked })} />
            Mix Hindi and English (Hinglish)
          </label>
        </div>
      </fieldset>

      <PromiseSheet
        draft={promiseDraft}
        onChange={(d) =>
          setDraft({ ...draft, persona: d.persona, promises: d.promises.map((p) => ({ ...p, kind: p.kind as PromiseKind })) })
        }
      />

      <div>
        <h3 className="mb-3 text-xl font-semibold">Voice</h3>
        <VoicePicker value={draft.voice.voiceId} onChange={(voiceId) => setDraft({ ...draft, voice: { ...draft.voice, voiceId } })} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex items-center gap-4">
        <button type="button" className="btn btn-primary" disabled={!dirty || !valid || saving} onClick={save}>
          {saving ? "Saving..." : "Save as a new version"}
        </button>
        {dirty && <button type="button" className="btn" onClick={() => setDraft(ir)}>Discard edits</button>}
      </div>
    </div>
  );
}
