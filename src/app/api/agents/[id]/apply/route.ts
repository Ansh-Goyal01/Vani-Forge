import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { applyOps, RawOp } from "@/lib/patch";
import { describeState, getAgentState, saveNewVersion } from "@/lib/service";

export const runtime = "nodejs";

const Body = z.object({ ops: z.array(RawOp).min(1), note: z.string().max(120).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ops, note } = Body.parse(await req.json());
    const state = await getAgentState(id);
    if (!state) return NextResponse.json({ error: "We could not find that agent." }, { status: 404 });
    await saveNewVersion(id, applyOps(state.ir, ops), note ?? "Changed by chat");
    return NextResponse.json(describeState((await getAgentState(id))!));
  } catch (err) {
    return fail(err);
  }
}
