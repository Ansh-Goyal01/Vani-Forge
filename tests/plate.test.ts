import { describe, expect, it } from "vitest";
import { MODES, amplitude, step } from "@/lib/plate";

describe("Chladni plate maths", () => {
  it("is zero on the diagonal for every mode (a nodal line)", () => {
    for (const m of MODES) for (const t of [0.1, 0.33, 0.8]) expect(Math.abs(amplitude(t, t, m))).toBeLessThan(1e-9);
  });
  it("keeps sand on the plate and lowers the mean kick as it settles", () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pts = new Float32Array(4000).map(() => rand());
    const first = step(pts, [5, 3], 0.06, rand);
    let last = first;
    for (let i = 0; i < 200; i++) last = step(pts, [5, 3], 0.06, rand);
    expect(pts.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(last).toBeLessThan(first * 0.6);
  });
});
