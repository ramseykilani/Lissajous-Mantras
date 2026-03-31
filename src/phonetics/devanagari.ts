import type { PhonemeId } from "./types.js";

type PhonemeInfo = { id: PhonemeId; iast: string };

// ── Independent vowels (U+0905–U+0914) ──

const VOWELS: Record<string, PhonemeInfo> = {
  "अ": { id: "a", iast: "a" },
  "आ": { id: "aa", iast: "ā" },
  "इ": { id: "i", iast: "i" },
  "ई": { id: "ii", iast: "ī" },
  "उ": { id: "u", iast: "u" },
  "ऊ": { id: "uu", iast: "ū" },
  "ऋ": { id: "ri", iast: "ṛ" },
  "ॠ": { id: "rii", iast: "ṝ" },
  "ऌ": { id: "li", iast: "ḷ" },
  "ए": { id: "e", iast: "e" },
  "ऐ": { id: "ai", iast: "ai" },
  "ओ": { id: "o", iast: "o" },
  "औ": { id: "au", iast: "au" },
};

// ── Consonants (U+0915–U+0939) ──

const CONSONANTS: Record<string, PhonemeInfo> = {
  // Velar (kaṇṭhya)
  "क": { id: "ka", iast: "k" },
  "ख": { id: "kha", iast: "kh" },
  "ग": { id: "ga", iast: "g" },
  "घ": { id: "gha", iast: "gh" },
  "ङ": { id: "nga", iast: "ṅ" },
  // Palatal (tālavya)
  "च": { id: "ca", iast: "c" },
  "छ": { id: "cha", iast: "ch" },
  "ज": { id: "ja", iast: "j" },
  "झ": { id: "jha", iast: "jh" },
  "ञ": { id: "nya", iast: "ñ" },
  // Retroflex (mūrdhanya)
  "ट": { id: "tta", iast: "ṭ" },
  "ठ": { id: "ttha", iast: "ṭh" },
  "ड": { id: "dda", iast: "ḍ" },
  "ढ": { id: "ddha", iast: "ḍh" },
  "ण": { id: "nna", iast: "ṇ" },
  // Dental (dantya)
  "त": { id: "ta", iast: "t" },
  "थ": { id: "tha", iast: "th" },
  "द": { id: "da", iast: "d" },
  "ध": { id: "dha", iast: "dh" },
  "न": { id: "na", iast: "n" },
  // Labial (oṣṭhya)
  "प": { id: "pa", iast: "p" },
  "फ": { id: "pha", iast: "ph" },
  "ब": { id: "ba", iast: "b" },
  "भ": { id: "bha", iast: "bh" },
  "म": { id: "ma", iast: "m" },
  // Semivowels (antastha)
  "य": { id: "ya", iast: "y" },
  "र": { id: "ra", iast: "r" },
  "ल": { id: "la", iast: "l" },
  "व": { id: "va", iast: "v" },
  // Sibilants & aspirate (ūṣman)
  "श": { id: "sha", iast: "ś" },
  "ष": { id: "ssa", iast: "ṣ" },
  "स": { id: "sa", iast: "s" },
  "ह": { id: "ha", iast: "h" },
};

// ── Dependent vowel signs / mātrā (U+093E–U+094C) ──

const VOWEL_SIGNS: Record<string, PhonemeInfo> = {
  "ा": { id: "aa", iast: "ā" },
  "ि": { id: "i", iast: "i" },
  "ी": { id: "ii", iast: "ī" },
  "ु": { id: "u", iast: "u" },
  "ू": { id: "uu", iast: "ū" },
  "ृ": { id: "ri", iast: "ṛ" },
  "ॄ": { id: "rii", iast: "ṝ" },
  "े": { id: "e", iast: "e" },
  "ै": { id: "ai", iast: "ai" },
  "ो": { id: "o", iast: "o" },
  "ौ": { id: "au", iast: "au" },
};

const VIRAMA = "्"; // U+094D

const DEFAULT_IDS:   PhonemeId[] = ["silence", "a", "u", "ma", "silence"];
const DEFAULT_IASTS: string[]    = ["",        "a", "u", "m",  ""];

/**
 * Parse a Devanagari string into a sequence of PhonemeIds, per-phoneme IAST
 * labels, and a full IAST romanization string.
 *
 * Handles consonant + vowel-sign combinations, virama (halant) for bare consonants,
 * inherent 'a', anusvara, visarga, and the ॐ ligature.
 */
export function parseDevanagari(input: string): {
  ids: PhonemeId[];
  iasts: string[];
  iast: string;
} {
  const ids: PhonemeId[] = ["silence"];
  const iasts: string[]  = [""];
  let iast = "";
  const chars = [...input]; // proper Unicode iteration
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i]!;

    // ॐ (U+0950) — expands to a-u-ma, romanized as "aum"
    if (ch === "ॐ") {
      ids.push("a", "u", "ma");
      iasts.push("a", "u", "m");
      iast += "aum";
      i++;
      continue;
    }

    // Independent vowel
    const vowel = VOWELS[ch];
    if (vowel) {
      ids.push(vowel.id);
      iasts.push(vowel.iast);
      iast += vowel.iast;
      i++;
      continue;
    }

    // Consonant
    const cons = CONSONANTS[ch];
    if (cons) {
      const next = chars[i + 1];
      if (next) {
        const sign = VOWEL_SIGNS[next];
        if (sign) {
          // Consonant + vowel sign (replaces inherent 'a')
          ids.push(cons.id, sign.id);
          iasts.push(cons.iast, sign.iast);
          iast += cons.iast + sign.iast;
          i += 2;
          continue;
        }
        if (next === VIRAMA) {
          // Bare consonant (no vowel)
          ids.push(cons.id);
          iasts.push(cons.iast);
          iast += cons.iast;
          i += 2;
          continue;
        }
      }

      // Consonant with inherent short 'a'
      ids.push(cons.id, "a");
      iasts.push(cons.iast, "a");
      iast += cons.iast + "a";
      i++;
      continue;
    }

    // Anusvara (ं) or chandrabindu (ँ) — nasal
    if (ch === "ं" || ch === "ँ") {
      ids.push("anusvara");
      iasts.push("ṃ");
      iast += "ṃ";
      i++;
      continue;
    }

    // Visarga (ः)
    if (ch === "ः") {
      ids.push("visarga");
      iasts.push("ḥ");
      iast += "ḥ";
      i++;
      continue;
    }

    // Whitespace — preserve in IAST, skip for phonemes
    if (ch === " " || ch === "\t") {
      iast += " ";
      i++;
      continue;
    }

    // Unknown character — skip
    i++;
  }

  ids.push("silence");
  iasts.push("");

  // If nothing was parsed (no Devanagari found), fall back to default
  if (ids.length <= 2) {
    return { ids: [...DEFAULT_IDS], iasts: [...DEFAULT_IASTS], iast: "aum" };
  }

  return { ids, iasts, iast };
}

/** Returns true when the string contains at least one Devanagari character. */
export function hasDevanagari(input: string): boolean {
  return /[\u0900-\u097F]/.test(input);
}
