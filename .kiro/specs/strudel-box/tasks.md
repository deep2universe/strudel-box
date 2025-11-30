# Strudel Box - Implementation Tasks

> Referenz: `Strudel-Box-Implementation-Specification-v5-Final.md`

---

## Phase 1: Audio Foundation (Ref: Section 7, Phase 1)

### 1.1 Webview Build-Infrastruktur
- [ ] `webview-ui/tsconfig.json` erstellen (Ref: Section 3)
- [ ] `webview-ui/vite.config.ts` erstellen (Ref: Section 7, Phase 1)
- [ ] `webview-ui/package.json` Scripts aktualisieren (`dev`, `build`)
- [ ] Build-Prozess testen mit `npm run build`

### 1.2 VS Code API Wrapper
- [ ] `webview-ui/src/vscode.ts` erstellen (Ref: Section 7, Phase 1)
  - `acquireVsCodeApi()` Wrapper
  - `postMessage()` Helper
  - `saveState()` / `getState()` für State Persistence

### 1.3 CodeMirror Editor
- [ ] `webview-ui/src/editor.ts` erstellen (Ref: Section 5)
  - `createEditor()` mit basicSetup und JavaScript Syntax
  - Dark Theme mit CSS Variables
  - Strudel Keymap: `Ctrl+Enter` (evaluate), `Ctrl+.` (hush)
  - `getCode()` und `setCode()` Helper

### 1.4 Basis HTML & Styling
- [ ] `webview-ui/index.html` erstellen (Ref: Section 7, Phase 1)
  - Strudel CDN Script einbinden
  - App Container mit Header, Editor, Controls
- [ ] `webview-ui/src/styles.css` erstellen (Ref: Section 7, Phase 1)
  - CSS Variables für Theming
  - Layout: Flexbox, responsive
  - Button Styles

### 1.5 Strudel Integration
- [ ] `webview-ui/src/main.ts` erstellen (Ref: Section 4, Section 7)
  - `initStrudel()` bei User-Interaktion (Autoplay Policy)
  - `evaluate(code)` für Pattern-Ausführung
  - `hush()` für Stop
  - Status-Anzeige Updates
  - Message Listener für Extension-Kommunikation

**Checkpoint Phase 1:**
- [ ] CodeMirror Editor erscheint mit Syntax Highlighting
- [ ] Play Button startet Audio
- [ ] Stop Button stoppt Audio
- [ ] `Ctrl+Enter` evaluiert Code
- [ ] `Ctrl+.` stoppt Audio

---

## Phase 2: Extension-Webview Communication (Ref: Section 7, Phase 2)

### 2.1 StrudelBoxPanel Klasse
- [ ] `src/StrudelBoxPanel.ts` erstellen (Ref: Section 6, Section 7)
  - Singleton Pattern mit `createOrShow()`
  - Webview Panel mit `enableScripts` und `retainContextWhenHidden`
  - CSP Header korrekt setzen (Ref: Section 9)
  - `localResourceRoots` für Webview Assets
  - Nonce-Generierung für Script Security

### 2.2 Extension Commands
- [ ] `src/extension.ts` aktualisieren
  - `strudel-box.open` - Panel öffnen
  - `strudel-box.hush` - Audio stoppen
  - `strudel-box.loadFile` - .strudel Datei laden
  - `strudel-box.save` - Pattern speichern
  - `strudel-box.setTheme` - Theme wechseln
- [ ] `package.json` Commands registrieren (contributes.commands)

### 2.3 Message Protocol
- [ ] Extension → Webview Messages implementieren
  - `loadCode` - Code in Editor laden
  - `hush` - Audio stoppen
  - `setTheme` - Theme wechseln
- [ ] Webview → Extension Messages implementieren
  - `ready` - Webview bereit
  - `error` - Fehler melden
  - `saveCode` - Code speichern

### 2.4 File Operations
- [ ] `.strudel` File Association in `package.json`
- [ ] Load File Dialog mit Filter
- [ ] Save File Dialog mit `.strudel` Extension

**Checkpoint Phase 2:**
- [ ] "Strudel Box: Hush" Command stoppt Audio
- [ ] "Strudel Box: Load File" lädt .strudel Dateien
- [ ] "Strudel Box: Save" speichert Code

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
- [ ] CSS Variables für alle Themes definieren
- [ ] `data-theme` Attribut auf `<html>` Element
- [ ] Theme Persistence mit VS Code State

### 4.2 Default Theme (Cyberpunk)
- [ ] Cyan/Magenta Farbpalette
- [ ] Neon Glow Effects

### 4.3 Halloween Theme
- [ ] Orange/Purple Farbpalette
- [ ] Spooky Glow Effects
- [ ] Optional: Particle Effects

### 4.4 8-Bit Theme
- [ ] Green/Red Retro Farbpalette
- [ ] CRT Scanline Effect (CSS `::after` mit `repeating-linear-gradient`)
- [ ] Pixelated Rendering (`image-rendering: pixelated`)

### 4.5 Theme Switcher
- [ ] Theme Selector UI (Dropdown oder Buttons)
- [ ] "Strudel Box: Set Theme" Command mit QuickPick

**Checkpoint Phase 4:**
- [ ] Theme Switcher funktioniert
- [ ] Halloween Theme mit Orange/Purple Palette
- [ ] 8-Bit Theme mit CRT Effect

---

## Phase 5: Polish & Release (Ref: Section 7, Phase 5)

### 5.1 Error Handling
- [ ] Try/Catch für alle async Operations
- [ ] User-friendly Error Messages
- [ ] Console Logging für Debugging

### 5.2 Performance
- [ ] Webview `retainContextWhenHidden` nutzen
- [ ] Visualizer pausieren wenn nicht sichtbar
- [ ] Memory Leaks prüfen (AudioContext cleanup)

### 5.3 Documentation
- [ ] README.md aktualisieren
  - Features
  - Installation
  - Keyboard Shortcuts
  - Screenshots
- [ ] CHANGELOG.md aktualisieren

### 5.4 Packaging
- [ ] `package.json` Metadata vervollständigen
  - Publisher, Repository, Icon
  - Categories, Keywords
- [ ] `.vscodeignore` prüfen
- [ ] `vsce package` ausführen
- [ ] Extension testen mit `.vsix`

### 5.5 Release
- [ ] Screenshots erstellen
- [ ] Marketplace Listing vorbereiten
- [ ] `vsce publish` (optional)

**Checkpoint Phase 5:**
- [ ] Vollständiges Error Handling
- [ ] Performance optimiert
- [ ] README.md komplett
- [ ] `.vsix` Package erstellt

---

## Quick Reference

### Dateien zu erstellen (Ref: Section 3)
```
webview-ui/
├── src/
│   ├── main.ts
│   ├── editor.ts
│   ├── visualizer.ts
│   ├── vscode.ts
│   └── styles.css
├── index.html
├── tsconfig.json
└── vite.config.ts

src/
├── extension.ts (aktualisieren)
└── StrudelBoxPanel.ts (neu)
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
