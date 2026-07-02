import { describe, expect, it } from "vitest";
import { evalSpline1D, type Knot } from "./spline.js";

const knots = (...pairs: [number, number][]): Knot[] =>
  pairs.map(([t, v]) => ({ t, v }));

describe("evalSpline1D", () => {
  it("handles empty and single-knot inputs", () => {
    expect(evalSpline1D([], 0.5)).toBe(0);
    expect(evalSpline1D(knots([0.5, 3]), 0)).toBe(3);
  });

  it("clamps to endpoint values outside the knot range", () => {
    const k = knots([0.2, 1], [0.8, 5]);
    expect(evalSpline1D(k, 0)).toBe(1);
    expect(evalSpline1D(k, 1)).toBe(5);
  });

  it("passes through every control point", () => {
    const k = knots([0, 0], [0.25, 1], [0.5, 0.3], [1, 0.8]);
    for (const { t, v } of k) {
      expect(evalSpline1D(k, t)).toBeCloseTo(v, 10);
    }
  });

  it("stays flat between equal-valued knots", () => {
    const k = knots([0, 0.7], [0.5, 0.7], [1, 0.7]);
    expect(evalSpline1D(k, 0.31)).toBeCloseTo(0.7, 10);
  });

  it("does not produce NaN for zero-length segments", () => {
    const k = knots([0, 0], [0.5, 1], [0.5, 0.2], [1, 0]);
    expect(Number.isNaN(evalSpline1D(k, 0.5))).toBe(false);
    expect(Number.isNaN(evalSpline1D(k, 0.4))).toBe(false);
  });
});
