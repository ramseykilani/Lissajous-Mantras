import { axesFor, buildTracks, DEFAULT_VIEW_ROTATION, type TrackSample } from "../math/curve.js";
import type { ParsedMantra, TimedTarget } from "../phonetics/types.js";

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

// ── Per-mantra caches ──
// parseMantra memoizes on the input string, so the ParsedMantra object is
// identity-stable across animation frames; tracks are built once per mantra
// instead of once per frame.

const trackCache = new WeakMap<ParsedMantra, (t: number) => TrackSample>();

function trackFor(parsed: ParsedMantra): (t: number) => TrackSample {
  let track = trackCache.get(parsed);
  if (!track) {
    const timed = parsed.timed;
    track = buildTracks(
      timed.map((x) => x.t),
      timed.map((x) => x.target.s),
      timed.map((x) => x.target.p),
      timed.map((x) => x.target.E),
      timed.map((x) => x.target.phi),
      timed.map((x) => x.target.delta),
    );
    trackCache.set(parsed, track);
  }
  return track;
}

const verticalityCache = new WeakMap<ParsedMantra, (t: number) => number>();

function verticalityFor(parsed: ParsedMantra): (t: number) => number {
  let fn = verticalityCache.get(parsed);
  if (!fn) {
    fn = buildVerticalityTrack(parsed);
    verticalityCache.set(parsed, fn);
  }
  return fn;
}

// ── Ghoṣa/prāṇa style track ──

type MantraStyle = { ghosa: number; prana: number };

/** Fraction of the narrower neighbouring region that a boundary cross-fade
 * occupies. The rest of each region is a flat plateau, so a consonant's
 * voicing/aspiration displays at full strength while its letter is active
 * instead of being averaged toward the neighbouring vowel. */
const STYLE_BLEND = 0.6;

