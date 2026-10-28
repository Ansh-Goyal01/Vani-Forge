/**
 * Chladni plate maths (pure, unit-tested). A square plate vibrating in mode (n, m) has amplitude
 * f(x, y) = cos(nπx)cos(mπy) − cos(mπx)cos(nπy). Sand is kicked hardest where |f| is large and
 * comes to rest where f ≈ 0, which draws the nodal lines.
 */
export type Mode = readonly [number, number];

export const MODES: Mode[] = [
  [5, 3],
  [7, 2],
  [6, 1],
  [4, 3],
  [7, 4],
];

export function amplitude(x: number, y: number, [n, m]: Mode): number {
  return Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
}

/** One step of the sand: random kick scaled by local amplitude. Mutates `pts` (x,y pairs). Returns mean kick. */
export function step(pts: Float32Array, mode: Mode, strength: number, rand: () => number = Math.random): number {
  let total = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const a = Math.abs(amplitude(pts[i], pts[i + 1], mode));
    const k = strength * a;
    total += a;
    let x = pts[i] + (rand() - 0.5) * k;
    let y = pts[i + 1] + (rand() - 0.5) * k;
    if (x < 0) x = -x;
    if (x > 1) x = 2 - x;
    if (y < 0) y = -y;
    if (y > 1) y = 2 - y;
    pts[i] = x;
    pts[i + 1] = y;
  }
  return total / (pts.length / 2);
}
