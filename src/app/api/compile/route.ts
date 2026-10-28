import { NextResponse } from "next/server";
import { z } from "zod";
import { BRIEF_MAX_CHARS, draftFromBrief } from "@/lib/brief";
import { fail } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  brief: z.string().min(1).max(BRIEF_MAX_CHARS),
  knowledgeText: z.string().max(60000).optional(),
  pdfBase64: z.string().max(8_000_000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const { draft, cached } = await draftFromBrief(body);
    return NextResponse.json({
      draft,
      cached,
      transferNumberSet: Boolean(process.env.OWNER_TRANSFER_NUMBER?.trim()),
    });
  } catch (err) {
    return fail(err);
  }
}