function buildStyleTrack(parsed: ParsedMantra): (t: number) => MantraStyle {
  const regions = phonemeRegions(parsed);
  const n = regions.length;
  if (n === 0) return () => ({ ghosa: 0, prana: 0 });
  const g = regions.map((r) => r.pt.target.ghosa);
  const h = regions.map((r) => r.pt.target.prana);
  const widths = regions.map((r) => r.regionR - r.regionL);

  const raisedCos = (u: number): number =>
    (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;

  return (t: number): MantraStyle => {
    let i = 0;
    while (i < n - 1 && t >= regions[i]!.regionR) i++;
    let ghosa = g[i]!;
    let prana = h[i]!;

    // Cross-fade zones are centred on region boundaries and never overlap
    // (each extends at most 0.3× the narrower region's width to each side).
    if (i > 0) {
      const b = regions[i]!.regionL;
      const z = 0.5 * STYLE_BLEND * Math.min(widths[i]!, widths[i - 1]!);
      if (z > 0 && t < b + z) {
        const m = raisedCos((t - (b - z)) / (2 * z));
        ghosa = g[i - 1]! + (g[i]! - g[i - 1]!) * m;
        prana = h[i - 1]! + (h[i]! - h[i - 1]!) * m;
        return { ghosa, prana };
      }
    }
    if (i < n - 1) {
      const b = regions[i]!.regionR;
      const z = 0.5 * STYLE_BLEND * Math.min(widths[i]!, widths[i + 1]!);
      if (z > 0 && t > b - z) {
        const m = raisedCos((t - (b - z)) / (2 * z));
        ghosa = g[i]! + (g[i + 1]! - g[i]!) * m;
        prana = h[i]! + (h[i + 1]! - h[i]!) * m;
      }
    }
    return { ghosa, prana };
  };
}

const styleCache = new WeakMap<ParsedMantra, (t: number) => MantraStyle>();

/** Ghoṣa/prāṇa style channels at mantra time t (plateau-interpolated). */
export function styleFor(parsed: ParsedMantra): (t: number) => MantraStyle {
  let fn = styleCache.get(parsed);
  if (!fn) {
    fn = buildStyleTrack(parsed);
    styleCache.set(parsed, fn);
  }
  return fn;
}

/**
 * Samples a single full Lissajous cycle (theta from 0 to 2pi)
 * using the phonetic parameters evaluated at mantra time `t`.
 */
export function sampleMantraShape(
  parsed: ParsedMantra,
  options: Partial<SampleOptions> = {},
): PathPoint[] {
  const o = { ...defaultOptions, ...options };

  // Evaluate the phonetic parameters at the specific mantra time `t`
  const sample = trackFor(parsed)(o.t);

  // The X:Y aspect comes from the eased verticality track that the bottom graph
  // also plots, so figure and graph stay in exact sync. Overall size (magnitude)
  // still comes from the s,p tracks; only the aspect *angle* is eased.
  const { ax: axRaw, ay: ayRaw } = axesFor(sample.s, sample.p);
  const mag = Math.hypot(axRaw, ayRaw);
  const psi = verticalityFor(parsed)(o.t) * (Math.PI / 2); // 1→vertical (ψ=90°), 0→horizontal (ψ=0°)
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

function drawPath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  w: number,
  h: number,
  strokeStyle: string,
  lineWidth: number,
): void {
  if (points.length === 0) return;

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

/**
 * Draws the mantra figure with phonetic styling from the ghoṣa/prāṇa tracks:
 * voicing (ghoṣa) drives stroke weight and glow — the hum of the vocal cords;
 * aspiration (prāṇa) adds a wide, faint "breath halo" pass around the stroke.
 * Shared by the standard and decomposition views so the two stay identical.
 */
export function drawMantraFigure(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  w: number,
  h: number,
  parsed: ParsedMantra,
  t: number,
): void {
  const { ghosa, prana } = styleFor(parsed)(t);

  // Ghoṣa (voicing) → weight, brightness, glow: unvoiced is a thin faint
  // wire, fully voiced is a thick luminous stroke.
  const lineWidth = 0.8 + 2.6 * ghosa;
  const glow = 2 + 13 * ghosa;
  const alpha = 0.55 + 0.4 * ghosa;

  // Prāṇa (aspiration) → a wide translucent breath band around the stroke,
  // growing with aspiration strength.
  if (prana > 0.02) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(150, 225, 255, ${(0.45 * prana).toFixed(3)})`;
    drawPath(
      ctx, points, w, h,
      `rgba(150, 225, 255, ${(0.28 * prana).toFixed(3)})`,
      lineWidth + 4 + 10 * prana,
    );
    ctx.restore();
  }

  ctx.save();
  ctx.shadowBlur = glow;
  ctx.shadowColor = "rgba(102, 178, 255, 0.6)";
  drawPath(ctx, points, w, h, `rgba(126, 210, 255, ${alpha.toFixed(3)})`, lineWidth);
  ctx.restore();
}

// ── Sine wave timeline ──

const WAVE_PTS = 300;

type PhonemeRegion = { pt: TimedTarget; regionL: number; regionR: number };

/**
 * Labeled (non-silence) phonemes with their time regions: each keyframe is
 * the centre of its region, and dividers sit at midpoints between neighbours.
 */
function phonemeRegions(parsed: ParsedMantra): PhonemeRegion[] {
  const labeled = parsed.timed.filter((pt) => pt.iast);
  return labeled.map((pt, i) => ({
    pt,
    regionL: i > 0 ? (labeled[i - 1]!.t + pt.t) / 2 : 0,
    regionR: i < labeled.length - 1 ? (pt.t + labeled[i + 1]!.t) / 2 : 1,
  }));
}

function getActivePhoneme(parsed: ParsedMantra, t: number): TimedTarget | null {
  const regions = phonemeRegions(parsed);
  for (const { pt, regionL, regionR } of regions) {
    if (t >= regionL && t < regionR) return pt;
  }
  return regions[regions.length - 1]?.pt ?? null;
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
  const { ax, ay } = axesFor(target.s, target.p);
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
  const aspectAt = verticalityFor(parsed);

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
  drawMantraFigure(ctx, points, cssW, lissH, parsed, t);

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
  // Labels are centred within their region at a fixed baseline position.
  const regions = phonemeRegions(parsed);
  const labelY = waveBottom - 4;

  ctx.save();
  for (let i = 0; i < regions.length; i++) {
    const { pt, regionL, regionR } = regions[i]!;
    const centerX = waveL + ((regionL + regionR) / 2) * waveW;

    // Divider at left edge of region (skip the very first)
    if (i > 0) {
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
