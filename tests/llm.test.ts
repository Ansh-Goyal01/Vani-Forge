import { describe, expect, it } from "vitest";
import { LlmBusyError, isNotFound, isRetryable, withRetry } from "@/lib/llm";

const noSleep = async () => {};

describe("withRetry", () => {
  it("retries 429 and then succeeds", async () => {
    let calls = 0;
    const out = await withRetry(
      async () => {
        if (++calls < 3) throw Object.assign(new Error("rate"), { status: 429 });
        return "ok";
      },
      { sleep: noSleep },
    );
    expect(out).toBe("ok");
    expect(calls).toBe(3);
  });
  it("gives a plain busy error after the retries run out", async () => {
    await expect(
      withRetry(async () => Promise.reject(Object.assign(new Error("x"), { status: 429 })), { delays: [1, 1], sleep: noSleep }),
    ).rejects.toBeInstanceOf(LlmBusyError);
  });
  it("does not retry other errors", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => { calls++; throw new Error("boom"); }, { sleep: noSleep }),
    ).rejects.toThrow("boom");
    expect(calls).toBe(1);
  });
  it("classifies statuses, including ones only present in the message", () => {
    expect(isRetryable({ status: 503 })).toBe(true);
    expect(isRetryable(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'))).toBe(true);
    expect(isNotFound({ status: 404 })).toBe(true);
    expect(isNotFound(new Error("fine"))).toBe(false);
  });
});
