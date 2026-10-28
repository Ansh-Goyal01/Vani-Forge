/** Credit guard (CLAUDE.md section 4). Pure, so it is unit-tested without keys. */

export const CREDIT_FLOOR = 6500;
export const TEST_CALL_SECONDS = 90;

export type CreditGuard = { allowed: boolean; reason?: string };

export function evaluateCredits(input: {
  remaining: number | null;
  override: boolean;
  floor?: number;
}): CreditGuard {
  const floor = input.floor ?? CREDIT_FLOOR;
  if (input.remaining === null) {
    return { allowed: false, reason: "Credits are not connected yet, so live calls are off. Add your ElevenLabs key." };
  }
  if (input.remaining >= floor) return { allowed: true };
  if (input.override) return { allowed: true, reason: "Below the safety reserve, running on demo override." };
  return {
    allowed: false,
    reason: `Only ${input.remaining.toLocaleString("en-IN")} credits are left. Live calls are paused to protect the demo-day reserve of ${floor.toLocaleString("en-IN")}.`,
  };
}
