import { describe, expect, it } from "vitest";
import { parseMantra } from "../phonetics/parse.js";
import { sampleMantraShape, styleFor } from "./draw.js";

describe("sampleMantraShape (end-to-end pipeline)", () => {
  it("produces finite points across the whole cycle for varied inputs", () => {
    // Default, long phrase, nukta loanword, unknown placeholder letter
    const inputs = ["ॐ", "ॐ नमो भगवते वासुदेवाय", "फ़ज़ऑ", "ॹ"];
    for (const text of inputs) {
      const parsed = parseMantra(text);
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const pts = sampleMantraShape(parsed, { t, samples: 64 });
        expect(pts.length).toBe(65);
        for (const p of pts) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
        }
      }
    }
  });

  it("collapses to near-zero extent in the leading silence", () => {
    const parsed = parseMantra("ॐ");
    const pts = sampleMantraShape(parsed, { t: 0, samples: 64 });
    const maxR = Math.max(...pts.map((p) => Math.hypot(p.x, p.y)));
    expect(maxR).toBeLessThan(0.05);
  });

  it("is a circle-ish shape at aum's midpoint (u)", () => {
    const parsed = parseMantra("ॐ");
    const pts = sampleMantraShape(parsed, { t: 0.5, samples: 256 });
    const radii = pts.map((p) => Math.hypot(p.x, p.y));
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    expect(min).toBeGreaterThan(0.2); // substantial size
    expect(max / min).toBeLessThan(1.6); // roughly round, not a line
  });
});

describe("styleFor (ghoṣa/prāṇa plateau track)", () => {
  it("holds each consonant's full style value at its keyframe, undiluted by neighbours", () => {
    const parsed = parseMantra("क ख ग घ");
    const style = styleFor(parsed);
    // Every labeled phoneme's keyframe sits in its plateau, so the style
    // there must equal the registry target exactly.
    for (const pt of parsed.timed) {
      if (!pt.iast) continue;
      const s = style(pt.t);
      expect(s.ghosa).toBe(pt.target.ghosa);
      expect(s.prana).toBe(pt.target.prana);
    }
  });

  it("cross-fades continuously at region boundaries", () => {
    const parsed = parseMantra("क ख ग घ"); // ghosa alternates 0/1 across the series
    const style = styleFor(parsed);
    const N = 2000;
    let prev = style(0).ghosa;
    let sawLow = false;
    let sawHigh = false;
    for (let i = 1; i <= N; i++) {
      const cur = style(i / N).ghosa;
      expect(Math.abs(cur - prev)).toBeLessThan(0.05); // no jumps
      if (cur < 0.01) sawLow = true;
      if (cur > 0.99) sawHigh = true;
      prev = cur;
    }
    // Plateaus actually reach both extremes despite the smoothing.
    expect(sawLow).toBe(true);
    expect(sawHigh).toBe(true);
  });
});
