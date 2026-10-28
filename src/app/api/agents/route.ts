import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import * as store from "@/lib/store";
import { createAgentFromIR } from "@/lib/service";
import { draftToIR, VoiceIR, VoiceIRDraft } from "@/lib/voiceir";

export const runtime = "nodejs";

const Body = z.object({ draft: VoiceIRDraft, voiceId: z.string().min(1) });

export async function GET() {
  try {
    const ids = await store.listAgentIds();
    const agents = [];
    for (const id of ids) {
      const meta = await store.getMeta(id);
      const ir = meta ? await store.loadVersion(id, meta.history.current) : null;
      if (ir) agents.push({ agentId: id, name: ir.business.name, version: ir.version });
    }
    return NextResponse.json({ agents });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const { draft, voiceId } = Body.parse(await req.json());
    const ir: VoiceIR = draftToIR(draft, voiceId, Boolean(process.env.OWNER_TRANSFER_NUMBER?.trim()));
    const { agentId } = await createAgentFromIR(ir);
    return NextResponse.json({ agentId });
  } catch (err) {
    return fail(err);
  }
}
