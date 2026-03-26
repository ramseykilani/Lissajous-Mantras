import type { ArticulationTarget, PhonemeId } from "./types.js";

// ── Sthāna (Place of articulation) ──
export const S_KANTHA = 0.0;   // Velar / Throat (kaṇṭhya)
export const S_TALU = 0.25;    // Palatal (tālavya)
export const S_MURDHA = 0.5;   // Retroflex (mūrdhanya)
export const S_DANTA = 0.75;   // Dental (dantya)
export const S_OSHTHA = 1.0;   // Labial / Lips (oṣṭhya)

// ── Ābhyantara Prayatna (Openness / Effort) ──
export const P_SPRSTA = 0.0;       // Stop / Closed (spṛṣṭa)
export const P_NASAL = 0.05;       // Nasal stop — slight opening for airflow
export const P_ISAT_SPRSTA = 0.3;  // Semivowel / Slightly open (īṣat-spṛṣṭa)
export const P_ISAT_VIVRTA = 0.6;  // Fricative / Half open (īṣat-vivṛta)
export const P_VIVRTA = 1.0;       // Vowel / Open (vivṛta)

const HP = Math.PI / 2; // δ = π/2 → orthogonal components

/**
 * Full Sanskrit phoneme registry.
 *
 * Each entry defines the archetypal articulatory target for one phoneme.
 * In v1 only sthāna (s) and prayatna (p) produce visible shape differences;
 * voicing (ghoṣa) and aspiration (prāṇa) are not yet encoded, so consonants
 * within the same varga share identical targets — they will diverge in v3.
 */
const R: Record<PhonemeId, ArticulationTarget> = {

  // ── Silence ──
  silence: { s: S_KANTHA, p: P_SPRSTA, E: 0, phi: 0, delta: HP },

  // ── Vowels (vivṛta, p = 1) ──
  a:   { s: S_KANTHA,  p: P_VIVRTA, E: 1, phi: 0,    delta: HP },
  aa:  { s: S_KANTHA,  p: P_VIVRTA, E: 1, phi: 0,    delta: HP },
  i:   { s: S_TALU,    p: P_VIVRTA, E: 1, phi: 0.05, delta: HP },
  ii:  { s: S_TALU,    p: P_VIVRTA, E: 1, phi: 0.05, delta: HP },
  u:   { s: S_OSHTHA,  p: P_VIVRTA, E: 1, phi: 0.12, delta: HP },
  uu:  { s: S_OSHTHA,  p: P_VIVRTA, E: 1, phi: 0.12, delta: HP },
  ri:  { s: S_MURDHA,  p: P_VIVRTA, E: 1, phi: 0.08, delta: HP },
  rii: { s: S_MURDHA,  p: P_VIVRTA, E: 1, phi: 0.08, delta: HP },
  li:  { s: S_DANTA,   p: P_VIVRTA, E: 1, phi: 0.06, delta: HP },
  e:   { s: 0.125,     p: P_VIVRTA, E: 1, phi: 0.03, delta: HP }, // kaṇṭha-tālavya
  ai:  { s: 0.125,     p: P_VIVRTA, E: 1, phi: 0.04, delta: HP },
  o:   { s: 0.5,       p: P_VIVRTA, E: 1, phi: 0.10, delta: HP }, // kaṇṭha-oṣṭhya
  au:  { s: 0.5,       p: P_VIVRTA, E: 1, phi: 0.11, delta: HP },

  // ── Velar stops (kaṇṭhya spṛṣṭa) ──
  ka:  { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP },
  kha: { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP },
  ga:  { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP },
  gha: { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP },

  // ── Palatal stops (tālavya spṛṣṭa) ──
  ca:  { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP },
  cha: { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP },
  ja:  { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP },
  jha: { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP },

  // ── Retroflex stops (mūrdhanya spṛṣṭa) ──
  tta:  { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  ttha: { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  dda:  { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  ddha: { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },

  // ── Dental stops (dantya spṛṣṭa) ──
  ta:  { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  tha: { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  da:  { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  dha: { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },

  // ── Labial stops (oṣṭhya spṛṣṭa) ──
  pa:  { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  pha: { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  ba:  { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },
  bha: { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP },

  // ── Nasals (slight opening for nasal airflow) ──
  nga: { s: S_KANTHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP },
  nya: { s: S_TALU,   p: P_NASAL, E: 1, phi: 0.05, delta: HP },
  nna: { s: S_MURDHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP },
  na:  { s: S_DANTA,  p: P_NASAL, E: 1, phi: 0.05, delta: HP },
  ma:  { s: S_OSHTHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP },

  // ── Semivowels (īṣat-spṛṣṭa) ──
  ya: { s: S_TALU,   p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP },
  ra: { s: S_MURDHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP },
  la: { s: S_DANTA,  p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP },
  va: { s: S_OSHTHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP },

  // ── Sibilants & aspirate (ūṣman / īṣat-vivṛta) ──
  sha: { s: S_TALU,   p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP },
  ssa: { s: S_MURDHA, p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP },
  sa:  { s: S_DANTA,  p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP },
  ha:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP },

  // ── Special ──
  anusvara: { s: S_OSHTHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP },
  visarga:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 0.7, phi: 0, delta: HP },
};

export function getTarget(id: PhonemeId): ArticulationTarget {
  const t = R[id];
  if (!t) {
    return { s: S_MURDHA, p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP };
  }
  return { ...t };
}

export function listRegisteredIds(): PhonemeId[] {
  return Object.keys(R);
}
