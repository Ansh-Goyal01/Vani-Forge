import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { PERSONAS } from "@/lib/personas";
import { runAudioChaos } from "@/lib/audio-chaos";
import { getAgentState, getCreditStatus } from "@/lib/service";
import { listRuns, safeId } from "@/lib/store";
import { runTextChaos, TEXT_K } from "@/lib/text-chaos";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const Body = z.object({
  agentId: z.string(),
  tier: z.enum(["text", "audio"]),
  personaIds: z.array(z.string()).optional(),
  k: z.number().int().min(1).max(5).optional(),
});

/** Past runs plus the persona list. */
export async function GET(req: Request) {
  try {
    const agentId = safeId(new URL(req.url).searchParams.get("agentId") ?? "");
    return NextResponse.json({
      personas: PERSONAS.map(({ id, name, summary, targets }) => ({ id, name, summary, targets })),
      runs: await listRuns(agentId),
      textK: TEXT_K,
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const state = await getAgentState(safeId(body.agentId));
    if (!state) return NextResponse.json({ error: "We could not find that agent." }, { status: 404 });

    if (body.tier === "audio") {
      const credits = await getCreditStatus();
      if (!credits.guard.allowed) return NextResponse.json({ error: credits.guard.reason, blockedByCredits: true }, { status: 403 });
      return NextResponse.json({ run: await runAudioChaos(body.agentId, state.ir, { personaIds: body.personaIds }) });
    }
    return NextResponse.json({ run: await runTextChaos(body.agentId, state.ir, { personaIds: body.personaIds, k: body.k }) });
  } catch (err) {
    return fail(err);
  }
}
