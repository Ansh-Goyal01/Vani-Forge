import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { listConversations } from "@/lib/eleven";
import { safeId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const agentId = safeId(new URL(req.url).searchParams.get("agentId") ?? "");
    return NextResponse.json({ conversations: await listConversations(agentId) });
  } catch (err) {
    return fail(err);
  }
}
