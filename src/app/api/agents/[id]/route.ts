import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { describeState, getAgentState, removeAgent, saveNewVersion } from "@/lib/service";
import { VoiceIR } from "@/lib/voiceir";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const state = await getAgentState(id);
    if (!state) return NextResponse.json({ error: "We could not find that agent on this computer." }, { status: 404 });
    return NextResponse.json(describeState(state));
  } catch (err) {
    return fail(err);
  }
}

const PutBody = z.object({ ir: VoiceIR, note: z.string().max(120).optional() });

/** Full replacement from the form editor. */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { ir, note } = PutBody.parse(await req.json());
    await saveNewVersion(id, ir, note ?? "Edited in the form");
    const state = await getAgentState(id);
    return NextResponse.json(describeState(state!));
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await removeAgent(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
