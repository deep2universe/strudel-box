# Strudel Box - Complete Pattern Guide for AI Assistants

> **Purpose:** This guide enables AI assistants to generate syntactically correct and functional Strudel patterns for the VS Code extension "Strudel Box".

---

## 1. Overview

**Strudel Box** is a VS Code extension for live-coding music patterns. It uses `@strudel/web` as its audio engine and provides:

- Webview-based REPL with CodeMirror 6 editor
- Real-time audio playback
- Pre-loaded sample libraries
- Three visual themes (Cyberpunk, Halloween, 8-Bit)

### File Format
- Extension: `.strudel`
- Syntax: JavaScript (ES2020+)
- Comments: `//` (single-line), `/* */` (multi-line)

---

## 2. Basic Syntax

### 2.1 Pattern Entry Points

```javascript
// Sound/Sample-based
s("bd sd hh cp")
sound("bd sd hh cp")

// Note-based
note("c3 e3 g3 c4")
n("0 2 4 7")

// Mini-notation (String methods)
"c3 e3 g3".note()
"bd sd".s()
```

### 2.2 Mini-Notation Syntax

| Symbol | Meaning | Example |
|--------|---------|---------|
| ` ` (space) | Sequence | `"bd sd hh"` |
| `*n` | Repetition | `"hh*4"` → 4x hh |
| `/n` | Slow down | `"bd/2"` → every 2 cycles |
| `[...]` | Grouping | `"[bd sd] hh"` |
| `<...>` | Alternation | `"<bd sd>"` → alternating |
| `,` | Parallel/Stack | `"bd, hh*4"` |
| `~` | Rest/Silence | `"bd ~ sd ~"` |
| `:n` | Sample index | `"bd:2"` → 3rd bd sample |
| `?` | Random (50%) | `"hh?"` |
| `!n` | Replicate | `"bd!3"` → `"bd bd bd"` |
| `@n` | Elongate | `"bd@2 sd"` → bd twice as long |

### 2.3 Chaining

All modifications are chained using dot notation:

```javascript
note("c3 e3 g3")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)
  .gain(0.8)
```

---

## 3. Sound Sources

### 3.1 Synthesizers (always available)

```javascript
.sound("sawtooth")   // Sawtooth wave
.sound("square")     // Square wave
.sound("triangle")   // Triangle wave
.sound("sine")       // Sine wave
```

### 3.2 Pre-loaded Sample Libraries

The extension automatically loads the following libraries:

| Library | Description |
|---------|-------------|
| `tidal-drum-machines` | Roland TR-808, TR-909, TR-707 etc. |
| `piano` | Acoustic piano |
| `Dirt-Samples` | Classic TidalCycles samples |
| `EmuSP12` | Legendary sampler |
| `vcsl` | Versilian Community Sample Library |

### 3.3 Available Sample Names (Selection)

**Drums:**
```javascript
s("bd")      // Bass Drum
s("sd")      // Snare Drum
s("hh")      // Hi-Hat
s("oh")      // Open Hi-Hat
s("cp")      // Clap
s("cb")      // Cowbell
s("cr")      // Crash
s("lt")      // Low Tom
s("mt")      // Mid Tom
s("ht")      // High Tom
```

**Instruments:**
```javascript
s("piano")   // Piano
s("casio")   // Casio keyboard
s("gtr")     // Guitar
s("bass")    // Bass
s("arpy")    // Arpeggio sounds
s("pluck")   // Plucked sounds
s("jvbass")  // JV Bass
```

**Drum Machines (with .bank()):**
```javascript
s("bd sd hh cp").bank("RolandTR909")
s("bd sd hh cp").bank("RolandTR808")
s("bd sd hh cp").bank("RolandTR707")
```

---

## 4. Audio Effects

### 4.1 Filters

```javascript
.lpf(800)           // Low-pass filter (frequency in Hz)
.hpf(200)           // High-pass filter
.lpq(5)             // Filter resonance (Q factor)
.cutoff(800)        // Alias for lpf
```

### 4.2 Dynamic Filters (LFO-modulated)

```javascript
.lpf(sine.range(200, 2000).slow(4))   // Sine LFO
.lpf(saw.range(400, 1200).fast(2))    // Sawtooth LFO
.lpf(perlin.range(300, 1500))         // Perlin noise
```

### 4.3 Space Effects

```javascript
.room(0.5)          // Reverb (0-1)
.size(0.8)          // Reverb size
.delay(0.25)        // Delay time (in cycles)
.delaytime(0.125)   // Delay time
.delayfeedback(0.5) // Delay feedback
```

### 4.4 Amplitude & Dynamics

```javascript
.gain(0.8)          // Volume (0-1)
.velocity(0.7)      // Note velocity
.attack(0.1)        // Attack time (seconds)
.decay(0.2)         // Decay time
.sustain(0.5)       // Sustain level
.release(0.3)       // Release time
```

### 4.5 Stereo & Panning

