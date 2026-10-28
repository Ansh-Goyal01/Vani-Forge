import { describe, expect, it } from "vitest";
import { CREDIT_FLOOR, evaluateCredits } from "@/lib/credits";

describe("credit guard", () => {
  it("allows calls at or above the floor", () => {
    expect(evaluateCredits({ remaining: CREDIT_FLOOR, override: false }).allowed).toBe(true);
    expect(evaluateCredits({ remaining: 30000, override: false }).allowed).toBe(true);
  });
  it("blocks below 6,500 with a reason", () => {
    const g = evaluateCredits({ remaining: 6499, override: false });
    expect(g.allowed).toBe(false);
    expect(g.reason).toContain("6,499");
  });
  it("allows below the floor only with the demo override", () => {
    expect(evaluateCredits({ remaining: 100, override: true }).allowed).toBe(true);
  });
  it("blocks when credits are not connected, even with override", () => {
    expect(evaluateCredits({ remaining: null, override: true }).allowed).toBe(false);
  });
});
