# Strudel Box - Architektur-Analyse und Problemdokumentation

## Datum: 30. November 2025

---

## 1. Projektziel

**Strudel Box** ist eine VS Code Extension, die:
- `.strudel` Musikdateien erstellen und bearbeiten kann
- Eine REPL (Read-Eval-Print-Loop) für Live-Coding von Musik bietet
- Strudel-Patterns in Echtzeit abspielen kann

**Tagline:** "Code your beats. Visualize your sound. Share your vibe."

---

## 2. Aktuelle Architektur

### 2.1 Zwei-Prozess-Modell

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Extension Host (Node.js)                   │   │
│  │                                                     │   │
│  │  src/extension.ts                                   │   │
│  │  ├── Commands registrieren                          │   │
│  │  ├── Custom Editor Provider                         │   │
│  │  └── Panel-Lifecycle verwalten                      │   │
│  │                                                     │   │
│  │  src/StrudelBoxPanel.ts                             │   │
│  │  ├── Webview Panel erstellen                        │   │
│  │  ├── HTML/CSP generieren                            │   │
│  │  └── Messages senden/empfangen                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                    postMessage (JSON)                       │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Webview (Browser-Kontext)               │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         @strudel/web (CDN)                   │   │   │
│  │  │  • initStrudel() - Audio initialisieren      │   │   │
│  │  │  • evaluate(code) - Pattern ausführen        │   │   │
│  │  │  • hush() - Audio stoppen                    │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         CodeMirror 6 Editor                  │   │   │
│  │  │  • Syntax Highlighting                       │   │   │
│  │  │  • Keyboard Shortcuts (Ctrl+Enter, Ctrl+.)   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  webview-ui/src/main.ts                            │   │
│  │  ├── Editor initialisieren                         │   │
│  │  ├── Play/Stop Buttons                             │   │
│  │  ├── Theme System                                  │   │
│  │  └── Particle Effects                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Dateistruktur

```
strudel-box/
├── src/                          # Extension Host Code
│   ├── extension.ts              # Entry Point, Commands
│   └── StrudelBoxPanel.ts        # Webview Panel Management
│
├── webview-ui/                   # Webview Frontend
│   ├── src/
│   │   ├── main.ts               # Entry Point
│   │   ├── editor.ts             # CodeMirror Setup
│   │   ├── vscode.ts             # VS Code API Bridge
│   │   ├── particles.ts          # Particle Effects
│   │   ├── icons.ts              # Theme Icons
│   │   └── styles.css            # Themes (Cyberpunk, Halloween, 8-Bit)
│   └── dist/                     # Built Assets
│
├── package.json                  # Extension Manifest
└── themes/                       # VS Code Color Themes
```

### 2.3 Kommunikationsfluss

```
Extension Host                    Webview
     │                               │
     │  ──── loadCode ────────────>  │  Code in Editor laden
     │  ──── hush ────────────────>  │  Audio stoppen
     │  ──── setTheme ────────────>  │  Theme wechseln
     │                               │
     │  <──── ready ──────────────   │  Webview bereit
     │  <──── error ──────────────   │  Fehler melden
     │  <──── saveCode ───────────   │  Code speichern
     │                               │
```

---

## 3. Das Kernproblem: @strudel/web vs. Vollständige Strudel REPL

### 3.1 Was ist @strudel/web?

`@strudel/web` ist ein **minimales Bundle** der Strudel-Bibliothek, das über CDN geladen wird:

```html
<script src="https://unpkg.com/@strudel/web@latest"></script>
```

**Enthaltene Funktionen:**
- `initStrudel()` - Audio-Engine initialisieren
- `evaluate(code)` - Strudel-Code ausführen
- `hush()` - Alle Patterns stoppen
- `note()`, `sound()`, `s()` - Basis-Pattern-Funktionen
- `getAudioContext()` - Web Audio API Zugriff

