import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { describeState, getAgentState, undoVersion } from "@/lib/service";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await undoVersion(id);
    return NextResponse.json(describeState((await getAgentState(id))!));
  } catch (err) {
    return fail(err);
  }
}
