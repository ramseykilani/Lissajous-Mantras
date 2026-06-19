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
  const verticalityAt = buildVerticalityTrack(parsed);

  // Evaluate the phonetic parameters at the specific mantra time `t`
  const sample = track(o.t);

  // The X:Y aspect comes from the eased verticality track that the bottom graph
  // also plots, so figure and graph stay in exact sync. Overall size (magnitude)
  // still comes from the s,p tracks; only the aspect *angle* is eased.
  const W = 0.0;
  const axRaw = sample.s + (1 - sample.s) * sample.p * W;
  const ayRaw = 1.0 - sample.s * (1 - sample.p);
  const mag = Math.hypot(axRaw, ayRaw);
  const psi = verticalityAt(o.t) * (Math.PI / 2); // 1→vertical (ψ=90°), 0→horizontal (ψ=0°)
  const ax = mag * Math.cos(psi);
  const ay = mag * Math.sin(psi);

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


/** Verticality of a single phoneme target, in [0,1] — the angle of its (X,Y)
 * extent vector. Energy E is a common factor in ax and ay that cancels, so this
 * is pure shape proportion, not loudness:
 *   1   → tall vertical line   (ay ≫ ax, e.g. throat sounds)  → top of strip
 *   0.5 → circle               (ax === ay)                    → centre line
 *   0   → wide horizontal line (ax ≫ ay, e.g. closed-lip m)   → bottom of strip
 * The angle (atan2) keeps the 0↔∞ ends symmetric about the circle. ax and ay are
 * never both zero, so atan2 is well-defined.
 */
function targetVerticality(target: TimedTarget["target"]): number {
  const W = 0.0;
  const ax = target.s + (1 - target.s) * target.p * W;
  const ay = 1.0 - target.s * (1 - target.p);
  return Math.atan2(ay, ax) / (Math.PI / 2);
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * Eased verticality track, shared by the figure ([sampleMantraShape]) and the
 * bottom graph so the two are in exact sync with no separate smoothing.
 *
 * Each held/silent shape is an "anchor"; a transition between two anchors is a
 * single raised-cosine ramp. The effect:
 *   • held / silent shapes read as flat shoulders (the leading & lagging lines);
 *   • a transition is one clean sine sweep — slope zero at the shoulders and a
 *     single maximum at the midpoint, like a sine crossing zero (no bumps);
 *   • interior phonemes simply land on that sweep rather than pinning it, so the
 *     curve never overshoots. For aum the circle u lands at ~0.5 (still a circle)
 *     at the steepest point of the descent.
 *
 * Anchors are the endpoints plus every point where the verticality reverses
 * direction. Silence inherits its nearest voiced neighbour's verticality, so a
 * silent tail holds the last real shape instead of dragging the curve onward.
 */
function buildVerticalityTrack(parsed: ParsedMantra): (t: number) => number {
  const timed = parsed.timed;
  const n = timed.length;
  const ts = timed.map((pt) => pt.t);
  const v = timed.map((pt) => targetVerticality(pt.target));

  for (let i = 0; i < n; i++) {
    if (timed[i]!.id !== "silence") continue;
    let j = i + 1;
    while (j < n && timed[j]!.id === "silence") j++;
    if (j >= n) { j = i - 1; while (j >= 0 && timed[j]!.id === "silence") j--; }
    if (j >= 0 && j < n) v[i] = v[j]!;
  }

  const EPS = 1e-9;
  const dir = (j: number): number =>
    v[j + 1]! > v[j]! + EPS ? 1 : v[j + 1]! < v[j]! - EPS ? -1 : 0;
  const anchors: number[] = [0];
  for (let i = 1; i < n - 1; i++) if (dir(i - 1) !== dir(i)) anchors.push(i);
  if (n > 1) anchors.push(n - 1);

  return (t: number): number => {
    if (n === 0) return 0.5;
    if (t <= ts[0]!) return clamp01(v[0]!);
    if (t >= ts[n - 1]!) return clamp01(v[n - 1]!);
    let s = 0;
    while (
      s < anchors.length - 1 &&
      !(ts[anchors[s]!]! <= t && t <= ts[anchors[s + 1]!]!)
    ) s++;
    const A = anchors[s]!, B = anchors[s + 1]!;
    const span = ts[B]! - ts[A]!;
    const tau = span > 0 ? (t - ts[A]!) / span : 0;
    return clamp01(v[A]! + (v[B]! - v[A]!) * (1 - Math.cos(Math.PI * tau)) / 2);
  };
}

/**
 * Draws the Lissajous figure with an aspect-ratio graph at the bottom.
 * The graph's x-axis is mantra time t (0→1). Its y-value is the figure's
 * verticality at that moment — top edge when the shape is a tall vertical line,
 * the center line when it's a circle, and the bottom edge when it's a wide
 * horizontal line. A dot tracks the current playback position.
 */
export function drawDecompositionView(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  parsed: ParsedMantra,
  points: PathPoint[],
  t: number,
): void {
  const aspectAt = buildVerticalityTrack(parsed);

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

  // ── Aspect-ratio graph (bottom strip) ──
  const wavePad = 20;
  const waveL = wavePad;
  const waveR = cssW - wavePad;
  const waveW = waveR - waveL;
  const waveBottom = lissH + stripH - 6;   // value 0 → wide horizontal line
  const waveTop    = lissH + 6;             // value 1 → tall vertical line
  const waveMid    = waveBottom - 0.5 * (waveBottom - waveTop); // value 0.5 → circle

  const valueToY = (value: number): number =>
    waveBottom - value * (waveBottom - waveTop);

  // ── Center reference line (circle = X:Y of 1:1) ──
  ctx.save();
  ctx.strokeStyle = "rgba(126, 210, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(waveL, waveMid);
  ctx.lineTo(waveR, waveMid);
  ctx.stroke();
  ctx.restore();

  // ── Edge markers (orient the reader: tall above, wide below) ──
  ctx.save();
  ctx.font = "9px Inter, system-ui";
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(126, 210, 255, 0.4)";
  ctx.textBaseline = "top";
  ctx.fillText("↕", waveL - 6, waveTop);
  ctx.textBaseline = "middle";
  ctx.fillText("○", waveL - 6, waveMid);
  ctx.textBaseline = "bottom";
  ctx.fillText("↔", waveL - 6, waveBottom);
  ctx.restore();

  // ── Aspect-ratio curve (clean stroked line, absolute 0..1 scale) ──
  ctx.save();
  ctx.shadowBlur = 6;
  ctx.shadowColor = "rgba(126, 210, 255, 0.3)";
  ctx.strokeStyle = "rgba(126, 210, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= WAVE_PTS; i++) {
    const frac = i / WAVE_PTS;
    const px = waveL + frac * waveW;
    const py = valueToY(aspectAt(frac));
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

  // ── Playback dot on the aspect-ratio curve ──
  const waveDotX = waveL + t * waveW;
  const waveDotY = valueToY(aspectAt(t));

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
