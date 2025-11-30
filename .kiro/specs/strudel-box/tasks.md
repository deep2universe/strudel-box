# Strudel Box - Implementation Tasks

> Reference: `Strudel-Box-Implementation-Specification-v5-Final.md`

---

## Phase 1: Audio Foundation (Ref: Section 7, Phase 1)

### 1.1 Webview Build Infrastructure
- [x] `webview-ui/tsconfig.json` erstellen (Ref: Section 3)
- [x] `webview-ui/vite.config.ts` erstellen (Ref: Section 7, Phase 1)
- [x] `webview-ui/package.json` Scripts aktualisieren (`dev`, `build`)
- [x] Build-Prozess testen mit `npm run build`

### 1.2 VS Code API Wrapper
- [x] `webview-ui/src/vscode.ts` erstellen (Ref: Section 7, Phase 1)
  - `acquireVsCodeApi()` Wrapper
  - `postMessage()` Helper
  - `saveState()` / `getState()` für State Persistence

### 1.3 CodeMirror Editor
- [x] `webview-ui/src/editor.ts` erstellen (Ref: Section 5)
  - `createEditor()` mit basicSetup und JavaScript Syntax
  - Dark Theme mit CSS Variables
  - Strudel Keymap: `Ctrl+Enter` (evaluate), `Ctrl+.` (hush)
  - `getCode()` und `setCode()` Helper

### 1.4 Basis HTML & Styling
- [x] `webview-ui/index.html` erstellen (Ref: Section 7, Phase 1)
  - Strudel CDN Script einbinden
  - App Container mit Header, Editor, Controls
- [x] `webview-ui/src/styles.css` erstellen (Ref: Section 7, Phase 1)
  - CSS Variables für Theming
  - Layout: Flexbox, responsive
  - Button Styles

### 1.5 Strudel Integration
- [x] `webview-ui/src/main.ts` erstellen (Ref: Section 4, Section 7)
  - `initStrudel()` bei User-Interaktion (Autoplay Policy)
  - `evaluate(code)` für Pattern-Ausführung
  - `hush()` für Stop
  - Status-Anzeige Updates
  - Message Listener für Extension-Kommunikation

**Checkpoint Phase 1:**
- [x] CodeMirror Editor erscheint mit Syntax Highlighting
- [x] Play Button startet Audio
- [x] Stop Button stoppt Audio
- [x] `Ctrl+Enter` evaluiert Code
- [x] `Ctrl+.` stoppt Audio

---

## Phase 2: Extension-Webview Communication (Ref: Section 7, Phase 2)

### 2.1 StrudelBoxPanel Klasse
- [x] `src/StrudelBoxPanel.ts` erstellen (Ref: Section 6, Section 7)
  - Singleton Pattern mit `createOrShow()`
  - Webview Panel mit `enableScripts` und `retainContextWhenHidden`
  - CSP Header korrekt setzen (Ref: Section 9)
  - `localResourceRoots` für Webview Assets
  - Nonce-Generierung für Script Security

### 2.2 Extension Commands
- [x] `src/extension.ts` aktualisieren
  - `strudel-box.open` - Panel öffnen
  - `strudel-box.hush` - Audio stoppen
  - `strudel-box.loadFile` - .strudel Datei laden
  - `strudel-box.setTheme` - Theme wechseln
  - `strudel-box.save` - Pattern speichern
- [x] `package.json` Commands registrieren (contributes.commands)

### 2.3 Message Protocol
- [x] Extension → Webview Messages implementieren
  - `loadCode` - Code in Editor laden
  - `hush` - Audio stoppen
  - `setTheme` - Theme wechseln
- [x] Webview → Extension Messages implementieren
  - `ready` - Webview bereit
  - `error` - Fehler melden
  - `saveCode` - Code speichern

### 2.4 File Operations
- [x] `.strudel` File Association in `package.json` (contributes.languages)
- [x] Load File Dialog mit Filter
- [x] Save File Dialog mit `.strudel` Extension

