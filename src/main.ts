import { parseMantra } from "./phonetics/parse.js";
import { drawPath, sampleMantraShape } from "./render/draw.js";

const canvas = document.querySelector<HTMLCanvasElement>("#curve");
const input = document.querySelector<HTMLInputElement>("#mantra-input");
const romanizationEl = document.querySelector<HTMLSpanElement>("#romanization");
const playPauseBtn = document.querySelector<HTMLButtonElement>("#play-pause");
const resetBtn = document.querySelector<HTMLButtonElement>("#reset");
const durationEl = document.querySelector<HTMLInputElement>("#anim-duration");
const durationOut = document.querySelector<HTMLOutputElement>("#anim-duration-out");
const presetBtns = document.querySelectorAll<HTMLButtonElement>(".preset");

if (
  !canvas ||
  !input ||
  !romanizationEl ||
  !playPauseBtn ||
  !resetBtn ||
  !durationEl ||
  !durationOut
) {
  throw new Error("Missing DOM nodes");
}

// ── Animation state ──

let playing = true;
let cycleStartMs = performance.now();
let pausedAtT = 0;
let rafId: number | null = null;

function getDurationMs(): number {
  return Number(durationEl.value) * 1000;
}

function getCurrentT(): number {
  const ms = getDurationMs();
  if (ms <= 0) return 0;
  return ((performance.now() - cycleStartMs) % ms) / ms;
}

function syncPlayPauseButton(): void {
  playPauseBtn.textContent = playing ? "⏸ Pause" : "▶ Play";
  playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function play(): void {
  if (playing) return;
  playing = true;
  const ms = getDurationMs();
  cycleStartMs = performance.now() - pausedAtT * ms;
  syncPlayPauseButton();
  render();
}

function pause(): void {
  if (!playing) return;
  pausedAtT = getCurrentT();
  playing = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  syncPlayPauseButton();
  render();
}

function reset(): void {
  cycleStartMs = performance.now();
  pausedAtT = 0;
  if (!playing) {
    playing = true;
    syncPlayPauseButton();
  }
  render();
}

// ── Rendering ──

function drawFrame(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  t: number,
): void {
  const parsed = parseMantra(input.value);

  romanizationEl.textContent = parsed.romanization;

  const points = sampleMantraShape(parsed, { t });

  ctx.clearRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.strokeStyle = "rgba(124, 183, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cssW / 2, 0);
  ctx.lineTo(cssW / 2, cssH);
  ctx.moveTo(0, cssH / 2);
  ctx.lineTo(cssW, cssH / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(154, 160, 166, 0.85)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(parsed.label, 12, cssH - 14);
  ctx.restore();

  drawPath(ctx, points, cssW, cssH, "rgba(126, 210, 255, 0.95)", 1.75);

  ctx.save();
  ctx.fillStyle = "rgba(154, 160, 166, 0.9)";
  ctx.font = "11px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(
    `${points.length} pts  ·  t = ${Math.round(t * 100)}%`,
    cssW - 12,
    18,
  );
  ctx.restore();
}

function render(): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width;
  const cssH = rect.height;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  durationOut.textContent = durationEl.value;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (playing) {
    const loop = (): void => {
      drawFrame(ctx, cssW, cssH, getCurrentT());
      rafId = requestAnimationFrame(loop);
    };
    loop();
  } else {
    drawFrame(ctx, cssW, cssH, pausedAtT);
  }
}

// ── Event wiring ──

function debounce(fn: () => void, ms: number): () => void {
  let id: number | undefined;
  return () => {
    if (id !== undefined) window.clearTimeout(id);
    id = window.setTimeout(fn, ms);
  };
}

const debouncedReset = debounce(() => {
  reset();
}, 48);

playPauseBtn.addEventListener("click", () => {
  if (playing) pause();
  else play();
});

resetBtn.addEventListener("click", reset);

input.addEventListener("input", debouncedReset);

durationEl.addEventListener("input", () => {
  if (playing) {
    const t = getCurrentT();
    cycleStartMs = performance.now() - t * getDurationMs();
  }
  render();
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mantra = btn.dataset.mantra;
    if (mantra) {
      input.value = mantra;
      reset();
    }
  });
});

window.addEventListener("resize", debounce(() => render(), 48));

syncPlayPauseButton();
render();
