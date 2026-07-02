import { describe, expect, it } from "vitest";
import { layoutTimes, parseMantra } from "./parse.js";
import { getTarget } from "./registry.js";

describe("layoutTimes", () => {
  it("handles edge counts", () => {
    expect(layoutTimes(0)).toEqual([]);
    expect(layoutTimes(1)).toEqual([0.5]);
    expect(layoutTimes(2)).toEqual([0, 1]);
  });

  it("distributes knots evenly across [0, 1]", () => {
    const times = layoutTimes(5);
    expect(times[0]).toBe(0);
    expect(times[4]).toBe(1);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("parseMantra", () => {
  it("memoizes on the input string (object identity is frame-cache key)", () => {
    expect(parseMantra("ॐ")).toBe(parseMantra("ॐ"));
  });

  it("gives silence the sthāna of its voiced neighbor with zero energy", () => {
    const p = parseMantra("ॐ");
    const lead = p.timed[0]!;
    const a = p.timed[1]!;
    expect(lead.id).toBe("silence");
    expect(lead.target.s).toBe(a.target.s);
    expect(lead.target.E).toBe(0);
  });

  it("spans knot times from 0 to 1", () => {
    const p = parseMantra("ॐ नमः शिवाय");
    expect(p.timed[0]!.t).toBe(0);
    expect(p.timed[p.timed.length - 1]!.t).toBe(1);
  });

  it("surfaces unknown characters", () => {
    expect(parseMantra("ॐq").unknown).toEqual(["q"]);
  });
});

describe("registry ghoṣa/prāṇa channels", () => {
  it("distinguishes the velar stop series by voicing and aspiration", () => {
    const ka = getTarget("ka");
    const kha = getTarget("kha");
    const ga = getTarget("ga");
    const gha = getTarget("gha");
    // Same geometry cell…
    for (const t of [kha, ga, gha]) {
      expect(t.s).toBe(ka.s);
      expect(t.p).toBe(ka.p);
    }
    // …distinguished by the new channels.
    expect([ka.ghosa, ka.prana]).toEqual([0, 0]);
    expect([kha.ghosa, kha.prana]).toEqual([0, 1]);
    expect([ga.ghosa, ga.prana]).toEqual([1, 0]);
    expect([gha.ghosa, gha.prana]).toEqual([1, 1]);
  });

  it("distinguishes ज़ (z) from स (s) by voicing in the same cell", () => {
    const za = getTarget("za");
    const sa = getTarget("sa");
    expect(za.s).toBe(sa.s);
    expect(za.p).toBe(sa.p);
    expect(za.ghosa).toBe(1);
    expect(sa.ghosa).toBe(0);
  });

  it("falls back to a neutral target for unregistered ids", () => {
    expect(getTarget("definitely-not-a-phoneme")).toEqual(getTarget("unknown"));
  });
});
