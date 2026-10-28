import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getSignedUrl } from "@/lib/eleven";
import { getCreditStatus } from "@/lib/service";
import { safeId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mints a short-lived signed URL so the browser never sees the API key. */
export async function GET(req: Request) {
  try {
    const agentId = safeId(new URL(req.url).searchParams.get("agentId") ?? "");
    const credits = await getCreditStatus();
    if (!credits.guard.allowed) {
      return NextResponse.json({ error: credits.guard.reason, blockedByCredits: true }, { status: 403 });
    }
    return NextResponse.json({ signedUrl: await getSignedUrl(agentId) });
  } catch (err) {
    return fail(err);
  }
}
