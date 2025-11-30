# Strudel Box - Technische Tiefenanalyse

## Datum: 30. November 2025

---

## 1. Das @strudel/web Bundle

### 1.1 Was passiert beim Laden?

```html
<script src="https://unpkg.com/@strudel/web@latest"></script>
```

Wenn dieses Script geladen wird:

1. **@strudel/core wird geladen** (Pattern-Engine)
   - Log: `🌀 @strudel/core loaded 🌀`

2. **Globale Funktionen werden registriert:**
   ```javascript
   window.initStrudel = function() { ... }
   window.evaluate = function(code) { ... }
   window.hush = function() { ... }
   // etc.
   ```

3. **Pattern-Funktionen werden verfügbar:**
   ```javascript
   window.note = function(pattern) { ... }
   window.sound = function(pattern) { ... }
   window.s = function(pattern) { ... }
   // etc.
   ```

### 1.2 Was passiert bei initStrudel()?

```javascript
await initStrudel();
```

1. **AudioContext wird erstellt**
   - Web Audio API initialisiert
   - Benötigt User-Interaktion (Autoplay Policy)

2. **AudioWorklets werden geladen**
   - Log: `[superdough] AudioWorklets loaded`
   - Log: `[superdough] ready`

3. **Scheduler wird gestartet**
   - Pattern-Timing-Engine
   - Synchronisiert Audio-Events

### 1.3 Was passiert bei evaluate(code)?

```javascript
await evaluate('note("c3 e3 g3 c4").sound("sawtooth")');
```

1. **Code wird transpiliert**
   - Mini-Notation wird geparst
   - String-Patterns werden zu Funktionsaufrufen

2. **Pattern wird erstellt**
   - Strudel Pattern-Objekt
   - Enthält Timing und Werte

3. **Pattern wird dem Scheduler übergeben**
   - Audio-Events werden geplant
   - Sounds werden getriggert

---

## 2. Das Problem mit loadCsound

### 2.1 Wo kommt loadCsound her?

`loadCsound` ist Teil des `@strudel/csound` Pakets:

```javascript
// In @strudel/csound (NICHT in @strudel/web)
export async function loadCsound(strings, ...values) {
  // Lädt CSound WASM
  // Kompiliert CSound Orchestra
  // Registriert Instrument
}
```

### 2.2 Warum ist es nicht in @strudel/web?

`@strudel/web` ist ein **minimales Bundle** für einfache Anwendungsfälle:

```
@strudel/web (ca. 500KB)
├── @strudel/core
├── @strudel/mini
├── @strudel/webaudio
└── @strudel/superdough

@strudel/csound (zusätzlich ca. 5MB+)
├── @csound/browser (CSound WASM)
└── CSound Orchestra Parser
```

CSound wurde ausgelassen weil:
- Große Dateigröße (WASM Binary)
- Nicht jeder braucht CSound
- Komplexe Initialisierung

### 2.3 Der Fehler im Detail

```javascript
// User-Code
await loadCsound`instr CoolSynth...`

// Was passiert:
// 1. JavaScript sucht nach window.loadCsound
// 2. window.loadCsound ist undefined
// 3. ReferenceError wird geworfen
```

```
ReferenceError: loadCsound is not defined
    at eval (eval at uP ...)
```

---

## 3. Die @strudel/repl Alternative

### 3.1 Was ist @strudel/repl?

`@strudel/repl` ist das **vollständige Strudel REPL** als Web Component:

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
<strudel-editor>
<!--
note("c3 e3 g3 c4")
-->
</strudel-editor>
```

### 3.2 Was enthält @strudel/repl?

```
@strudel/repl
├── @strudel/web (Basis)
├── @strudel/csound ✅
├── @strudel/hydra ✅
├── @strudel/midi ✅
├── @strudel/osc ✅
├── @strudel/tidal ✅
├── CodeMirror 6 Editor
├── Visualisierungen
└── UI Controls
```

### 3.3 Warum funktioniert es nicht für uns?

`@strudel/repl` exportiert **keine globalen Funktionen**:

```javascript
// Nach dem Laden von @strudel/repl:
console.log(window.initStrudel);  // undefined!
console.log(window.evaluate);     // undefined!
console.log(window.loadCsound);   // undefined!
```

Es registriert nur die Web Component:
```javascript
customElements.define('strudel-editor', StrudelEditor);
```

Die Funktionen sind **intern** in der Web Component gekapselt.

---

## 4. VS Code Webview Einschränkungen

### 4.1 Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  script-src 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' 
             https://unpkg.com https://cdn.jsdelivr.net;
  connect-src https: wss: data: blob:;
  worker-src blob: data: https://unpkg.com;
">
```

**Erlaubt:**
- Scripts von unpkg.com und jsdelivr.net
- WebAssembly (`wasm-unsafe-eval`)
- Fetch zu HTTPS URLs
- Web Workers

**Blockiert:**
- Scripts von unbekannten Domains
- Unsichere HTTP Verbindungen

### 4.2 Iframe Isolation

VS Code Webviews laufen in isolierten iframes:

```
VS Code Window
└── Webview iframe (isoliert)
    └── Unser Code
        └── @strudel/web
```