**NICHT enthaltene Funktionen:**
- `loadCsound` - CSound Integration
- `loadOrc` - CSound Orchestra Files
- `initHydra` - Hydra Visuals
- `initTidal` - Tidal Syntax
- `midin` - MIDI Input
- `samples()` mit GitHub-URLs - Erweiterte Sample-Loading

### 3.2 Fehlermeldung aus dem Log

```
web@latest:1 [eval] error: loadCsound is not defined
web@latest:2 ReferenceError: loadCsound is not defined
    at eval (eval at uP (web@latest:2:50440), <anonymous>:3:34)
```

**Ursache:** Der Benutzer versucht Code auszuführen, der `loadCsound` verwendet:

```javascript
await loadCsound`
instr CoolSynth
...
endin`

"<0 2 [4 6](3,4,2) 3*2>"
  .csound('CoolSynth')
```

Diese Funktion existiert in `@strudel/web` nicht.

### 3.3 Strudel Paket-Ökosystem

```
@strudel/web          ← Minimales Bundle (was wir nutzen)
    │
    ├── @strudel/core     ← Pattern-Engine
    ├── @strudel/mini     ← Mini-Notation Parser
    └── @strudel/webaudio ← Web Audio Output

@strudel/repl         ← Vollständige REPL (Web Component)
    │
    ├── @strudel/web
    ├── @strudel/csound   ← CSound Integration ❌ fehlt uns
    ├── @strudel/hydra    ← Hydra Visuals ❌ fehlt uns
    ├── @strudel/midi     ← MIDI Support ❌ fehlt uns
    └── @strudel/osc      ← OSC Support ❌ fehlt uns
```

---

## 4. Versuchte Lösungsansätze

### 4.1 Ansatz 1: @strudel/repl verwenden

**Idee:** Das vollständige REPL-Paket laden, das alle Features enthält.

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
```

**Problem:** 
- `@strudel/repl` exportiert **keine globalen Funktionen** wie `initStrudel()`
- Es registriert nur die `<strudel-editor>` Web Component
- Unsere bestehende Architektur (CodeMirror + manuelle evaluate()) funktioniert nicht

**Ergebnis:**
```
window.initStrudel is not a function
```

### 4.2 Ansatz 2: strudel-editor Web Component

**Idee:** Die offizielle `<strudel-editor>` Web Component verwenden.

```html
<strudel-editor>
<!--
note("c3 e3 g3 c4")
-->
</strudel-editor>
```

**Probleme:**
- Editor nicht editierbar (kein Text-Input möglich)
- Eigene Play/Stop Buttons verschwunden
- Styling-Konflikte mit unserem Theme-System
- Weniger Kontrolle über die UI

### 4.3 Ansatz 3: Zurück zu @strudel/web (aktueller Stand)

**Status:** Funktioniert für Basis-Patterns, aber nicht für erweiterte Features.

**Was funktioniert:**
```javascript
// ✅ Funktioniert
note("c3 e3 g3 c4").sound("sawtooth").lpf(800)
sound("bd sd hh cp")
s("piano").note("c e g b")
```

**Was NICHT funktioniert:**
```javascript
// ❌ loadCsound is not defined
await loadCsound`instr CoolSynth...`

// ❌ loadOrc is not defined  
await loadOrc('github:kunstmusik/csound-live-code/master/livecode.orc')

// ❌ initHydra is not defined
await initHydra()

// ❌ Möglicherweise problematisch
samples('github:tidalcycles/dirt-samples')
```

---

## 5. Technische Einschränkungen

### 5.1 VS Code Webview CSP (Content Security Policy)

Die Webview hat strenge Sicherheitsrichtlinien:

```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'unsafe-eval' 'unsafe-inline' https://unpkg.com ...;
  connect-src https: wss: data: blob:;
  worker-src blob: data: https://unpkg.com;
