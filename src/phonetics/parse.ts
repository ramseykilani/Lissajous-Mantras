import { parseDevanagari } from "./devanagari.js";
import { getTarget } from "./registry.js";
import type { ParsedMantra, TimedTarget } from "./types.js";

/**
 * Knot times: even distribution across [0, 1].
 */
export function layoutTimes(n: number): number[] {
  if (n === 0) return [];
  if (n === 1) return [0.5];

  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    times.push(i / (n - 1));
  }
  return times;
}

// Single-entry memo: the render loop and GIF exporter call parseMantra every
// frame with an unchanged input, and downstream track caches key off the
// returned object's identity.
let memoInput: string | null = null;
let memoResult: ParsedMantra | null = null;

export function parseMantra(input: string): ParsedMantra {
  if (input === memoInput && memoResult) return memoResult;

  const { ids, iasts, iast, unknown } = parseDevanagari(input);
  const times = layoutTimes(ids.length);

  const timed: TimedTarget[] = ids.map((id, i) => ({
    t: times[i]!,
    id,
    iast: iasts[i]!,
    target: getTarget(id),
  }));

  // Contextualize silence: inherit sthāna from nearest neighbor
  // so the envelope opens/closes along the correct trajectory.
  for (let i = 0; i < timed.length; i++) {
    if (timed[i]!.id === "silence") {
      let neighbor = timed[i + 1];
      if (!neighbor || neighbor.id === "silence") {
        neighbor = timed[i - 1];
      }
      if (neighbor && neighbor.id !== "silence") {
        timed[i]!.target.s = neighbor.target.s;
        timed[i]!.target.p = 0;
        timed[i]!.target.E = 0;
      }
    }
  }

  const result: ParsedMantra = {
    label: input.trim() || "ॐ",
    romanization: iast,
    timed,
    unknown,
  };
  memoInput = input;
  memoResult = result;
  return result;
}
