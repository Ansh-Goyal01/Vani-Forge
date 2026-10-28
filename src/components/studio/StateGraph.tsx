"use client";

import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { VoiceIR } from "@/lib/voiceir";

/** Read-only picture of the conversation flow (VoiceIR.states). */
export function StateGraph({ states }: { states: VoiceIR["states"] }) {
  const { nodes, edges } = useMemo(() => {
    const depth = new Map<string, number>();
    const first = states[0]?.id;
    if (first) depth.set(first, 0);
    const queue = first ? [first] : [];
    while (queue.length) {
      const id = queue.shift()!;
      for (const n of states.find((s) => s.id === id)?.next ?? []) {
        if (!depth.has(n)) {
          depth.set(n, (depth.get(id) ?? 0) + 1);
          queue.push(n);
        }
      }
    }
    const perColumn = new Map<number, number>();
    const nodes: Node[] = states.map((s) => {
      const col = depth.get(s.id) ?? 0;
      const row = perColumn.get(col) ?? 0;
      perColumn.set(col, row + 1);
      return {
        id: s.id,
        position: { x: col * 240, y: row * 110 },
        data: { label: `${s.id}: ${s.goal}` },
        style: { width: 200, fontSize: 12, border: "1.5px solid #111", borderRadius: 5, background: "#f2f0eb", padding: 8 },
      };
    });
    const ids = new Set(states.map((s) => s.id));
    const edges: Edge[] = states.flatMap((s) =>
      s.next.filter((n) => ids.has(n)).map((n) => ({ id: `${s.id}->${n}`, source: s.id, target: n, style: { stroke: "#ff4f12", strokeWidth: 1.5 } })),
    );
    return { nodes, edges };
  }, [states]);

  if (states.length === 0) return <p className="text-mute">This agent has no conversation steps yet.</p>;

  return (
    <div className="rule h-96 rounded-sq bg-paper" aria-label="Conversation flow, read only">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
        <Background />
      </ReactFlow>
    </div>
  );
}
