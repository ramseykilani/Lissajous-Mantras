import { buildTracks, DEFAULT_VIEW_ROTATION } from "../math/curve.js";
import type { ParsedMantra, TimedTarget } from "../phonetics/types.js";

export type MantraSample = {
  ax: number;
  ay: number;
  E: number;
  phi: number;
  delta: number;
};

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

// ── Sine wave timeline ──

function buildTrackFn(parsed: ParsedMantra) {
  const times = parsed.timed.map((x) => x.t);
  return buildTracks(
    times,
    parsed.timed.map((x) => x.target.s),
    parsed.timed.map((x) => x.target.p),
    parsed.timed.map((x) => x.target.E),
    parsed.timed.map((x) => x.target.phi),
    parsed.timed.map((x) => x.target.delta),
  );
}

export function getMantraSample(parsed: ParsedMantra, t: number): MantraSample {
  const track = buildTrackFn(parsed);
  const sample = track(t);
  const W = 0.0;
  return {
    ax: sample.s + (1 - sample.s) * sample.p * W,
    ay: 1.0 - sample.s * (1 - sample.p),
    E: sample.E,
    phi: sample.phi,
    delta: sample.delta,
  };
}

const WAVE_PTS = 300;

function getActivePhoneme(parsed: ParsedMantra, t: number): TimedTarget | null {
  const voiced = parsed.timed.filter((pt) => pt.iast);
  if (voiced.length === 0) return null;
  for (let i = 0; i < voiced.length; i++) {
    const pt = voiced[i]!;
    const prev = voiced[i - 1];
    const next = voiced[i + 1];
    const regionL = prev ? (prev.t + pt.t) / 2 : 0;
    const regionR = next ? (pt.t + next.t) / 2 : 1;
    if (t >= regionL && t < regionR) return pt;
  }
  return voiced[voiced.length - 1] ?? null;
}

/**
 * Draws the currently-active phoneme letter centred in the Lissajous area,
 * so the viewer knows which sound the shape represents at any given moment.
 */
export function drawActivePhoneme(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  parsed: ParsedMantra,
  t: number,
): void {
  const active = getActivePhoneme(parsed, t);
  if (!active) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic bold 52px Inter, system-ui";
  ctx.fillStyle = "rgba(126, 210, 255, 0.22)";
  ctx.fillText(active.iast, w / 2, h * 0.28);
  ctx.restore();
}


/** Area of the Lissajous ellipse at mantra time frac — proxy for vocal amplitude. */
function shapeAmplitude(
  track: ReturnType<typeof buildTrackFn>,
  frac: number,
): number {
  const s = track(frac);
  const W = 0.0;
  const ax = s.s + (1 - s.s) * s.p * W;
  const ay = 1.0 - s.s * (1 - s.p);
  // Area of a 1:1 Lissajous ellipse = π·(E·ax)·(E·ay)·|sin(δ)|
  // We drop the constant π and use E·ax·ay·|sin(δ)| as the normalized amplitude.
  return s.E * ax * ay * Math.abs(Math.sin(s.delta));
}

/**
 * Draws the Lissajous figure with a vocal-amplitude envelope at the bottom.
 * The envelope's x-axis is mantra time t (0→1). Its y-value is the geometric
 * area of the Lissajous shape at that moment — zero when the shape is a line
 * (no sound) and maximal when the ellipse is fullest (peak volume). A dot
 * tracks the current playback position.
 */
