import { evalSpline1D, type Knot } from "./spline.js";

/** Global view rotation (rad): 0 aligns the shapes directly to the X/Y axes. */
export const DEFAULT_VIEW_ROTATION = 0;

export type TrackSample = {
  t: number;
  s: number;
  p: number;
  E: number;
  phi: number;
  delta: number;
};

/**
 * Map Sthāna (s) and Prayatna (p) to the anisotropic amplitudes of the
 * Lissajous figure (SPEC §2.1):
 *   s=0 (Velar)  → A_x small, A_y large (tall vertical shape)
 *   s=1 (Labial) → A_x large, A_y shrinks as p closes (wide horizontal shape)
 *   p opens the base line into an ellipse/circle.
 */
export function axesFor(s: number, p: number): { ax: number; ay: number } {
  return { ax: s, ay: 1.0 - s * (1 - p) };
}

function knotsFromControls(
  times: number[],
  values: number[],
): Knot[] {
  return times
    .map((t, i) => ({ t, v: values[i]! }))
    .sort((a, b) => a.t - b.t);
}

/**
 * Build smooth geometry tracks s, p, E, φ, δ from timed control targets (SPEC §2.3).
 * The ghoṣa/prāṇa style channels are NOT splined here — they use plateau
 * interpolation per phoneme region (see render/draw.ts) so a consonant's
 * voicing/aspiration reads at full strength instead of being averaged away
 * by its vowel neighbours.
 */
export function buildTracks(
  times: number[],
  s: number[],
  p: number[],
  E: number[],
  phi: number[],
  delta: number[],
): (t: number) => TrackSample {
  const kS = knotsFromControls(times, s);
  const kP = knotsFromControls(times, p);
  const kE = knotsFromControls(times, E);
  const kPhi = knotsFromControls(times, phi);
  const kDelta = knotsFromControls(times, delta);

  return (t: number) => ({
    t,
    s: Math.max(0, Math.min(1, evalSpline1D(kS, t))),
    p: Math.max(0, Math.min(1, evalSpline1D(kP, t))),
    E: Math.max(0, Math.min(1, evalSpline1D(kE, t))),
    phi: evalSpline1D(kPhi, t),
    delta: evalSpline1D(kDelta, t),
  });
}