```javascript
.pan(0.5)           // Panning (0=left, 0.5=center, 1=right)
.pan(sine.slow(2))  // Auto-panning
```

---

## 5. Pattern Modification

### 5.1 Timing

```javascript
.fast(2)            // Double speed
.slow(2)            // Half speed
.early(0.25)        // Start earlier
.late(0.125)        // Start later
```

### 5.2 Structure

```javascript
.rev()              // Reverse pattern
.palindrome()       // Forward and backward
.iter(4)            // Rotate through 4 versions
.chunk(4, x => x.rev())  // Chunk-wise transformation
```

### 5.3 Combination

```javascript
// Parallel (simultaneous)
stack(
  s("bd*4"),
  s("hh*8"),
  note("c3 e3 g3").sound("sine")
)

// Sequential (one after another)
cat(
  s("bd*4"),
  s("sd*4")
)

// Alternating
seq(
  s("bd*4"),
  s("sd*4")
)
```

### 5.4 Euclidean Rhythms

```javascript
.euclid(3, 8)       // 3 hits over 8 steps
.euclid(5, 8)       // 5 hits over 8 steps
.euclid(7, 16)      // 7 hits over 16 steps

// With rotation
.euclid(3, 8, 2)    // 3 hits, 8 steps, 2 rotation
```

### 5.5 Conditional Modification

```javascript
.sometimes(x => x.fast(2))      // 50% probability
.often(x => x.rev())            // 75% probability
.rarely(x => x.speed(-1))       // 25% probability
.every(4, x => x.fast(2))       // Every 4 cycles
.every(8, x => x.rev())         // Every 8 cycles
```

---

## 6. Scales & Chords

### 6.1 Available Scales

```javascript
.scale("C:major")           // C Major
.scale("C:minor")           // C Minor
.scale("C:dorian")          // Dorian
.scale("C:phrygian")        // Phrygian
.scale("C:lydian")          // Lydian
.scale("C:mixolydian")      // Mixolydian
.scale("C:aeolian")         // Aeolian (natural minor)
.scale("C:locrian")         // Locrian
.scale("C:pentatonic")      // Pentatonic
.scale("C:blues")           // Blues scale
.scale("C:chromatic")       // Chromatic
.scale("C:wholetone")       // Whole tone
.scale("C:harmonic_minor")  // Harmonic minor
.scale("C:melodic_minor")   // Melodic minor
```

### 6.2 Scale Intervals (Reference)

| Scale | Intervals (semitones) |
|-------|----------------------|
| major | 0, 2, 4, 5, 7, 9, 11 |
| minor | 0, 2, 3, 5, 7, 8, 10 |
| dorian | 0, 2, 3, 5, 7, 9, 10 |
| phrygian | 0, 1, 3, 5, 7, 8, 10 |
| lydian | 0, 2, 4, 6, 7, 9, 11 |
| mixolydian | 0, 2, 4, 5, 7, 9, 10 |
| pentatonic | 0, 2, 4, 7, 9 |
| blues | 0, 3, 5, 6, 7, 10 |
| harmonic_minor | 0, 2, 3, 5, 7, 8, 11 |
| melodic_minor | 0, 2, 3, 5, 7, 9, 11 |

### 6.3 Chords

```javascript
.chord("C")         // C Major
.chord("Cm")        // C Minor
.chord("C7")        // C Dominant 7
.chord("Cmaj7")     // C Major 7
.chord("Cm7")       // C Minor 7
.chord("Cdim")      // C Diminished
.chord("Caug")      // C Augmented

// Chord progressions
chord("<C Am Dm G>")
chord("<C^7 Am7 Dm7 G7>")

// With voicing
.voicing()
```

### 6.4 Chord Intervals (Reference)

| Chord Type | Intervals (semitones) |
|------------|----------------------|
| Major | 0, 4, 7 |
| Minor (m) | 0, 3, 7 |
| Dominant 7 (7) | 0, 4, 7, 10 |
| Major 7 (maj7) | 0, 4, 7, 11 |
| Minor 7 (m7) | 0, 3, 7, 10 |
| Diminished (dim) | 0, 3, 6 |
| Augmented (aug) | 0, 4, 8 |

---

## 7. Tempo & Timing

```javascript
// Set BPM (Cycles per Minute)
setcpm(120)         // 120 BPM

// Alternative
setCps(2)           // 2 Cycles per Second = 120 BPM
```

---

## 8. Complete Pattern Examples

### 8.1 Simple Beat

```javascript
s("bd sd [~ bd] sd, hh*8")
  .room(0.2)
```

### 8.2 Melodic Synth

```javascript
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(sine.range(200, 2000).slow(4))
  .lpq(5)
  .room(0.3)
```

### 8.3 Chord Progression

```javascript
chord("<C^7 Am7 Dm7 G7>")
  .voicing()
  .sound("piano")
  .room(0.5)
```

### 8.4 Euclidean Drums