**Checkpoint Phase 2:**
- [x] "Strudel Box: Hush" Command stoppt Audio
- [x] "Strudel Box: Load File" lädt .strudel Dateien
- [x] "Strudel Box: Save" Command funktioniert

---

## Phase 3: Visualizations (Ref: Section 7, Phase 3)

### 3.1 Visualizer Klasse
- [ ] `webview-ui/src/visualizer.ts` erstellen (Ref: Section 7, Phase 3)
  - Canvas 2D Context Setup
  - `AnalyserNode` Connection
  - Resize Handler für responsive Canvas
  - Animation Loop mit `requestAnimationFrame`

### 3.2 Spectrum Analyzer
- [ ] Frequency Data mit `getByteFrequencyData()`
- [ ] Bar-Rendering mit Farbverlauf (Hue basierend auf Frequenz)
- [ ] Theme-aware Background Color

### 3.3 Waveform Display
- [ ] Time Domain Data mit `getByteTimeDomainData()`
- [ ] Line-Rendering für Waveform
- [ ] Toggle zwischen Spectrum und Waveform

### 3.4 UI Integration
- [ ] Canvas Element in `index.html` hinzufügen
- [ ] Visualizer in `main.ts` initialisieren
- [ ] AudioContext Connection nach `initStrudel()`

**Checkpoint Phase 3:**
- [ ] Spectrum Bars reagieren auf Audio
- [ ] Waveform Visualization funktioniert
- [ ] 60fps Performance

---

## Phase 4: Themes (Ref: Section 7, Phase 4)

### 4.1 Theme System
- [x] CSS Variables für alle Themes definieren
- [x] `data-theme` Attribut auf `<html>` Element
- [x] Theme Persistence mit VS Code State

### 4.2 Default Theme (Cyberpunk)
- [x] Cyan/Magenta Farbpalette
- [x] Neon Glow Effects (gradient header)
- [x] Animated neon border on editor focus
- [x] Pulsing title animation
- [x] Theme-specific SVG icons

### 4.3 Halloween Theme
- [x] Orange/Purple Farbpalette
- [x] Spooky Glow Effects (pumpkin pulse, ghost float)
- [x] Particle Effects (ghosts, bats, sparks, fog)
- [x] Flickering title animation
- [x] Fog overlay effect
- [x] Theme-specific SVG icons (pumpkin play, ghost stop)

### 4.4 8-Bit Theme
- [x] Green/Red Retro Farbpalette
- [x] CRT Scanline Effect (CSS `::after` mit `repeating-linear-gradient`)
- [x] Pixelated Rendering (`image-rendering: pixelated`)
- [x] CRT Vignette effect
- [x] Screen flicker animation
- [x] Pixel-style buttons with 3D effect
- [x] Particle Effects (pixel stars, arcade sparks, retro blocks)
- [x] Theme-specific pixelated SVG icons

### 4.5 Theme Switcher
- [x] "Strudel Box: Set Theme" Command mit QuickPick
- [x] Theme Selector UI im Webview (emoji buttons)
- [x] Active state indication
- [x] Hover effects per theme

### 4.6 Particle System
- [x] `webview-ui/src/particles.ts` erstellt
- [x] Canvas-basiertes Rendering mit requestAnimationFrame
- [x] Cyberpunk: Neon lines, digital drops, glitch effects
- [x] Halloween: Ghosts, bats, sparks, fog particles
- [x] 8-Bit: Pixel stars, arcade sparks, retro blocks
- [x] Theme-aware particle spawning

### 4.7 Icon System
- [x] `webview-ui/src/icons.ts` erstellt
- [x] Cyberpunk icons (neon gradients, glow filters)
- [x] Halloween icons (pumpkin, ghost SVGs)
- [x] 8-Bit icons (pixelated style)
- [x] Dynamic icon updates on theme change

