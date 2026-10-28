import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { proposeHeal } from "@/lib/heal";
import { getAgentState } from "@/lib/service";
import { getRun, safeId } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ agentId: z.string(), runId: z.string(), personaId: z.string(), promiseId: z.string() });

/**
 * Proposes a fix for a failed run. Nothing is saved: the owner approves in the UI, which then
 * calls /api/agents/[id]/apply (new VoiceIR version) and re-runs the persona via /api/chaos.
 */
export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const state = await getAgentState(safeId(b.agentId));
    const run = await getRun(safeId(b.agentId), safeId(b.runId));
    if (!state || !run) return NextResponse.json({ error: "We could not find that run." }, { status: 404 });
    return NextResponse.json({ proposal: await proposeHeal(state.ir, run, b.personaId, b.promiseId) });
  } catch (err) {
    return fail(err);
  }
}
