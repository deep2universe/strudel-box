# 🎵 strudel-box

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/deep2universe.strudel-box?style=flat-square&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=deep2universe.strudel-box)
[![Open VSX](https://img.shields.io/open-vsx/v/deep2universe/strudel-box?style=flat-square&label=Open%20VSX)](https://open-vsx.org/extension/deep2universe/strudel-box)
[![License](https://img.shields.io/github/license/deep2universe/strudel-box?style=flat-square)](LICENSE)

**Code your beats. Visualize your sound. Share your vibe.**

📺 [Watch the Demo (2:40)](https://www.youtube.com/watch?v=iuMaoxbjEkc)

[strudel-box](https://marketplace.visualstudio.com/items?itemName=deep2universe.strudel-box) is a VS Code extension that brings the power of [Strudel](https://strudel.cc) live coding directly into your editor. Create algorithmic music patterns, experiment with sounds, and perform live — all without leaving VS Code.

![strudel-box Screenshot](https://raw.githubusercontent.com/deep2universe/strudel-box/refs/heads/main/assets/strudel-box-01.png)

---

## 🤖 Works in VS Code — Built for Kiro

strudel-box is fully compatible with VS Code and works out of the box. However, it was developed for and with [Kiro](https://kiro.dev), AWS's agentic IDE. When used with Kiro, you unlock powerful AI-assisted features:

| Feature | Description |
|---------|-------------|
| **Spec-Driven Development** | Use Kiro's structured specs to design and iterate on complex musical patterns with AI guidance |
| **Vibe Coding** | Let AI help you explore new sounds, suggest pattern variations, and remix your beats in real-time |
| **Kiro Template** | Get started instantly with our [strudel-box-template](https://github.com/deep2universe/strudel-box-template) — pre-configured steering rules, hooks, example patterns, and AI prompts for music creation |

---

## ✨ Features

### 🎹 Live Coding REPL

- **Integrated Strudel REPL** — Write and evaluate Strudel patterns directly in VS Code
- **Real-time Audio** — Hear your patterns instantly with low-latency playback
- **CodeMirror 6 Editor** — Modern code editor with JavaScript syntax highlighting
- **Pattern Evaluation** — Execute patterns with `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (macOS)
- **Instant Stop** — Silence audio immediately with `Ctrl+.` or `Cmd+.`

### 📁 Strudel Explorer (Sidebar Player)

- **File Browser** — Browse all `.strudel` files in your workspace
- **Hierarchical View** — Navigate folders with expandable tree structure
- **One-Click Playback** — Play any pattern directly from the file list
- **Playlist Controls** — Previous, Next, and Shuffle functionality
- **Now Playing Display** — See which track is currently playing
- **Quick Actions** — Open files in editor or share to Strudel.cc

### 🎨 Visual Themes

Three stunning visual themes with animated particle backgrounds:

| Theme | Description | Icon |
|-------|-------------|------|
| **Cyberpunk** | Neon cyan and magenta with tech aesthetics | 🌃 |
| **Halloween** | Spooky orange and purple vibes | 🎃 |
| **8-Bit** | Retro green with CRT-style effects | 👾 |

Each theme includes:
- Custom color schemes
- Animated particle backgrounds
- Matching VS Code editor themes

### 🎛️ Custom Editor for `.strudel` Files

- **Native File Support** — Double-click any `.strudel` file to open in Strudel Box
- **Auto-Save** — Changes are saved directly to the file
- **Syntax Highlighting** — Dedicated language support for `.strudel` files
- **File Icons** — Custom icons in the file explorer

### 🔊 Pre-loaded Sample Libraries

Strudel Box comes with extensive sample libraries ready to use:

| Library | Description |
|---------|-------------|
| **Tidal Drum Machines** | Roland TR-808, TR-909, TR-707, and more |
| **Piano** | Acoustic piano samples |
| **Dirt Samples** | Classic TidalCycles sample collection |
| **Emu SP12** | Legendary sampler sounds |
| **VCSL** | Versilian Community Sample Library |

### 📋 Log Panel

- **Real-time Feedback** — See sample loading status and errors
- **Collapsible Panel** — Expand/collapse to save space
- **Clear Function** — Reset logs when needed
- **Color-coded Messages** — Info, warnings, errors, and success states

---

## 🚀 Getting Started

### Installation

1. Install the extension from the VS Code Marketplace
2. Open a workspace with `.strudel` files (or create new ones)
3. Click the Strudel Player icon in the Activity Bar

### Your First Pattern

1. Open Strudel Box (`Ctrl+Shift+P` → "Strudel Box: Open Player")
2. Type a simple pattern:
   ```javascript
   s("bd sd hh*4")
   ```
3. Press `Ctrl+Enter` (or `Cmd+Enter` on Mac) to play
4. Press `Ctrl+.` (or `Cmd+.`) to stop

### Creating Pattern Files

Create files with the `.strudel` extension:

```javascript
// my-pattern.strudel
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Evaluate and play pattern |
| `Ctrl+.` / `Cmd+.` | Stop all audio (Hush) |
| `Ctrl+S` / `Cmd+S` | Save pattern to file |

---

## 📝 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `Strudel Box: Open Player` | Open the main Strudel Box panel |
| `Strudel Box: Hush (Stop Audio)` | Stop all audio playback |
| `Strudel Box: Load File` | Open file picker to load a pattern |
| `Strudel Box: Set Theme` | Choose between Cyberpunk, Halloween, or 8-Bit |
| `Strudel Box: Save Pattern` | Save current pattern to file |
| `Strudel Box: Open File Explorer` | Focus the Strudel Explorer sidebar |
| `Open in Strudel Box` | Open selected file in the REPL (context menu) |

---

## 🎵 Strudel Pattern Reference

### Sound Sources

```javascript
// Built-in synthesizers
sound("sawtooth")   // Sawtooth wave
sound("square")     // Square wave
sound("triangle")   // Triangle wave
sound("sine")       // Sine wave

// Sample-based sounds
sound("bd sd hh")   // Drums
sound("piano")      // Piano
sound("casio")      // Casio keyboard
```

### Notes & Melodies

```javascript
// Note patterns
note("c3 e3 g3 c4")
n("0 2 4 7")

// Mini-notation
"c3 e3 g3".note()
```

### Audio Effects

```javascript
// Filters
.lpf(800)      // Low-pass filter frequency
.hpf(200)      // High-pass filter frequency
.lpq(5)        // Filter resonance

// Space
.room(0.5)     // Reverb amount
.delay(0.25)   // Delay time

// Dynamics
.gain(0.8)     // Volume (0-1)
.velocity(0.7) // Note velocity
```

### Pattern Modifiers

```javascript
// Timing
.fast(2)       // Double speed
.slow(2)       // Half speed
.rev()         // Reverse pattern

// Structure
.stack()       // Layer patterns
.cat()         // Sequence patterns
.seq()         // Sequential playback

// Rhythm
.euclid(3, 8)  // Euclidean rhythm
```

### Scales & Chords

```javascript
.scale("C:minor")
.chord("Am7")
.voicing()
```

### Drum Machines

```javascript
// Use specific drum machines
sound("bd sd hh cp")
  .bank("RolandTR909")

// Available banks include:
// RolandTR808, RolandTR909, RolandTR707, and many more
```

---

## 📂 Example Patterns

### Simple Drum Beat

```javascript
s("bd sd [~ bd] sd, hh*8")
  .room(0.2)
```

### Melodic Synth

```javascript
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(sine.range(200, 2000).slow(4))
  .lpq(5)
  .room(0.3)
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

### Layered Composition

```javascript
stack(
  note("c3 e3 g3").sound("piano"),
  s("bd*4, hh*8"),
  note("c2").sound("sawtooth").lpf(200)
)
```

---

## 🎨 VS Code Themes

Strudel Box includes three matching VS Code color themes:

1. **Strudel Box - Cyberpunk** — Dark theme with cyan/magenta accents
2. **Strudel Box - Halloween** — Dark theme with orange/purple accents
3. **Strudel Box - 8-Bit** — Dark theme with retro green accents

To activate: `Ctrl+K Ctrl+T` → Select a Strudel Box theme

---

## ⚠️ Known Limitations

The following Strudel features are **not available** in Strudel Box:

| Feature | Reason |
|---------|--------|
| CSound Integration | `@strudel/csound` not loaded |
| Hydra Visuals | `@strudel/hydra` not loaded |
| Tidal Syntax | `@strudel/tidal` not loaded |
| Advanced MIDI | May have limited functionality |
| Device Motion | Only relevant on mobile devices |

For these advanced features, use the official [Strudel REPL](https://strudel.cc).

---

## 🔧 Technical Details

### Architecture

- **Extension Host** — Node.js/CommonJS for VS Code integration
- **Webview** — Browser/ESM for audio engine and UI
- **Audio Engine** — `@strudel/web` loaded from CDN
- **Editor** — CodeMirror 6 with JavaScript syntax

### Requirements

- VS Code 1.74.0 or higher
- Internet connection (for loading Strudel from CDN)
- Audio output device

### File Association

Files with `.strudel` extension are automatically:
- Recognized as Strudel language
- Opened with the Strudel Box custom editor
- Displayed with custom file icons

---

## 🐛 Troubleshooting

### No Sound

1. Check that your system audio is not muted
2. Ensure you've clicked Play or pressed `Ctrl+Enter` (audio requires user gesture)
3. Check the Log panel for errors
4. Try a simple pattern: `s("bd")`

### Samples Not Loading

1. Check your internet connection
2. Look at the Log panel for loading status
3. Some sample banks may not be available — try built-in synths instead

### Pattern Errors

1. Check the Log panel for error messages
2. Verify your pattern syntax
3. Try the pattern on [strudel.cc](https://strudel.cc) to compare

---

## 📚 Resources

- [Kiro IDE](https://kiro.dev) — AI-powered IDE for spec-driven development
- [strudel-box-template](https://github.com/deep2universe/strudel-box-template) — Kiro template for music creation
- [Strudel Documentation](https://strudel.cc/learn)
- [Strudel Pattern Reference](https://strudel.cc/reference)
- [TidalCycles (inspiration)](https://tidalcycles.org)
- [Dirt-Samples Repository](https://github.com/tidalcycles/Dirt-Samples)

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Strudel](https://strudel.cc) by Felix Roos and contributors
- [TidalCycles](https://tidalcycles.org) by Alex McLean
- [CodeMirror](https://codemirror.net) by Marijn Haverbeke

---

**Happy live coding! 🎶**