**Checkpoint Phase 4:**
- [x] Theme Switcher funktioniert (via Command + UI)
- [x] Halloween Theme mit Glow Effects + Particles
- [x] 8-Bit Theme mit CRT Effect + Particles
- [x] Cyberpunk Theme mit Neon Effects + Particles
- [x] All themes have unique SVG icons

---

## Phase 5: Polish & Release (Ref: Section 7, Phase 5)

### 5.1 Code Quality
- [x] TypeScript Fehler in `webview-ui/src/main.ts` beheben
  - Fixed `stop` declaration modifier conflict
  - Fixed `window` type casting issue
- [x] Vite config `emptyDirBeforeWrite` → `emptyOutDir` korrigiert

### 5.2 Error Handling
- [x] Try/Catch für async Operations
- [x] User-friendly Error Messages
- [x] Console Logging für Debugging

### 5.3 Performance
- [x] Webview `retainContextWhenHidden` nutzen
- [ ] Visualizer pausieren wenn nicht sichtbar
- [ ] Memory Leaks prüfen (AudioContext cleanup)

### 5.4 Documentation
- [ ] README.md aktualisieren
  - Features
  - Installation
  - Keyboard Shortcuts
  - Screenshots
- [ ] CHANGELOG.md aktualisieren

### 5.5 Packaging
- [ ] `package.json` Metadata vervollständigen
  - Publisher, Repository, Icon
  - Categories, Keywords
- [ ] `.vscodeignore` prüfen
- [ ] `vsce package` ausführen
- [ ] Extension testen mit `.vsix`

### 5.6 Release
- [ ] Screenshots erstellen
- [ ] Marketplace Listing vorbereiten
- [ ] `vsce publish` (optional)

**Checkpoint Phase 5:**
- [ ] Keine TypeScript Fehler
- [ ] Performance optimiert
- [ ] README.md komplett
- [ ] `.vsix` Package erstellt

---

## Quick Reference

### Dateien Status
```
webview-ui/
├── src/
│   ├── main.ts         ✅ (Theme system integrated)
│   ├── editor.ts       ✅
│   ├── particles.ts    ✅ (Particle effects system)
│   ├── icons.ts        ✅ (Theme-specific SVG icons)
│   ├── visualizer.ts   ❌ TODO (Audio visualization)
│   ├── vscode.ts       ✅
│   └── styles.css      ✅ (Complete theme styles)
├── index.html          ✅ (Theme switcher UI)
├── tsconfig.json       ✅
├── vite.config.ts      ✅
└── dist/               ✅ Built

src/
├── extension.ts        ✅
└── StrudelBoxPanel.ts  ✅ (Updated HTML with theme UI)
```

### Keyboard Shortcuts (Ref: Section 2)
| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Evaluate pattern |
| `Ctrl+.` / `Cmd+.` | Stop all audio |
| `Ctrl+S` / `Cmd+S` | Save pattern |

### Strudel Functions (Ref: Section 4)
- `initStrudel()` - Initialize audio engine
- `evaluate(code)` - Execute pattern
- `hush()` - Stop all patterns
- `getAudioContext()` - Get AudioContext for visualizer

---

## Remaining Work Summary

### Phase 3: Visualizations (Not Started)
The audio visualizer feature is not yet implemented. This includes:
- Creating `visualizer.ts` with Canvas 2D rendering
- Connecting to Strudel's AudioContext via AnalyserNode
- Implementing spectrum analyzer (frequency bars)
- Implementing waveform display
- Adding toggle between visualization modes
- Integrating canvas into the UI

### Phase 5: Polish & Release (Partially Complete)
- **Done**: Code quality fixes, error handling, basic performance
- **TODO**: 
  - Visualizer pause when hidden (depends on Phase 3)
  - AudioContext cleanup verification
  - README.md with features, installation, shortcuts, screenshots
  - CHANGELOG.md update
  - package.json metadata (publisher, repository, icon, categories, keywords)
  - .vscodeignore verification
  - vsce package creation and testing
  - Screenshots and marketplace preparation
