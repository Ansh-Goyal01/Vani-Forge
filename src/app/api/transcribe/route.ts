import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { transcribe } from "@/lib/eleven";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob) || file.size === 0) throw new Error("Please record something first.");
    if (file.size > MAX_BYTES) throw new Error("That recording is too long. Please keep it under a minute.");
    return NextResponse.json({ text: await transcribe(file) });
  } catch (err) {
    return fail(err);
  }
}
