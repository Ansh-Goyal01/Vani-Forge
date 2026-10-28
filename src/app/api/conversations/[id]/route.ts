import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getConversation } from "@/lib/eleven";
import { safeId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ conversation: await getConversation(safeId((await params).id)) });
  } catch (err) {
    return fail(err);
  }
}