**Konsequenzen:**
- Eigener `window` Scope
- Kein Zugriff auf VS Code's DOM
- DevTools Console kann falschen Kontext zeigen

### 4.3 Audio Autoplay Policy

Browser blockieren Audio ohne User-Interaktion:

```javascript
// ❌ Wird blockiert (kein User-Event)
window.onload = async () => {
  await initStrudel();
  await evaluate('sound("bd")');
};

// ✅ Funktioniert (im Click-Handler)
button.onclick = async () => {
  await initStrudel();
  await evaluate('sound("bd")');
};
```

---

## 5. Mögliche Lösungen im Detail

### 5.1 Lösung A: Zusätzliche Pakete laden

**Theorie:**
```html
<script src="https://unpkg.com/@strudel/web@latest"></script>
<script src="https://unpkg.com/@strudel/csound@latest"></script>
```

**Problem:** 
- `@strudel/csound` ist kein standalone Bundle
- Es erwartet, dass es als ES Module importiert wird
- Globale Funktionen werden nicht automatisch registriert

**Möglicher Workaround:**
```javascript
// Manuell laden und registrieren
import { loadCsound } from '@strudel/csound';
window.loadCsound = loadCsound;
```

Aber: Das erfordert einen Build-Prozess und funktioniert nicht mit CDN-Scripts.

### 5.2 Lösung B: strudel.cc iframe

**Implementierung:**
```html
<iframe 
  src="https://strudel.cc/#base64encodedcode"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

**Kommunikation:**
```javascript
// Zum iframe senden
iframe.contentWindow.postMessage({ type: 'loadCode', code: '...' }, '*');

// Vom iframe empfangen
window.addEventListener('message', (e) => {
  if (e.origin === 'https://strudel.cc') {
    // Handle message
  }
});
```

**Probleme:**
- strudel.cc müsste postMessage unterstützen
- CSP könnte iframe blockieren
- Weniger Kontrolle über UI

### 5.3 Lösung C: Eigenes Bundle bauen

**Theorie:** Ein eigenes Bundle erstellen, das alle benötigten Pakete enthält.

```javascript
// custom-strudel-bundle.js
import { initStrudel, evaluate, hush } from '@strudel/web';
import { loadCsound, loadOrc } from '@strudel/csound';
import { initHydra } from '@strudel/hydra';

window.initStrudel = initStrudel;
window.evaluate = evaluate;
window.hush = hush;
window.loadCsound = loadCsound;
window.loadOrc = loadOrc;
window.initHydra = initHydra;
```

**Vorteile:**
- Volle Kontrolle
- Alle Features verfügbar

**Nachteile:**
- Großes Bundle (10MB+)
- Wartungsaufwand
- Build-Komplexität

---

## 6. Empfohlene Architektur

### 6.1 Kurzfristig: Pragmatischer Ansatz

```
┌─────────────────────────────────────────────────────────────┐
│                    Strudel Box Extension                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              @strudel/web (CDN)                      │   │
│  │                                                     │   │
│  │  ✅ Basis-Patterns (note, sound, s)                 │   │
│  │  ✅ Synthesizer (sawtooth, square, etc.)            │   │
│  │  ✅ Effekte (lpf, room, delay)                      │   │
│  │  ✅ Pattern-Modifikation (fast, slow, euclid)       │   │
│  │                                                     │   │
│  │  ❌ CSound (nicht verfügbar)                        │   │
│  │  ❌ Hydra (nicht verfügbar)                         │   │
│  │  ❌ Tidal Syntax (nicht verfügbar)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Benutzerfreundliche Fehlermeldungen:                       │
│  "CSound ist in Strudel Box nicht verfügbar.                │
│   Nutze strudel.cc für erweiterte Features."                │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Langfristig: Custom Bundle

```
┌─────────────────────────────────────────────────────────────┐
│                    Strudel Box Extension                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Custom Strudel Bundle (self-hosted)        │   │
│  │                                                     │   │
│  │  @strudel/web                                       │   │
│  │  @strudel/csound (optional, lazy-loaded)            │   │
│  │  @strudel/hydra (optional, lazy-loaded)             │   │
│  │  @strudel/midi                                      │   │
│  │                                                     │   │
│  │  Alle Features verfügbar!                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Bundle wird mit Extension ausgeliefert                     │
│  Kein CDN-Dependency                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Fazit

Das Kernproblem ist die **Modularität des Strudel-Ökosystems**:

1. `@strudel/web` ist minimal und enthält nicht alle Features
2. `@strudel/repl` enthält alles, aber als Web Component ohne globale API
3. Einzelne Pakete wie `@strudel/csound` sind nicht als standalone CDN-Scripts verfügbar

**Die beste Lösung** für volle Feature-Unterstützung wäre ein **eigenes Bundle**, das alle benötigten Pakete zusammenfasst und globale Funktionen exportiert. Dies erfordert jedoch einen Build-Prozess und erhöht die Komplexität.

**Die pragmatische Lösung** ist, bei `@strudel/web` zu bleiben und die Einschränkungen klar zu dokumentieren.
