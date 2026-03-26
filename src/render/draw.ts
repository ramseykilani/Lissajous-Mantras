import { buildTracks, DEFAULT_VIEW_ROTATION } from "../math/curve.js";
import type { ParsedMantra } from "../phonetics/types.js";

/** Segments for one full θ sweep (0…2π); higher = smoother polyline, negligible CPU here. */
export const DEFAULT_THETA_SAMPLES = 2400;

export type SampleOptions = {
  samples: number;
  /** The mantra time t in [0, 1] to sample the shape for. */
  t: number;
};

const defaultOptions: SampleOptions = {
  samples: DEFAULT_THETA_SAMPLES,
  t: 0.5,
};

export type PathPoint = { x: number; y: number };

/**
 * Samples a single full Lissajous cycle (theta from 0 to 2pi) 
 * using the phonetic parameters evaluated at mantra time `t`.
 */
export function sampleMantraShape(
  parsed: ParsedMantra,
  options: Partial<SampleOptions> = {},
): PathPoint[] {
  const o = { ...defaultOptions, ...options };
  const times = parsed.timed.map((x) => x.t);
  const s = parsed.timed.map((x) => x.target.s);
  const p = parsed.timed.map((x) => x.target.p);
  const E = parsed.timed.map((x) => x.target.E);
  const phi = parsed.timed.map((x) => x.target.phi);
  const delta = parsed.timed.map((x) => x.target.delta);

  const track = buildTracks(times, s, p, E, phi, delta);
  
  // Evaluate the phonetic parameters at the specific mantra time `t`
  const sample = track(o.t);
  
  const W = 0.0;
  const ax = sample.s + (1 - sample.s) * sample.p * W;
  const ay = 1.0 - sample.s * (1 - sample.p);
  
  const pts: PathPoint[] = [];
  const n = Math.max(8, Math.floor(o.samples));
  
  const c = Math.cos(DEFAULT_VIEW_ROTATION);
  const sn = Math.sin(DEFAULT_VIEW_ROTATION);

  // Draw one full Lissajous cycle for these parameters
  for (let i = 0; i <= n; i++) {
    const theta = (i / n) * 2 * Math.PI;
    
    const x0 = sample.E * ax * Math.sin(theta + sample.phi);
    const y0 = sample.E * ay * Math.sin(theta + sample.phi + sample.delta);
    
    const x = x0 * c - y0 * sn;
    const y = x0 * sn + y0 * c;
    
    pts.push({ x, y });
  }

  return pts;
}

export function boundsOf(
  points: { x: number; y: number }[],
  pad = 0.12,
): { minX: number; maxX: number; minY: number; maxY: number } {
  if (points.length === 0) {
    return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const px = w * pad;
  const py = h * pad;
  return {
    minX: minX - px,
    maxX: maxX + px,
    minY: minY - py,
    maxY: maxY + py,
  };
}

export type RectBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * When animating a partial path, pass bounds from the full curve so scale/center stay fixed.
 */
export function drawPath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  w: number,
  h: number,
  strokeStyle: string,
  lineWidth: number,
  layoutBounds?: RectBounds,
): void {
  if (points.length === 0) return;

  const b = layoutBounds ?? boundsOf(points);
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;
  // Use a fixed scale based on the maximum possible extent (approx 1.5)
  // so the shape actually grows and shrinks visually, rather than auto-scaling to fill the screen.
  const fixedScale = 0.92 * Math.min(w / 2.5, h / 2.5);
  const cx = 0;
  const cy = 0;

  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const sx = w / 2 + (p.x - cx) * fixedScale;
    const sy = h / 2 - (p.y - cy) * fixedScale;
    if (i === 0) {
      ctx.moveTo(sx, sy);
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
  ctx.restore();
}
