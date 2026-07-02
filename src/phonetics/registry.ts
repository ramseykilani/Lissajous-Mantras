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

// ── Ghoṣa (Voicing) ──
export const G_AGHOSA = 0.0;   // Unvoiced (aghoṣa)
export const G_GHOSAVAT = 1.0; // Voiced (ghoṣavat)

// ── Prāṇa (Aspiration) ──
export const H_ALPA = 0.0;     // Unaspirated (alpaprāṇa)
export const H_USMAN = 0.5;    // Fricative breathiness (ūṣman)
export const H_MAHA = 1.0;     // Aspirated (mahāprāṇa)

const HP = Math.PI / 2; // δ = π/2 → orthogonal components

/**
 * Full Sanskrit phoneme registry.
 *
 * Each entry defines the archetypal articulatory target for one phoneme:
 * sthāna (s) and prayatna (p) set the geometry, ghoṣa sets stroke
 * weight/glow, prāṇa sets the breath halo. Within a varga the five
 * consonants now differ by voicing/aspiration; nasality and vowel length
 * remain unencoded.
 */
const R: Record<PhonemeId, ArticulationTarget> = {

  // ── Silence ──
  silence: { s: S_KANTHA, p: P_SPRSTA, E: 0, phi: 0, delta: HP, ghosa: G_AGHOSA, prana: H_ALPA },

  // ── Vowels (vivṛta, p = 1; all voiced) ──
  a:   { s: S_KANTHA,  p: P_VIVRTA, E: 1, phi: 0,    delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  aa:  { s: S_KANTHA,  p: P_VIVRTA, E: 1, phi: 0,    delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  i:   { s: S_TALU,    p: P_VIVRTA, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ii:  { s: S_TALU,    p: P_VIVRTA, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  u:   { s: S_OSHTHA,  p: P_VIVRTA, E: 1, phi: 0.12, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  uu:  { s: S_OSHTHA,  p: P_VIVRTA, E: 1, phi: 0.12, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ri:  { s: S_MURDHA,  p: P_VIVRTA, E: 1, phi: 0.08, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  rii: { s: S_MURDHA,  p: P_VIVRTA, E: 1, phi: 0.08, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  li:  { s: S_DANTA,   p: P_VIVRTA, E: 1, phi: 0.06, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  lii: { s: S_DANTA,   p: P_VIVRTA, E: 1, phi: 0.06, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  e:   { s: 0.125,     p: P_VIVRTA, E: 1, phi: 0.03, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA }, // kaṇṭha-tālavya
  ai:  { s: 0.125,     p: P_VIVRTA, E: 1, phi: 0.04, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  o:   { s: 0.5,       p: P_VIVRTA, E: 1, phi: 0.10, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA }, // kaṇṭha-oṣṭhya
  au:  { s: 0.5,       p: P_VIVRTA, E: 1, phi: 0.11, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  // Candra vowels (loanwords: ऍ ĕ, ऑ ŏ)
  ecandra: { s: 0.125, p: P_VIVRTA, E: 1, phi: 0.03, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ocandra: { s: 0.5,   p: P_VIVRTA, E: 1, phi: 0.10, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },

  // ── Velar stops (kaṇṭhya spṛṣṭa) ──
  ka:  { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },
  kha: { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },
  ga:  { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  gha: { s: S_KANTHA, p: P_SPRSTA, E: 1, phi: -0.08, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Palatal stops (tālavya spṛṣṭa) ──
  ca:  { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },
  cha: { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },
  ja:  { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  jha: { s: S_TALU, p: P_SPRSTA, E: 1, phi: -0.04, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Retroflex stops (mūrdhanya spṛṣṭa) ──
  tta:  { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },
  ttha: { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },
  dda:  { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ddha: { s: S_MURDHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Dental stops (dantya spṛṣṭa) ──
  ta:  { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },
  tha: { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },
  da:  { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  dha: { s: S_DANTA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Labial stops (oṣṭhya spṛṣṭa) ──
  pa:  { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },
  pha: { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },
  ba:  { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  bha: { s: S_OSHTHA, p: P_SPRSTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Nasals (slight opening for nasal airflow; all voiced) ──
  nga: { s: S_KANTHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  nya: { s: S_TALU,   p: P_NASAL, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  nna: { s: S_MURDHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  na:  { s: S_DANTA,  p: P_NASAL, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ma:  { s: S_OSHTHA, p: P_NASAL, E: 1, phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },

  // ── Semivowels (īṣat-spṛṣṭa; all voiced) ──
  ya: { s: S_TALU,   p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  ra: { s: S_MURDHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  la: { s: S_DANTA,  p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  va: { s: S_OSHTHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  // Vedic retroflex lateral ळ (ḻa)
  lla: { s: S_MURDHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },

  // ── Sibilants & aspirate (ūṣman / īṣat-vivṛta) ──
  sha: { s: S_TALU,   p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_USMAN },
  ssa: { s: S_MURDHA, p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_USMAN },
  sa:  { s: S_DANTA,  p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP, ghosa: G_AGHOSA,   prana: H_USMAN },
  ha:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 1, phi: 0, delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },

  // ── Nukta (loanword) consonants ──
  qa:    { s: S_KANTHA, p: P_SPRSTA,      E: 1, phi: -0.08, delta: HP, ghosa: G_AGHOSA,   prana: H_ALPA },  // क़ q
  khha:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 1, phi: 0,     delta: HP, ghosa: G_AGHOSA,   prana: H_USMAN }, // ख़ ḵh
  ghha:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 1, phi: 0,     delta: HP, ghosa: G_GHOSAVAT, prana: H_USMAN }, // ग़ ġ
  za:    { s: S_DANTA,  p: P_ISAT_VIVRTA, E: 1, phi: 0,     delta: HP, ghosa: G_GHOSAVAT, prana: H_USMAN }, // ज़ z
  dddha: { s: S_MURDHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02,  delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },  // ड़ ṛ (flap)
  rha:   { s: S_MURDHA, p: P_ISAT_SPRSTA, E: 1, phi: 0.02,  delta: HP, ghosa: G_GHOSAVAT, prana: H_MAHA },  // ढ़ ṛh
  fa:    { s: S_OSHTHA, p: P_ISAT_VIVRTA, E: 1, phi: 0,     delta: HP, ghosa: G_AGHOSA,   prana: H_USMAN }, // फ़ f
  yya:   { s: S_TALU,   p: P_ISAT_SPRSTA, E: 1, phi: 0.02,  delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },  // य़ ẏ

  // ── Special ──
  anusvara: { s: S_OSHTHA, p: P_NASAL,       E: 1,   phi: 0.05, delta: HP, ghosa: G_GHOSAVAT, prana: H_ALPA },
  visarga:  { s: S_KANTHA, p: P_ISAT_VIVRTA, E: 0.7, phi: 0,    delta: HP, ghosa: G_AGHOSA,   prana: H_MAHA },

  /** Neutral placeholder for in-block Devanagari letters not yet mapped. */
  unknown: { s: S_MURDHA, p: P_ISAT_VIVRTA, E: 0.85, phi: 0, delta: HP, ghosa: 0.5, prana: H_ALPA },
};

export function getTarget(id: PhonemeId): ArticulationTarget {
  const t = R[id] ?? R["unknown"]!;
  return { ...t };
}
