import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ElevenConfigError, missingPermission, missingPermissionMessage } from "./eleven";
import { LlmBusyError, LlmConfigError, LlmOutputError } from "./llm";
import { PatchError } from "./patch";

/** Turns any thrown error into a plain-language JSON response. Never leaks stacks or keys. */
export function fail(err: unknown): NextResponse {
  let status = 500;
  let message = "Something went wrong on our side. Please try again.";
  let needsKeys = false;

  if (err instanceof ElevenConfigError || err instanceof LlmConfigError) {
    status = 503;
    needsKeys = true;
    message = err.message;
  } else if (err instanceof LlmBusyError) {
    status = 503;
    message = err.message;
  } else if (err instanceof LlmOutputError || err instanceof PatchError) {
    status = 422;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Some details are missing or invalid: " + err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ");
  } else if (typeof err === "object" && err !== null && "statusCode" in err) {
    const code = Number((err as { statusCode?: number }).statusCode);
    const permission = missingPermission(err);
    if (permission) {
      needsKeys = true;
      message = missingPermissionMessage(permission);
    } else if (code === 401) message = "ElevenLabs did not accept the API key. Check ELEVENLABS_API_KEY in .env.local.";
    else if (code === 404) message = "ElevenLabs could not find that item.";
    else if (code === 422) message = "ElevenLabs rejected this agent setup. Open X-Ray for details.";
    else if (code === 429) message = "ElevenLabs is busy. Please try again in a few seconds.";
    status = code >= 400 && code < 600 ? code : 500;
  } else if (err instanceof Error && /^(Please|Nothing|Agent not found|Invalid id)/.test(err.message)) {
    status = 400;
    message = err.message;
  }

  if (status === 500) console.error("[api]", err instanceof Error ? err.name + ": " + err.message : "unknown error");
  return NextResponse.json({ error: message, needsKeys }, { status });
}