```javascript
stack(
  s("bd").euclid(3, 8),
  s("sd").euclid(2, 8),
  s("hh").euclid(5, 8)
).room(0.2)
```

### 8.5 Complete Arrangement

```javascript
setcpm(120)

stack(
  // Drums
  s("bd sd [~ bd] sd, hh*8")
    .bank("RolandTR909"),
  
  // Bass
  note("c2 ~ c2 ~, ~ ~ e2 ~")
    .sound("sawtooth")
    .lpf(400)
    .gain(0.7),
  
  // Chords
  chord("<C^7 Am7 Dm7 G7>")
    .voicing()
    .sound("piano")
    .room(0.5)
    .gain(0.5),
  
  // Lead
  note("c4 e4 g4 c5")
    .sound("triangle")
    .delay(0.25)
    .room(0.3)
    .gain(0.4)
).gain(0.8)
```

### 8.6 Genre-Specific Patterns

**Techno:**
```javascript
setcpm(130)
stack(
  s("bd*4"),
  s("~ cp ~ cp"),
  s("hh*8").gain(0.6),
  note("c1").sound("sawtooth").lpf(200).gain(0.8)
).room(0.2)
```

**House:**
```javascript
setcpm(124)
stack(
  s("bd*4, hh*8"),
  s("~ cp ~ cp"),
  chord("<Cm7 Fm7>").voicing().sound("piano").room(0.4)
)
```

**Drum & Bass:**
```javascript
setcpm(174)
stack(
  s("bd ~ ~ bd ~ ~ bd ~, ~ ~ cp ~ ~ cp ~ ~"),
  s("hh*16").gain(0.5),
  note("c1 ~ ~ c2 ~ c1 ~ ~").sound("square").lpf(300)
)
```

**Ambient:**
```javascript
setcpm(60)
stack(
  note("c3 e3 g3 b3")
    .sound("sine")
    .attack(2)
    .release(4)
    .room(0.9)
    .gain(0.4),
  s("bd ~ ~ ~").room(0.8).gain(0.3)
)
```

---

## 9. Variations & Transformations

### 9.1 Subtle Variation

```javascript
s("bd sd hh cp")
  .sometimes(x => x.fast(2))
```

### 9.2 Moderate Variation

```javascript
s("bd sd hh cp")
  .every(4, x => x.rev())
  .sometimes(x => x.fast(2))
```

### 9.3 Extreme Variation

```javascript
s("bd sd hh cp")
  .every(2, x => x.jux(rev))
  .sometimes(x => x.iter(4))
```

### 9.4 Glitch Effects

```javascript
s("bd sd hh cp")
  .sometimes(x => x.chop(8).rev())
  .rarely(x => x.speed(-1))
```

---

## 10. Unsupported Features

> ⚠️ The following features are NOT available in Strudel Box:

| Feature | Reason |
|---------|--------|
| CSound (`loadCsound`, `.csound()`) | `@strudel/csound` not loaded |
| Hydra Visuals (`initHydra`, `osc()`) | `@strudel/hydra` not loaded |
| Tidal Syntax (`tidal\`d1 $ s "bd"\``) | `@strudel/tidal` not loaded |
| Advanced MIDI | May have limited functionality |
| Device Motion | Only relevant on mobile devices |

**Workaround:** Use the official [Strudel REPL](https://strudel.cc) for these features.

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Play pattern |
| `Ctrl+.` / `Cmd+.` | Stop audio (Hush) |
| `Ctrl+S` / `Cmd+S` | Save pattern |

---

## 12. Best Practices for AI-Generated Patterns

1. **Always start with simple patterns** - Increase complexity gradually
2. **Prefer synthesizers** - `sawtooth`, `sine`, `square`, `triangle` are always available
3. **Use standard samples** - `bd`, `sd`, `hh`, `cp` are reliably loaded
4. **Control gain** - `.gain(0.8)` at the end prevents clipping
5. **Use room sparingly** - `.room(0.2-0.4)` for subtle space
6. **Set BPM explicitly** - `setcpm(120)` for clear tempo indication
7. **Use stack for layering** - `stack()` for multiple simultaneous patterns
8. **No async/await** - Strudel patterns are synchronous
9. **No external samples** - Only use pre-loaded libraries

---

## 13. Quick Reference: Common Patterns

```javascript
// Minimal beat
s("bd sd")

// Four-on-the-floor
s("bd*4")

// Basic house
s("bd*4, ~ cp ~ cp, hh*8")

// Melody with synth
note("c3 e3 g3 c4").sound("sawtooth").lpf(800)

// Chords
chord("<C Am F G>").voicing().sound("piano")

// Euclidean
s("bd").euclid(3, 8)

// With effects
s("bd sd").room(0.3).delay(0.25)

// Layered
stack(s("bd*4"), s("hh*8"), note("c2").sound("sine"))
```

---

*Last updated: December 2025*
*Based on @strudel/web via CDN*
