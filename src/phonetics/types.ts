/** Named phonetic target keyed by registry (extensible). */
export type PhonemeId = string;

export type ArticulationTarget = {
  /** Sthāna (Place of articulation): 0 (Velar) to 1 (Labial) */
  s: number;
  /** Ābhyantara Prayatna (Openness): 0 (Stop) to 1 (Vowel) */
  p: number;
  /** Energy/Envelope: 0 (Silence) to 1 (Sound) */
  E: number;
  /** Phase offset φ in x = A_x sin(ωt+φ). */
  phi: number;
  /** Relative phase δ between x and y components. */
  delta: number;
};

export type TimedTarget = {
  t: number;
  id: PhonemeId;
  /** IAST romanization for this phoneme, e.g. "a", "u", "m". Empty for silence. */
  iast: string;
  target: ArticulationTarget;
};

export type ParsedMantra = {
  /** Devanagari input (or fallback label) for display. */
  label: string;
  /** IAST romanization of the parsed input. */
  romanization: string;
  /** Ordered targets with knot times in [0,1]. */
  timed: TimedTarget[];
};
