import { describe, expect, it } from "vitest";
import { parseDevanagari } from "./devanagari.js";

describe("parseDevanagari", () => {
  it("expands ॐ to a-u-ma with silence padding", () => {
    const r = parseDevanagari("ॐ");
    expect(r.ids).toEqual(["silence", "a", "u", "ma", "silence"]);
    expect(r.iast).toBe("aum");
    expect(r.unknown).toEqual([]);
  });

  it("applies the inherent 'a' and parses visarga", () => {
    const r = parseDevanagari("नमः");
    expect(r.ids).toEqual(["silence", "na", "a", "ma", "a", "visarga", "silence"]);
    expect(r.iast).toBe("namaḥ");
  });

  it("drops the inherent vowel after virama", () => {
    const r = parseDevanagari("सत्");
    expect(r.ids).toEqual(["silence", "sa", "a", "ta", "silence"]);
    expect(r.iast).toBe("sat");
  });

  it("replaces the inherent vowel with a vowel sign", () => {
    const r = parseDevanagari("शि");
    expect(r.ids).toEqual(["silence", "sha", "i", "silence"]);
    expect(r.iast).toBe("śi");
  });

  it("parses anusvara after a vowel sign", () => {
    const r = parseDevanagari("हूं");
    expect(r.ids).toEqual(["silence", "ha", "uu", "anusvara", "silence"]);
    expect(r.iast).toBe("hūṃ");
  });

  it("parses nukta consonants in precomposed and combining encodings identically", () => {
    const precomposed = parseDevanagari("फ़"); // फ़ as one code point
    const combining = parseDevanagari("फ़"); // फ + ◌़
    expect(precomposed).toEqual(combining);
    expect(precomposed.ids).toEqual(["silence", "fa", "a", "silence"]);
    expect(precomposed.iast).toBe("fa");
  });

  it("combines nukta consonants with vowel signs", () => {
    const r = parseDevanagari("ज़ी"); // ज + nukta + ी
    expect(r.ids).toEqual(["silence", "za", "ii", "silence"]);
    expect(r.iast).toBe("zī");
  });

  it("parses candra vowels (independent and sign)", () => {
    expect(parseDevanagari("ऑ").ids).toEqual(["silence", "ocandra", "silence"]);
    const r = parseDevanagari("कॉ");
    expect(r.ids).toEqual(["silence", "ka", "ocandra", "silence"]);
    expect(r.iast).toBe("kŏ");
  });

  it("parses the Vedic retroflex lateral ळ", () => {
    const r = parseDevanagari("ळ");
    expect(r.ids).toEqual(["silence", "lla", "a", "silence"]);
    expect(r.iast).toBe("ḻa");
  });

  it("renders avagraha as an apostrophe with no phoneme", () => {
    const r = parseDevanagari("कोऽहम्");
    expect(r.iast).toBe("ko'ham");
    expect(r.ids).toEqual(["silence", "ka", "o", "ha", "a", "ma", "silence"]);
  });

  it("treats danda as a word gap", () => {
    expect(parseDevanagari("अ।इ").iast).toBe("a i");
  });

  it("silently ignores joiners, Vedic accents, and digits", () => {
    const r = parseDevanagari("अ‌॑०इ"); // ZWNJ, udātta accent, digit ०
    expect(r.ids).toEqual(["silence", "a", "i", "silence"]);
    expect(r.unknown).toEqual([]);
  });

  it("collects unknown non-Devanagari characters and falls back to aum", () => {
    const r = parseDevanagari("xy");
    expect(r.iast).toBe("aum");
    expect(r.unknown).toEqual(["x", "y"]);
  });

  it("gives unmapped Devanagari letters a placeholder phoneme and reports them", () => {
    const r = parseDevanagari("ॹ"); // ॹ (zha) — not modeled
    expect(r.ids).toEqual(["silence", "unknown", "silence"]);
    expect(r.iasts[1]).toBe("ॹ");
    expect(r.unknown).toEqual(["ॹ"]);
  });
});
