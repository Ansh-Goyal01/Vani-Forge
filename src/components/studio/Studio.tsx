"use client";

import { useEffect, useState } from "react";
import type { VoiceIR } from "@/lib/voiceir";
import type { History } from "@/lib/versions";
import { Notice, SectionNumber, XRay, api } from "../ui";
import { ChaosTab } from "./ChaosTab";
import { DeployTab } from "./DeployTab";
import { ObserveTab } from "./ObserveTab";
import { FormEditor } from "./FormEditor";
import { RefineTab } from "./RefineTab";
import { StateGraph } from "./StateGraph";
import { TestTab } from "./TestTab";

export type AgentState = { ir: VoiceIR; history: History; canUndo: boolean; transferNumberSet: boolean };

const TABS = [
  { id: "test", label: "Test" },
  { id: "refine", label: "Refine" },
  { id: "chaos", label: "Chaos" },
  { id: "deploy", label: "Deploy" },
  { id: "observe", label: "Observe" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function Studio({ agentId }: { agentId: string }) {
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("test");

  useEffect(() => {
    api<AgentState>(`/api/agents/${agentId}`).then(setState).catch((e: Error) => setError(e.message));
  }, [agentId]);

  if (error) return <div className="wrap py-12"><Notice tone="error">{error}</Notice></div>;
  if (!state) return <p className="wrap label py-12 text-mute">Loading your agent...</p>;

  return (
    <div className="wrap space-y-8 pb-24 pt-6">
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
        <SectionNumber n="03" />
        <div>
          <p className="label text-mute">Your agent</p>
          <h1 className="mt-2 text-[clamp(2.25rem,5vw,4rem)]">{state.ir.business.name}</h1>
          <p className="label mt-3 text-mute">Version {state.ir.version} live / {state.ir.languages.map((l) => (l === "en" ? "English" : "Hindi")).join(" + ")}{state.ir.hinglish ? " / Hinglish" : ""}</p>
          {!state.transferNumberSet && state.ir.promises.some((p) => p.kind === "handoff") && (
            <p className="mt-2 text-sm text-mute">Transfer number not set, so hand-offs become a callback promise. Set OWNER_TRANSFER_NUMBER to enable live transfer.</p>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Studio sections" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`btn !py-2.5 ${tab === t.id ? "btn-primary" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "test" && <TestTab agentId={agentId} version={state.ir.version} />}
      {tab === "refine" && (
        <div className="space-y-14">
          <RefineTab agentId={agentId} state={state} onState={setState} />
          <section>
            <h3 className="mb-3 text-xl font-semibold">Edit by form</h3>
            <FormEditor key={state.ir.version} agentId={agentId} ir={state.ir} onSaved={(s) => setState(s as AgentState)} />
          </section>
          <section>
            <h3 className="mb-3 text-xl font-semibold">How the call flows</h3>
            <StateGraph states={state.ir.states} />
          </section>
          <XRay title="X-Ray: VoiceIR">
            <pre>{JSON.stringify(state.ir, null, 2)}</pre>
          </XRay>
        </div>
      )}
      {tab === "chaos" && <ChaosTab agentId={agentId} state={state} onState={setState} />}
      {tab === "deploy" && <DeployTab agentId={agentId} state={state} />}
      {tab === "observe" && <ObserveTab agentId={agentId} state={state} />}
    </div>
  );
}