export function drawDecompositionView(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  parsed: ParsedMantra,
  points: PathPoint[],
  t: number,
): void {
  const track = buildTrackFn(parsed);

  // Layout
  const stripH = Math.round(cssH * 0.18);
  const lissH = cssH - stripH;

  // ── Axes ──
  ctx.save();
  ctx.strokeStyle = "rgba(102, 178, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cssW / 2, 0);
  ctx.lineTo(cssW / 2, lissH);
  ctx.moveTo(0, lissH / 2);
  ctx.lineTo(cssW, lissH / 2);
  ctx.stroke();
  ctx.restore();

  // ── Separator ──
  ctx.save();
  ctx.strokeStyle = "rgba(102, 178, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, lissH);
  ctx.lineTo(cssW, lissH);
  ctx.stroke();
  ctx.restore();

  // ── Lissajous curve ──
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(102, 178, 255, 0.6)";
  drawPath(ctx, points, cssW, lissH, "rgba(126, 210, 255, 0.95)", 2);
  ctx.restore();

  // ── Active phoneme label ──
  drawActivePhoneme(ctx, cssW, lissH, parsed, t);

  // ── Vocal amplitude envelope (bottom strip) ──
  const wavePad = 20;
  const waveL = wavePad;
  const waveR = cssW - wavePad;
  const waveW = waveR - waveL;
  const waveBottom = lissH + stripH - 6;   // baseline (silence)
  const waveTop    = lissH + 6;             // max amplitude

  // Sample the amplitude curve and find the peak for normalisation
  const amps: number[] = [];
  for (let i = 0; i <= WAVE_PTS; i++) {
    amps.push(shapeAmplitude(track, i / WAVE_PTS));
  }
  const maxAmp = Math.max(...amps, 1e-9);

  // Draw as a filled envelope (area under the curve = visual volume)
  ctx.save();
  ctx.shadowBlur = 6;
  ctx.shadowColor = "rgba(126, 210, 255, 0.3)";
  ctx.strokeStyle = "rgba(126, 210, 255, 0.7)";
  ctx.fillStyle   = "rgba(126, 210, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= WAVE_PTS; i++) {
    const frac = i / WAVE_PTS;
    const norm  = amps[i]! / maxAmp;
    const px = waveL + frac * waveW;
    const py = waveBottom - norm * (waveBottom - waveTop);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  // Close fill path along the baseline
  ctx.lineTo(waveR, waveBottom);
  ctx.lineTo(waveL, waveBottom);
  ctx.closePath();
  ctx.fill();
  // Redraw just the top edge for the stroke
  ctx.beginPath();
  for (let i = 0; i <= WAVE_PTS; i++) {
    const frac = i / WAVE_PTS;
    const norm  = amps[i]! / maxAmp;
    const px = waveL + frac * waveW;
    const py = waveBottom - norm * (waveBottom - waveTop);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // ── Phoneme region markers ──
  // Treat each phoneme's keyframe as the centre of its region.
  // Dividers sit at the midpoint between adjacent keyframes.
  // Labels are centred within their region at a fixed baseline position.
  const voiced = parsed.timed.filter((pt) => pt.iast);
  const labelY = waveBottom - 4;

  ctx.save();
  for (let i = 0; i < voiced.length; i++) {
    const pt = voiced[i]!;
    const prev = voiced[i - 1];
    const next = voiced[i + 1];

    const regionL = prev ? (prev.t + pt.t) / 2 : 0;
    const regionR = next ? (pt.t + next.t) / 2 : 1;

    const centerX = waveL + ((regionL + regionR) / 2) * waveW;

    // Divider at left edge of region (skip the very first)
    if (prev) {
      const divX = waveL + regionL * waveW;
      ctx.strokeStyle = "rgba(126, 210, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(divX, lissH + 4);
      ctx.lineTo(divX, waveBottom);
      ctx.stroke();
    }

    // Label centred in its region
    ctx.setLineDash([]);
    ctx.font = "11px Inter, system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(126, 210, 255, 0.6)";
    ctx.fillText(pt.iast, centerX, labelY);
  }
  ctx.restore();

  // ── Playback dot on the envelope ──
  const currentAmp = shapeAmplitude(track, t) / maxAmp;
  const waveDotX = waveL + t * waveW;
  const waveDotY = waveBottom - currentAmp * (waveBottom - waveTop);

  // Vertical cursor line from the dot up into the Lissajous area
  ctx.save();
  ctx.strokeStyle = "rgba(126, 210, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(waveDotX, waveDotY);
  ctx.lineTo(waveDotX, lissH);
  ctx.stroke();
  ctx.restore();

  // Dot
  const r = 4;
  ctx.save();
  ctx.fillStyle = "rgba(126, 210, 255, 0.95)";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(126, 210, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(waveDotX, waveDotY, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // ── Mantra labels ──
  ctx.save();
  ctx.fillStyle = "rgba(139, 148, 158, 0.85)";
  ctx.font = "14px 'Noto Serif Devanagari', serif";
  ctx.textAlign = "left";
  ctx.fillText(parsed.label, 12, lissH - 28);
  ctx.fillStyle = "rgba(102, 178, 255, 0.85)";
  ctx.font = "italic 13px Inter, system-ui";
  ctx.fillText(parsed.romanization, 12, lissH - 12);
  ctx.restore();
}
