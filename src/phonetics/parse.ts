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

export function parseMantra(input: string): ParsedMantra {
  const { ids, iast } = parseDevanagari(input);
  const times = layoutTimes(ids.length);

  const timed: TimedTarget[] = ids.map((id, i) => ({
    t: times[i]!,
    id,
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

  return {
    label: input.trim() || "ॐ",
    romanization: iast,
    timed,
  };
}
