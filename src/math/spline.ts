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

/**
 * Knots must be sorted ascending by t (callers build them once via
 * buildTracks). Clamped endpoints: duplicate first/last value for missing
 * neighbors. Allocation-free per evaluation — this runs hundreds of times
 * per animation frame.
 */
export function evalSpline1D(knots: Knot[], t: number): number {
  const n = knots.length;
  if (n === 0) return 0;
  if (n === 1) return knots[0]!.v;

  if (t <= knots[0]!.t) return knots[0]!.v;
  if (t >= knots[n - 1]!.t) return knots[n - 1]!.v;

  let i = 0;
  while (i < n - 2 && t > knots[i + 1]!.t) {
    i++;
  }

  const u = segmentU(t, knots[i]!.t, knots[i + 1]!.t);

  const p0 = i > 0 ? knots[i - 1]!.v : knots[i]!.v;
  const p1 = knots[i]!.v;
  const p2 = knots[i + 1]!.v;
  const p3 = i + 2 < n ? knots[i + 2]!.v : knots[i + 1]!.v;

  return catmullRom(p0, p1, p2, p3, u);
}
