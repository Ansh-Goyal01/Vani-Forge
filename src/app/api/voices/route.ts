import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { listVoices } from "@/lib/eleven";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const voices = await listVoices({
      search: searchParams.get("search") ?? undefined,
      useCase: searchParams.get("useCase") ?? undefined,
    });
    return NextResponse.json({ voices });
  } catch (err) {
    return fail(err);
  }
}
