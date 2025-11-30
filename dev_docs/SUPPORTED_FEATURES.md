# Strudel Box - Unterstützte Features

## Datum: 30. November 2025

---

## ✅ Unterstützte Features (@strudel/web)

### Pattern-Funktionen

```javascript
// Noten
note("c3 e3 g3 c4")
n("0 2 4 7")

// Sounds/Samples
sound("bd sd hh cp")
s("piano")

// Mini-Notation
"c3 e3 g3".note()
"bd sd".s()
```

### Sound-Quellen

```javascript
// Synthesizer
.sound("sawtooth")
.sound("square")
.sound("triangle")
.sound("sine")

// Eingebaute Samples
.sound("piano")
.sound("casio")
// etc.
```

### Audio-Effekte

```javascript
// Filter
.lpf(800)      // Low-pass filter
.hpf(200)      // High-pass filter
.lpq(5)        // Filter resonance

// Reverb/Delay
.room(0.5)     // Reverb
.delay(0.25)   // Delay

// Amplitude
.gain(0.8)     // Volume
.velocity(0.7) // Note velocity
```

### Pattern-Modifikation

```javascript
// Timing
.fast(2)
.slow(2)
.rev()

// Struktur
.stack()
.cat()
.seq()

// Euclidean Rhythms
.euclid(3, 8)
```

### Skalen & Akkorde

```javascript
.scale("C:minor")
.chord("Am7")
.voicing()
```

### Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Pattern abspielen |
| `Ctrl+.` / `Cmd+.` | Audio stoppen |
| `Ctrl+S` / `Cmd+S` | Pattern speichern |

---

## ❌ NICHT Unterstützte Features

### CSound Integration

```javascript
// ❌ NICHT VERFÜGBAR
await loadCsound`
instr CoolSynth
...
endin`

// ❌ NICHT VERFÜGBAR
await loadOrc('github:kunstmusik/csound-live-code/master/livecode.orc')

// ❌ NICHT VERFÜGBAR
.csound('CoolSynth')
```

**Grund:** `@strudel/csound` Paket nicht geladen

### Hydra Visuals

```javascript
// ❌ NICHT VERFÜGBAR
await initHydra()
osc(10).out()
```

**Grund:** `@strudel/hydra` Paket nicht geladen

### Tidal Syntax

```javascript
// ❌ NICHT VERFÜGBAR
await initTidal()
tidal`d1 $ s "bd*4"`
```

**Grund:** `@strudel/tidal` Paket nicht geladen

### Erweiterte MIDI

```javascript
// ❌ MÖGLICHERWEISE EINGESCHRÄNKT
await midin('IAC Driver Bus 1')
.midi('IAC Driver')
```

**Grund:** MIDI-Funktionen möglicherweise nicht vollständig

### GitHub Sample Loading

```javascript
// ❌ MÖGLICHERWEISE EINGESCHRÄNKT
samples('github:tidalcycles/dirt-samples')
```

**Grund:** Externe Sample-URLs möglicherweise durch CSP blockiert

### Device Motion

```javascript
// ❌ NICHT VERFÜGBAR
enableMotion()
gravityX, gravityY, rotZ
```

**Grund:** Nur auf mobilen Geräten relevant

---

## 🔄 Workarounds

### Für CSound-Patterns

Verwende stattdessen die eingebauten Synthesizer:

```javascript
// Statt CSound:
// await loadCsound`instr CoolSynth...`
// .csound('CoolSynth')

// Verwende:
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(sine.range(200, 2000).slow(4))
  .lpq(5)
  .room(0.3)
```

### Für erweiterte Features

Nutze die offizielle Strudel REPL unter [strudel.cc](https://strudel.cc) für:
- CSound Integration
- Hydra Visuals
- Tidal Syntax
- Erweiterte MIDI-Features

---

## Beispiel-Patterns (Funktionierend)

### Einfache Melodie

```javascript
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)
```

### Drum Pattern

```javascript
sound("bd sd [~ bd] sd, hh*8")
  .bank("RolandTR909")
```

### Chord Progression

```javascript
chord("<C^7 Am7 Dm7 G7>")
  .voicing()
  .sound("piano")
  .room(0.5)
```

### Euclidean Rhythm

```javascript
note("c2 e2 g2 b2")
  .euclid(5, 8)
  .sound("sawtooth")
  .lpf(600)
```

### Layered Pattern

```javascript
stack(
  note("c3 e3 g3").sound("piano"),
  sound("bd*4, hh*8"),
  note("c2").sound("sawtooth").lpf(200)
)
```
