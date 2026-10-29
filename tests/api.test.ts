import { describe, expect, it } from "vitest";
import { ElevenLabsTimeoutError } from "@elevenlabs/elevenlabs-js";
import { fail } from "@/lib/api";

const body = async (err: unknown) => {
  const res = fail(err);
  return { status: res.status, ...((await res.json()) as { error: string }) };
};

describe("fail (plain-language API errors)", () => {
  it("says the service could not be reached when the network drops", async () => {
    const dropped = Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } });
    for (const err of [dropped, new ElevenLabsTimeoutError("Timeout exceeded when calling GET /v2/voices.")]) {
      const r = await body(err);
      expect(r.status).toBe(503);
      expect(r.error).toContain("could not reach");
    }
  });

  it("keeps the generic message for unknown errors", async () => {
    const r = await body(new Error("boom"));
    expect(r.status).toBe(500);
    expect(r.error).toContain("Something went wrong");
  });
});
