# Lissajous Mantras — Technical Specification

## 1. Purpose

Generate a **single continuous parametric shape** per mantra for visualization and contemplative practice. The shape is derived from Sanskrit phonetics (primarily **sthāna** and **ābhyantara prayatna**) so that each utterance has a **stable mathematical signature** that scales from short mantras (e.g. **oṃ**) to longer ones.

**Non-goals (v1):** speech synthesis, acoustic accuracy, full śikṣā pedagogy. The model is **archetypal**: it encodes intended articulatory “targets” and smooth transitions, not recorded audio.

---

## 2. Core mathematical form

### 2.1 Single family

All mantras use one parametric family over an angle \(\theta \in [0, 2\pi]\), evaluated at a given normalized mantra time \(t \in [0,1]\):

\[
\begin{aligned}
x(\theta, t) &= E(t) \cdot A_x(t)\,\sin\!\big(\theta + \phi(t)\big), \\
y(\theta, t) &= E(t) \cdot A_y(t)\,\sin\!\big(\theta + \phi(t) + \delta(t)\big).
\end{aligned}
\]

- \(\theta\): angle to draw one full Lissajous cycle.
- \(t\): normalized time through the mantra.
- \(E(t)\): Energy/Envelope (0 for silence, 1 for sound).
- \(\phi(t)\): phase track.
- \(\delta(t)\): relative phase between components (shape of the Lissajous figure).
- \(A_x(t), A_y(t)\): anisotropic amplitude derived from **sthāna** and **ābhyantara prayatna**.

**Constant coefficients** yield a classic Lissajous figure. **Time-varying** parameters yield **one continuous morphing shape** for the whole mantra.

### 2.2 Silence

Silence is modeled as **energy collapse**:

- \(E(t) \to 0\) and \(p(t) \to 0\) at boundaries (and optionally brief gaps between syllables).
- The **sthāna** \(s(t)\) is inherited from adjacent sounds, meaning the shape collapses into a line along the axis of the neighboring sound before shrinking to a point.

### 2.3 Discrete phonetics → continuous tracks

1. Parse the mantra into an ordered sequence of **targets** (akṣaras / phoneme units from Devanagari input).
2. Each unit maps to **control values** at sample times \(t_k\) (including leading/trailing silence targets).
3. **Smooth interpolation** (Catmull-Rom interpolation) produces \(s(t), p(t), E(t), \phi(t), \delta(t)\) with fluid, continuous transitions. Values are clamped to prevent mathematical overshoots.

---

## 3. Phonetic encoding

### 3.1 Encoded in v1

| Dimension | Variable | Role in math | Notes |
|-----------|----------|----------------|-------|
| **Sthāna** | \(s(t)\) | \(A_x, A_y\) | Place of articulation (0 = Velar, 1 = Labial) → axis of the shape. Velar is vertical, Labial is horizontal. |
| **Ābhyantara prayatna** | \(p(t)\) | \(A_x, A_y\) | “Effort” and openness (0 = Stop, 1 = Vowel) → how much the base line opens into an ellipse/circle. |
| **Energy** | \(E(t)\) | Overall scale | Breath/voicing envelope. 0 = Silence, 1 = Sound. |

### 3.2 Not encoded in v1 (identical visuals unless extended)

- **Ghoṣa** (voicing)
- **Prāṇa** (aspiration)
- **Anunāsikya** / nasality

Future versions may add a third coordinate, line style, or a high-frequency modulation without changing the core equation family.

---

## 4. Reference: oṃ (A–U–M)

**Intent:** A single shape that breathes and morphs continuously.

- **A:** Velar vowel (\(s=0, p=1\)). Pure vertical line that opens into a tall-thin ellipse.
- **U:** Labial vowel (\(s=1, p=1\)). Balanced \(A_x \approx A_y\), morphs into a perfect circle.
- **M:** Labial stop/nasal (\(s=1, p \approx 0.05\)). Collapses into a wide-thin ellipse and ends as a pure horizontal line.

Exact numeric targets live in the **phonetic registry** (`src/phonetics/registry.ts`) and remain **tunable**; the spec only constrains **roles**, not fixed śāstra numbers.

---

## 5. Input and parsing

- **Input:** UTF-8 Devanagari string (e.g. `ॐ`, `नमः शिवाय`, `ॐ नमो भगवते वासुदेवाय`).
- **Display:** IAST romanization is shown alongside the input for readability (e.g. `ॐ` → *oṃ*).
- **Tokenizer:** Character-by-character Devanagari parser (`src/phonetics/devanagari.ts`). Handles consonant + vowel-sign combinations, virama (halant) for bare consonants, inherent short *a*, anusvara, visarga, and the `ॐ` ligature.

If the input contains no Devanagari characters, the parser falls back to the default `ॐ` (oṃ) sequence.

---

## 6. Rendering

### 6.1 Sampling and polyline

- **Output:** 2D polyline sampling of \((x(\theta), y(\theta))\) over \(\theta \in [0, 2\pi]\) at a specific mantra time \(t\).

### 6.2 Shape animation

- **Intent:** Show the mantra as **one continuous morphing shape** along \(t\): for **oṃ**, early \(t\) emphasizes the **A** target (vertical), middle \(t\) the **U** target (circle), late \(t\) the **M** target (horizontal).
- **Timing:** The **Duration** slider (4–24 s) sets how long one full morph takes; \(t\) sweeps linearly from 0 to 1 over that interval.
- **Playback:** **Play / Pause** toggles the animation; **Reset** rewinds to \(t = 0\) and resumes. When paused the shape freezes at the current \(t\).

### 6.3 Preset mantras

The UI offers two groups of clickable presets that populate the input field and restart the animation:

- **Mantras** — full phrases (e.g. *oṃ namaḥ śivāya*, *oṃ namo bhagavate vāsudevāya*).
- **Bīja (seed syllables)** — single-syllable seed sounds (e.g. *śrīṃ*, *hrīṃ*, *klīṃ*).

Each button shows the IAST romanization as primary text with the Devanagari below it.

### 6.4 View

- Normalized bounds with fixed scale; **view rotation** is 0 rad so that shapes align perfectly with the X/Y axes.

---

## 7. Roadmap

1. **v1 (this repo):** Catmull-Rom tracks + full varṇamālā phonetic registry + Devanagari parser + canvas + preset mantras and bīja syllables.
2. **v2:** Explicit sandhi / cluster transition models; richer sthāna grid (varga-aware).
3. **v3:** Optional channels for ghoṣa, prāṇa, anunāsikya.

---

## 8. Module map

| Area | Responsibility |
|------|----------------|
| `src/math/curve.ts` | Evaluate \(x,y\) from \(s, p, E, \phi, \delta\) |
| `src/math/spline.ts` | Catmull-Rom interpolation over control points |
| `src/phonetics/types.ts` | Types for targets and parse results |
| `src/phonetics/registry.ts` | Phoneme → default phonetic matrix values |
| `src/phonetics/devanagari.ts` | Devanagari → PhonemeId sequence + IAST romanization |
| `src/phonetics/parse.ts` | Devanagari input → timed targets |
| `src/render/draw.ts` | Sample shape (`t`), fixed bounds, canvas rendering |
| `src/main.ts` | UI, animation loop, duration slider, orchestration |

---

## 9. Success criteria (v1)

- Entering `ॐ` produces **one** smooth shape that morphs predictably, not disjoint plots.
- The shape starts as a vertical line, opens into a circle, and collapses into a horizontal line.
- Adding new entries to the registry extends the system without changing the core generative equation.
- `SPEC.md` remains the source of truth for mathematical and phonetic assumptions.
