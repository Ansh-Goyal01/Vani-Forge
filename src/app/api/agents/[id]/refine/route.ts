import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { describeChanges } from "@/lib/patch";
import { proposeRefinement } from "@/lib/refine";
import { getAgentState } from "@/lib/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ instruction: z.string().min(1).max(500) });

/** Proposes a patch; nothing is saved until the owner presses Apply. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { instruction } = Body.parse(await req.json());
    const state = await getAgentState(id);
    if (!state) return NextResponse.json({ error: "We could not find that agent." }, { status: 404 });
    const proposal = await proposeRefinement(state.ir, instruction);
    return NextResponse.json({
      summary: proposal.summary,
      ops: proposal.ops,
      changes: proposal.next ? describeChanges(state.ir, proposal.ops) : [],
      error: proposal.error ?? null,
    });
  } catch (err) {
    return fail(err);
  }
}
