import { parseMantra } from "./phonetics/parse.js";
import { drawPath, sampleMantraShape } from "./render/draw.js";

const canvas = document.querySelector<HTMLCanvasElement>("#curve");
const input = document.querySelector<HTMLInputElement>("#mantra-input");
const romanizationEl = document.querySelector<HTMLSpanElement>("#romanization");
const playPauseBtn = document.querySelector<HTMLButtonElement>("#play-pause");
const resetBtn = document.querySelector<HTMLButtonElement>("#reset");
const durationEl = document.querySelector<HTMLInputElement>("#anim-duration");
const durationOut = document.querySelector<HTMLOutputElement>("#anim-duration-out");
const timelineEl = document.querySelector<HTMLInputElement>("#timeline");
const presetBtns = document.querySelectorAll<HTMLButtonElement>(".preset");
const exportBtn = document.querySelector<HTMLButtonElement>("#export-btn");

// Tabs
const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
const tabContents = document.querySelectorAll<HTMLDivElement>(".tab-content");

// Modal
const aboutBtn = document.querySelector<HTMLButtonElement>("#about-btn");
const closeModalBtn = document.querySelector<HTMLButtonElement>("#close-modal");
const modal = document.querySelector<HTMLDivElement>("#about-modal");

if (
  !canvas ||
  !input ||
  !romanizationEl ||
  !playPauseBtn ||
  !resetBtn ||
  !durationEl ||
  !durationOut ||
  !timelineEl
) {
  throw new Error("Missing DOM nodes");
}

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReducedMotion) {
  durationEl.value = "24"; // Default to slower
}

// ── URL State ──

function updateUrl(mantra: string) {
  const url = new URL(window.location.href);
  if (mantra === "ॐ") {
    url.searchParams.delete("mantra");
  } else {
    url.searchParams.set("mantra", mantra);
  }
  window.history.replaceState({}, "", url);
}

function loadFromUrl() {
  const url = new URL(window.location.href);
  const mantra = url.searchParams.get("mantra");
  if (mantra) {
    input.value = mantra;
  }
}

loadFromUrl();

// ── Animation state ──

let playing = !prefersReducedMotion;
let cycleStartMs = performance.now();
let pausedAtT = 0;
let rafId: number | null = null;
let isDraggingTimeline = false;

function getDurationMs(): number {
  return Number(durationEl.value) * 1000;
}

function getCurrentT(): number {
  if (isDraggingTimeline) {
    return Number(timelineEl.value);
  }
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
  timelineEl.value = "0";
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
  isExport = false
): void {
  const parsed = parseMantra(input.value);

  if (!isExport) {
    romanizationEl.textContent = parsed.romanization;
    if (!isDraggingTimeline) {
      timelineEl.value = t.toString();
    }
  }

  const points = sampleMantraShape(parsed, { t });

  if (isExport) {
    ctx.fillStyle = "#07090c"; // Match var(--bg)
    ctx.fillRect(0, 0, cssW, cssH);
  } else {
    ctx.clearRect(0, 0, cssW, cssH);
  }

  // Draw axes
  ctx.save();
  ctx.strokeStyle = "rgba(102, 178, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cssW / 2, 0);
  ctx.lineTo(cssW / 2, cssH);
  ctx.moveTo(0, cssH / 2);
  ctx.lineTo(cssW, cssH / 2);
  ctx.stroke();
  
  // Label
  ctx.fillStyle = "rgba(139, 148, 158, 0.85)";
  ctx.font = "14px 'Noto Serif Devanagari', serif";
  ctx.textAlign = "left";
  ctx.fillText(parsed.label, 12, cssH - 28);
  
  ctx.fillStyle = "rgba(102, 178, 255, 0.85)";
  ctx.font = "italic 13px Inter, system-ui";
  ctx.fillText(parsed.romanization, 12, cssH - 12);
  ctx.restore();

  // Draw glowing curve
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(102, 178, 255, 0.6)";
  drawPath(ctx, points, cssW, cssH, "rgba(126, 210, 255, 0.95)", 2);
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

  if (playing && !isDraggingTimeline) {
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
  updateUrl(input.value);
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

timelineEl.addEventListener("input", () => {
  isDraggingTimeline = true;
  pausedAtT = Number(timelineEl.value);
  render();
});

timelineEl.addEventListener("change", () => {
  isDraggingTimeline = false;
  if (playing) {
    cycleStartMs = performance.now() - pausedAtT * getDurationMs();
    render();
  }
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mantra = btn.dataset.mantra;
    if (mantra) {
      input.value = mantra;
      updateUrl(mantra);
      reset();
    }
  });
});

exportBtn?.addEventListener("click", async () => {
  if (!exportBtn) return;
  
  const originalText = exportBtn.textContent || "⤓ Export";
  exportBtn.disabled = true;

  try {
    const parsed = parseMantra(input.value);
    const safeName = parsed.romanization.replace(/\s+/g, '-');
    
    const width = 400;
    const height = 400;
    const fps = 20;
    // Use the user's selected duration, capped at 10s to avoid massive files
    const durationSec = Math.min(getDurationMs() / 1000, 10); 
    const totalFrames = Math.floor(fps * durationSec); 
    
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
    if (!offCtx) throw new Error("No 2d context");

    // @ts-ignore
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
    const gif = new GIFEncoder();
    
    for (let i = 0; i < totalFrames; i++) {
      exportBtn.textContent = `Exporting (${Math.round((i / totalFrames) * 100)}%)...`;
      
      const t = i / totalFrames;
      
      drawFrame(offCtx, width, height, t, true);
      
      const { data } = offCtx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256, { format: "rgb565" });
      const index = applyPalette(data, palette, "rgb565");
      
      gif.writeFrame(index, width, height, { palette, delay: 1000 / fps });
      
      // Yield to main thread to update UI
      await new Promise(r => setTimeout(r, 0));
    }
    
    exportBtn.textContent = "Encoding GIF...";
    await new Promise(r => setTimeout(r, 10));
    
    gif.finish();
    const bytes = gif.bytes();
    
    const blob = new Blob([bytes], { type: "image/gif" });
    const link = document.createElement("a");
    link.download = `${safeName}.gif`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    
  } catch (err) {
    console.error(err);
    alert("Error exporting GIF");
  } finally {
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
});

// Tabs logic
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    
    tab.classList.add("active");
    const targetId = tab.dataset.target;
    if (targetId) {
      document.getElementById(targetId)?.classList.add("active");
    }
  });
});

// Modal logic
aboutBtn?.addEventListener("click", () => {
  modal?.classList.remove("hidden");
});

closeModalBtn?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

window.addEventListener("resize", debounce(() => render(), 48));

syncPlayPauseButton();
render();
