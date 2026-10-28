"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { EXAMPLE_PROMPTS, USE_CASE_STARTERS } from "@/lib/examples";
import { disclosesAI, type VoiceIRDraft } from "@/lib/voiceir";
import { Notice, SectionNumber, XRay, api } from "../ui";
import { MicButton } from "./MicButton";
import { PromiseSheet } from "./PromiseSheet";
import { VoicePicker } from "./VoicePicker";

const LIMIT = 1000;

function toBase64(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function WriteFlow() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [knowledge, setKnowledge] = useState<{ name: string; text?: string; pdf?: string } | null>(null);
  const [draft, setDraft] = useState<VoiceIRDraft | null>(null);
  const [voiceId, setVoiceId] = useState("");
  const [busy, setBusy] = useState<"compile" | "create" | null>(null);
  const [error, setError] = useState<{ message: string; keys: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fail = (e: Error) => setError({ message: e.message, keys: /\.env\.local|KEY/.test(e.message) });

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError({ message: "That file is over 5 MB. Please use a smaller one.", keys: false });
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setKnowledge({ name: file.name, pdf: toBase64(await file.arrayBuffer()) });
    } else {
      setKnowledge({ name: file.name, text: await file.text() });
    }
    setError(null);
  }

  async function makeDraft() {
    setBusy("compile");
    setError(null);
    try {
      const res = await api<{ draft: VoiceIRDraft }>("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, knowledgeText: knowledge?.text, pdfBase64: knowledge?.pdf }),
      });
      setDraft(res.draft);
    } catch (e) {
      fail(e as Error);
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    if (!draft) return;
    setBusy("create");
    setError(null);
    try {
      const { agentId } = await api<{ agentId: string }>("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, voiceId }),
      });
      router.push(`/studio/${agentId}`);
    } catch (e) {
      fail(e as Error);
      setBusy(null);
    }
  }

  const canDraft = brief.trim().length > 0 && brief.length <= LIMIT && busy === null;
  const canCreate = draft && voiceId && disclosesAI(draft.persona.firstMessage) && draft.promises.every((p) => p.text.trim()) && busy === null;

  return (
    <div className="space-y-14">
      <section className="grid gap-8 md:grid-cols-[auto_1fr]">
        <SectionNumber n="01" />
        <div>
          <h1 className="text-4xl font-semibold md:text-5xl">Describe the voice agent you need.</h1>
          <p className="mt-3 max-w-2xl text-mute">
            Write it the way you would brief a new receptionist, in English, Hindi or both. Use made-up names and numbers while we are in prototype: the free AI may learn from what you type.
          </p>

          <div className="mt-6">
            <label htmlFor="brief" className="label mb-2 block text-mute">Your brief</label>
            <textarea
              id="brief"
              className="field min-h-40"
              maxLength={LIMIT}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="I run a dental clinic in Noida. I need a receptionist who..."
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <span className={`label ${brief.length > LIMIT - 100 ? "text-problem font-semibold" : "text-mute"}`}>{brief.length} / {LIMIT}</span>
              <div className="flex flex-wrap gap-2">
                <MicButton onText={(t) => setBrief((b) => (b ? b + " " : "") + t.slice(0, LIMIT))} onError={(m) => setError({ message: m, keys: /key/i.test(m) })} />
                <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
                  {knowledge ? `Attached: ${knowledge.name}` : "Attach price list (PDF or text)"}
                </button>
                <input ref={fileInput} type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="label mb-2 text-mute">Start from a use case</p>
            <div className="flex flex-wrap gap-2">
              {USE_CASE_STARTERS.map((s) => (
                <button key={s.id} type="button" className="btn" onClick={() => setBrief(s.text.slice(0, LIMIT))}>{s.label}</button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="label mb-2 text-mute">Or try an example</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <li key={ex.title}>
                  <button type="button" className="rule w-full rounded-card bg-blush px-3 py-2 text-left hover:bg-plum hover:text-blush" onClick={() => setBrief(ex.text.slice(0, LIMIT))}>
                    <span className="block font-medium">{ex.title}</span>
                    <span className="block truncate text-sm opacity-70">{ex.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-primary" disabled={!canDraft} onClick={makeDraft}>
              {busy === "compile" ? "Writing your promise sheet..." : draft ? "Write it again" : "Write my promise sheet"}
            </button>
            {busy === "compile" && <span className="label text-mute">If the free AI is busy this can take up to 20 seconds.</span>}
          </div>
        </div>
      </section>

      {error && <Notice tone={error.keys ? "keys" : "error"}>{error.message}</Notice>}

      {draft && (
        <section className="grid gap-8 md:grid-cols-[auto_1fr]">
          <SectionNumber n="02" />
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-semibold">Check the promises.</h2>
              <p className="mt-2 max-w-2xl text-mute">
                {draft.business.name} will keep these on every call. Change anything that is not right.
              </p>
            </div>
            <PromiseSheet draft={draft} onChange={setDraft} />

            <div>
              <h2 className="mb-3 text-3xl font-semibold">Pick a voice.</h2>
              <VoicePicker value={voiceId} onChange={setVoiceId} />
            </div>

            <XRay title="X-Ray: VoiceIR draft">
              <pre>{JSON.stringify(draft, null, 2)}</pre>
            </XRay>

            <div className="flex flex-wrap items-center gap-4">
              <button type="button" className="btn btn-primary" disabled={!canCreate} onClick={create}>
                {busy === "create" ? "Creating your agent..." : "Create my agent"}
              </button>
              {!voiceId && <span className="label text-mute">Pick a voice to continue.</span>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
