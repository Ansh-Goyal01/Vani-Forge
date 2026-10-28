import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api";
import { getCreditStatus } from "@/lib/service";
import { saveSettings } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCreditStatus());
  } catch (err) {
    return fail(err);
  }
}

/** "Override for demo" toggle, stored in /data/settings.json. */
export async function POST(req: Request) {
  try {
    const { override } = z.object({ override: z.boolean() }).parse(await req.json());
    await saveSettings({ creditOverride: override });
    return NextResponse.json(await getCreditStatus());
  } catch (err) {
    return fail(err);
  }
}
