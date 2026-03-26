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

export type CurveParams = {
  omega: number;
  /** Rotation applied after evaluating x,y in canonical axes. */
  viewRotation: number;
};

function knotsFromControls(
  times: number[],
  values: number[],
): Knot[] {
  return times.map((t, i) => ({ t, v: values[i]! }));
}

/**
 * Build smooth tracks s, p, E, φ, δ from timed control targets (SPEC §2.3).
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

/**
 * Core family (SPEC §2.1): x = E*A_x sin(ωt+φ), y = E*A_y sin(ωt+φ+δ), then rotate by viewRotation.
 * A_x and A_y are derived from Sthāna (s) and Prayatna (p).
 */
export function evalCurvePoint(
  t: number,
  track: (t: number) => TrackSample,
  params: CurveParams,
): { x: number; y: number; amp: number } {
  const sample = track(t);
  
  // Base width for a Velar vowel (thin tall ellipse)
  const W = 0.0;
  
  // Map Sthāna and Prayatna to shape amplitudes
  // s=0 (Velar) -> A_x is small (p*W), A_y is large (1.0)
  // s=1 (Labial) -> A_x is large (1.0), A_y is small (p*W)
  const ax = sample.s + (1 - sample.s) * sample.p * W;
  const ay = 1.0 - sample.s * (1 - sample.p);

  const th = params.omega * t + sample.phi;
  const x0 = sample.E * ax * Math.sin(th);
  const y0 = sample.E * ay * Math.sin(th + sample.delta);
  
  const c = Math.cos(params.viewRotation);
  const sn = Math.sin(params.viewRotation);
  const x = x0 * c - y0 * sn;
  const y = x0 * sn + y0 * c;
  
  const amp = sample.E * Math.hypot(ax, ay);
  return { x, y, amp };
}
