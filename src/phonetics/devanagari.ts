import type { PhonemeId } from "./types.js";

type PhonemeInfo = { id: PhonemeId; iast: string };

// ── Independent vowels (U+0905–U+0914, plus candra and vocalic ḹ) ──

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
  "ॡ": { id: "lii", iast: "ḹ" },
  "ए": { id: "e", iast: "e" },
  "ऐ": { id: "ai", iast: "ai" },
  "ओ": { id: "o", iast: "o" },
  "औ": { id: "au", iast: "au" },
  "ऍ": { id: "ecandra", iast: "ĕ" },
  "ऑ": { id: "ocandra", iast: "ŏ" },
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
  // Vedic retroflex lateral (appears in the Rigveda, Marathi, etc.)
  "ळ": { id: "lla", iast: "ḻ" },
  // Sibilants & aspirate (ūṣman)
  "श": { id: "sha", iast: "ś" },
  "ष": { id: "ssa", iast: "ṣ" },
  "स": { id: "sa", iast: "s" },
  "ह": { id: "ha", iast: "h" },
};

// ── Nukta forms (loanword sounds) ──
// Input is NFD-normalized, so precomposed letters (क़ U+0958 …) arrive here as
// base consonant + combining nukta (U+093C). Bases without a distinct sound
// (ऩ ऱ ऴ) fall back to their plain consonant.

const NUKTA = "़";

const NUKTA_FORMS: Record<string, PhonemeInfo> = {
  "क": { id: "qa", iast: "q" },
  "ख": { id: "khha", iast: "ḵh" },
  "ग": { id: "ghha", iast: "ġ" },
  "ज": { id: "za", iast: "z" },
  "ड": { id: "dddha", iast: "ṛ" },
  "ढ": { id: "rha", iast: "ṛh" },
  "फ": { id: "fa", iast: "f" },
  "य": { id: "yya", iast: "ẏ" },
};

// ── Dependent vowel signs / mātrā (U+093E–U+094C, plus candra and vocalic l) ──

const VOWEL_SIGNS: Record<string, PhonemeInfo> = {
  "ा": { id: "aa", iast: "ā" },
  "ि": { id: "i", iast: "i" },
  "ी": { id: "ii", iast: "ī" },
  "ु": { id: "u", iast: "u" },
  "ू": { id: "uu", iast: "ū" },
  "ृ": { id: "ri", iast: "ṛ" },
  "ॄ": { id: "rii", iast: "ṝ" },
  "ॢ": { id: "li", iast: "ḷ" },
  "ॣ": { id: "lii", iast: "ḹ" },
  "े": { id: "e", iast: "e" },
  "ै": { id: "ai", iast: "ai" },
  "ो": { id: "o", iast: "o" },
  "ौ": { id: "au", iast: "au" },
  "ॅ": { id: "ecandra", iast: "ĕ" },
  "ॉ": { id: "ocandra", iast: "ŏ" },
};

const VIRAMA = "्"; // U+094D

/** Word/verse separators: treated as a gap in the romanization only. */
const WHITESPACE = new Set([" ", "\t", "\n", "\r", "।", "॥"]);

/** Characters with no articulatory meaning here — skipped without a warning:
 * ZWNJ/ZWJ, BOM, Vedic accents (U+0951–0954) and Vedic Extensions block. */
function isIgnorable(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (
    cp === 0x200c || cp === 0x200d || cp === 0xfeff ||
    (cp >= 0x0951 && cp <= 0x0954) ||
    (cp >= 0x1cd0 && cp <= 0x1cff) ||
    (cp >= 0x0966 && cp <= 0x096f) // Devanagari digits
  );
}

function inDevanagariBlock(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return cp >= 0x0900 && cp <= 0x097f;
}

const DEFAULT_IDS:   PhonemeId[] = ["silence", "a", "u", "ma", "silence"];
const DEFAULT_IASTS: string[]    = ["",        "a", "u", "m",  ""];

export type ParseResult = {
  ids: PhonemeId[];
  iasts: string[];
  iast: string;
  /** Characters that could not be interpreted (deduped, in input order). */
  unknown: string[];
};

/**
 * Parse a Devanagari string into a sequence of PhonemeIds, per-phoneme IAST
 * labels, and a full IAST romanization string.
 *
 * Handles consonant + vowel-sign combinations, virama (halant) for bare
 * consonants, inherent 'a', nukta (loanword) consonants in both precomposed
 * and combining encodings, candra vowels, anusvara, visarga, avagraha, danda,
 * and the ॐ ligature. Unrecognized characters are collected in `unknown`
 * instead of being silently dropped; unrecognized Devanagari *letters* also
 * emit a neutral placeholder phoneme so the shape acknowledges them.
 */
export function parseDevanagari(input: string): ParseResult {
  const ids: PhonemeId[] = ["silence"];
  const iasts: string[]  = [""];
  let iast = "";
  const unknown: string[] = [];
  // NFD decomposes precomposed nukta letters (क़ → क + ◌़); proper Unicode iteration
  const chars = [...input.normalize("NFD")];
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

    // Consonant (optionally followed by nukta, then vowel sign or virama)
    let cons = CONSONANTS[ch];
    if (cons) {
      let consumed = 1;
      if (chars[i + 1] === NUKTA) {
        cons = NUKTA_FORMS[ch] ?? cons;
        consumed = 2;
      }
      const next = chars[i + consumed];
      if (next) {
        const sign = VOWEL_SIGNS[next];
        if (sign) {
          // Consonant + vowel sign (replaces inherent 'a')
          ids.push(cons.id, sign.id);
          iasts.push(cons.iast, sign.iast);
          iast += cons.iast + sign.iast;
          i += consumed + 1;
          continue;
        }
        if (next === VIRAMA) {
          // Bare consonant (no vowel)
          ids.push(cons.id);
          iasts.push(cons.iast);
          iast += cons.iast;
          i += consumed + 1;
          continue;
        }
      }

      // Consonant with inherent short 'a'
      ids.push(cons.id, "a");
      iasts.push(cons.iast, "a");
      iast += cons.iast + "a";
      i += consumed;
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

    // Avagraha (ऽ) — elision mark, apostrophe in IAST, no phoneme
    if (ch === "ऽ") {
      iast += "'";
      i++;
      continue;
    }

    // Whitespace and danda — preserve as a gap in IAST, skip for phonemes
    if (WHITESPACE.has(ch)) {
      iast += " ";
      i++;
      continue;
    }

    // Accents, joiners, digits — no articulatory meaning, skip quietly
    if (isIgnorable(ch)) {
      i++;
      continue;
    }

    // Unknown character — surface it rather than silently dropping it.
    if (!unknown.includes(ch)) unknown.push(ch);
    if (inDevanagariBlock(ch) && !/\p{M}/u.test(ch)) {
      // A Devanagari letter we don't model yet: render a neutral placeholder
      // so the shape acknowledges it (registry falls back on id "unknown").
      ids.push("unknown");
      iasts.push(ch);
      iast += ch;
    }
    i++;
  }

  ids.push("silence");
  iasts.push("");

  // If nothing was parsed (no Devanagari found), fall back to default
  if (ids.length <= 2) {
    return { ids: [...DEFAULT_IDS], iasts: [...DEFAULT_IASTS], iast: "aum", unknown };
  }

  return { ids, iasts, iast, unknown };
}