">
```

**Einschränkungen:**
- Nur bestimmte CDN-Domains erlaubt
- WebAssembly benötigt `wasm-unsafe-eval`
- Worker müssen von erlaubten Quellen kommen

### 5.2 Iframe-Isolation

VS Code Webviews laufen in isolierten iframes:
- Eigener `window` Scope
- Kein Zugriff auf VS Code's `window`
- DevTools Console zeigt möglicherweise falschen Kontext

### 5.3 Audio Autoplay Policy

Browser blockieren Audio ohne User-Interaktion:
```javascript
// Muss in einem Click-Handler aufgerufen werden
await initStrudel();
```

---

## 6. Mögliche Lösungswege

### 6.1 Option A: Feature-Einschränkung akzeptieren

**Beschreibung:** Bei `@strudel/web` bleiben und dokumentieren, welche Features nicht unterstützt werden.

**Vorteile:**
- Stabile, funktionierende Basis
- Volle Kontrolle über UI/UX
- Einfache Architektur

**Nachteile:**
- Keine CSound, Hydra, erweiterte MIDI-Features
- Nicht 100% kompatibel mit strudel.cc

**Implementierung:**
- Fehlermeldungen verbessern ("Feature X wird nicht unterstützt")
- Dokumentation der unterstützten Features
- Link zu strudel.cc für erweiterte Features

### 6.2 Option B: Iframe mit strudel.cc

**Beschreibung:** Die offizielle strudel.cc REPL in einem iframe einbetten.

```html
<iframe src="https://strudel.cc/#base64encodedcode"></iframe>
```

**Vorteile:**
- 100% Feature-Kompatibilität
- Immer aktuell mit strudel.cc
- Keine Wartung der Audio-Engine nötig

**Nachteile:**
- Weniger Kontrolle über UI
- Kommunikation über postMessage komplexer
- Abhängigkeit von externer Website
- Möglicherweise CSP-Probleme

### 6.3 Option C: Zusätzliche Strudel-Pakete laden

**Beschreibung:** Versuchen, `@strudel/csound`, `@strudel/hydra` etc. separat zu laden.

```html
<script src="https://unpkg.com/@strudel/web@latest"></script>
<script src="https://unpkg.com/@strudel/csound@latest"></script>
```

**Vorteile:**
- Modularer Ansatz
- Nur benötigte Features laden

**Nachteile:**
- Unbekannt ob das funktioniert
- Pakete müssen kompatibel sein
- Möglicherweise komplexe Initialisierung

### 6.4 Option D: Hybrid-Ansatz

**Beschreibung:** Eigenen Editor behalten, aber `<strudel-editor>` versteckt für Evaluation nutzen.

**Vorteile:**
- Volle Feature-Unterstützung
- Eigene UI behalten

**Nachteile:**
- Komplexe Synchronisation
- Doppelte Editor-Instanzen
- Performance-Overhead

---

## 7. Empfehlung

### Kurzfristig: Option A (Feature-Einschränkung)

1. Bei `@strudel/web` bleiben
2. Klare Dokumentation der unterstützten Features
3. Bessere Fehlermeldungen für nicht unterstützte Funktionen
4. Link zu strudel.cc für erweiterte Features

### Langfristig: Option C untersuchen

1. Testen ob zusätzliche Pakete geladen werden können
2. Schrittweise Features hinzufügen
3. Fallback auf strudel.cc iframe wenn nötig

---

## 8. Nächste Schritte

1. **Dokumentation erstellen:** Liste aller unterstützten vs. nicht unterstützten Features
2. **Fehlermeldungen verbessern:** Benutzerfreundliche Meldungen für fehlende Features
3. **Option C testen:** Experimentieren mit zusätzlichen Strudel-Paketen
4. **Entscheidung treffen:** Basierend auf Testergebnissen finale Architektur wählen

---

## 9. Referenzen

- [Strudel Documentation](https://strudel.cc/learn/getting-started)
- [Strudel GitHub](https://github.com/tidalcycles/strudel)
- [@strudel/web npm](https://www.npmjs.com/package/@strudel/web)
- [@strudel/repl npm](https://www.npmjs.com/package/@strudel/repl)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
