/**
 * Catmull-Rom interpolation over non-uniform knots.
 * Provides continuous velocity through control points for fluid, non-stop motion.
 */

export type Knot = { t: number; v: number };

function segmentU(globalT: number, t0: number, t1: number): number {
  const d = t1 - t0;
  if (d <= 0) return 0;
  return (globalT - t0) / d;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * u +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * u3
  );
}

/** Clamped endpoints: duplicate first/last value for missing neighbors. */
export function evalSpline1D(knots: Knot[], t: number): number {
  if (knots.length === 0) return 0;
  if (knots.length === 1) return knots[0].v;

  const sorted = [...knots].sort((a, b) => a.t - b.t);
  const t0 = sorted[0].t;
  const tLast = sorted[sorted.length - 1].t;
  if (t <= t0) return sorted[0].v;
  if (t >= tLast) return sorted[sorted.length - 1].v;

  let i = 0;
  while (i < sorted.length - 1 && !(sorted[i].t <= t && t <= sorted[i + 1].t)) {
    i++;
  }
  if (i >= sorted.length - 1) i = sorted.length - 2;

  const tA = sorted[i].t;
  const tB = sorted[i + 1].t;
  const u = segmentU(t, tA, tB);

  const v = sorted.map((k) => k.v);
  const p0 = i > 0 ? v[i - 1] : v[i];
  const p1 = v[i];
  const p2 = v[i + 1];
  const p3 = i + 2 < v.length ? v[i + 2] : v[i + 1];

  return catmullRom(p0, p1, p2, p3, u);
}

