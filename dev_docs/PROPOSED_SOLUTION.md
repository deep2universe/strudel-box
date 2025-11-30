# Strudel Box - Vorgeschlagene Lösung für volle Feature-Parität

## Datum: 30. November 2025

---

## 1. Ziel

**Strudel Box soll 100% Feature-Parität mit strudel.cc haben.**

Alles was auf der Webseite funktioniert, muss auch in der VS Code Extension funktionieren:
- ✅ Alle Basis-Patterns (note, sound, s)
- ✅ CSound Integration (loadCsound, loadOrc)
- ✅ Hydra Visuals (initHydra)
- ✅ Tidal Syntax (initTidal)
- ✅ MIDI Support
- ✅ Samples von GitHub laden
- ✅ Eigene Themes (Cyberpunk, Halloween, 8-Bit)
- ✅ Particle Effects

---

## 2. Analyse der Optionen

### Option A: @strudel/web (Aktueller Stand)
❌ **Nicht ausreichend** - Fehlende Features (CSound, Hydra, etc.)

### Option B: @strudel/repl mit strudel-editor
✅ **Vielversprechend** - Hat ALLE Features

Die Dokumentation zeigt:
```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
<strudel-editor>
<!--
code here
-->
</strudel-editor>
```

**Problem bisher:** Wir haben versucht, die globalen Funktionen zu nutzen, aber `@strudel/repl` exportiert keine. Die Lösung ist, die `<strudel-editor>` Web Component **direkt zu verwenden**.

### Option C: iframe mit strudel.cc
⚠️ **Backup-Option** - Funktioniert, aber weniger Kontrolle

---

## 3. Die Lösung: Hybrid-Architektur

### 3.1 Konzept

```
┌─────────────────────────────────────────────────────────────────┐
│                     Strudel Box Extension                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Unsere UI-Schicht                       │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   Header    │  │   Themes    │  │   Particles     │   │ │
│  │  │  (Titel)    │  │  (Switcher) │  │   (Canvas)      │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              <strudel-editor> Web Component                │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │              CodeMirror Editor (eingebaut)           │ │ │
│  │  │                                                     │ │ │
│  │  │  • Syntax Highlighting                              │ │ │
│  │  │  • Ctrl+Enter → Play                                │ │ │
│  │  │  • Ctrl+. → Stop                                    │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │              Strudel Audio Engine (eingebaut)        │ │ │
│  │  │                                                     │ │ │
│  │  │  • @strudel/core                                    │ │ │
│  │  │  • @strudel/csound ✅                               │ │ │
│  │  │  • @strudel/hydra ✅                                │ │ │
│  │  │  • @strudel/midi ✅                                 │ │ │
│  │  │  • ALLE Features ✅                                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Unsere Controls                         │ │
│  │                                                           │ │
│  │  [▶ Play] [⏹ Stop] [💾 Save]  Status: Ready              │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Vorteile dieser Architektur

1. **100% Feature-Parität** - strudel-editor hat ALLES
2. **Eigene Themes** - Wir stylen die Umgebung, nicht den Editor
3. **Eigene Controls** - Play/Stop/Save Buttons bleiben
4. **Particle Effects** - Unser Canvas bleibt
5. **Keine Wartung der Audio-Engine** - Strudel kümmert sich darum

### 3.3 Wie wir den Editor stylen

Die `<strudel-editor>` Component kann mit CSS gestylt werden:

```css
/* Container-Styling */
strudel-editor {
  --background: var(--bg-secondary);
  --foreground: var(--text-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* Theme-spezifische Anpassungen */
[data-theme="halloween"] strudel-editor {
  --background: #1a0a1a;
  --foreground: #f0e6ff;
}

[data-theme="8bit"] strudel-editor {
  --background: #000000;
  --foreground: #00ff00;
}
```

---

## 4. Implementierungsplan

### Phase 1: strudel-editor Integration

**Datei: `src/StrudelBoxPanel.ts`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="...">
  
  <!-- Strudel REPL laden (enthält ALLE Features) -->
  <script src="https://unpkg.com/@strudel/repl@latest"></script>
  
  <!-- Unsere Styles -->
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <!-- Particle Canvas (unser Feature) -->
  <canvas id="particles-canvas"></canvas>
  
  <div id="app">
    <!-- Header mit Theme Switcher (unser Feature) -->
    <header>
      <h1>🎵 Strudel Box</h1>
      <div class="theme-switcher">...</div>
    </header>
    
    <!-- Strudel Editor (ALLE Features) -->
    <div id="editor-wrapper">
      <strudel-editor id="strudel">
      <!--
      // Default Code
      note("c3 e3 g3 c4").sound("sawtooth")
      -->
      </strudel-editor>
    </div>
    
    <!-- Unsere Controls -->
    <div id="controls">
      <button id="play">▶ Play</button>
      <button id="stop">⏹ Stop</button>
      <button id="save">💾 Save</button>
      <span id="status">Ready</span>
    </div>
  </div>
  
  <script type="module" src="${scriptUri}"></script>
</body>
</html>
```

### Phase 2: JavaScript Integration

**Datei: `webview-ui/src/main.ts`**

```typescript
// strudel-editor Element referenzieren
const strudelEditor = document.getElementById('strudel') as HTMLElement & {
  // Die Web Component hat diese Methoden
  evaluate: () => Promise<void>;
  stop: () => void;
  setCode: (code: string) => void;
  getCode: () => string;
};

// Play Button
document.getElementById('play')?.addEventListener('click', async () => {
  await strudelEditor.evaluate();
  updateStatus('▶ Playing', 'playing');
});

// Stop Button
document.getElementById('stop')?.addEventListener('click', () => {
  strudelEditor.stop();
  updateStatus('⏹ Stopped', 'stopped');
});

// Save Button
document.getElementById('save')?.addEventListener('click', () => {
  const code = strudelEditor.getCode();
  postMessage('saveCode', code);
});

// Code laden (von Extension)
window.addEventListener('message', (event) => {
  if (event.data.command === 'loadCode') {
    strudelEditor.setCode(event.data.payload);
  }
});
```

### Phase 3: CSS Theming

**Datei: `webview-ui/src/styles.css`**

```css
/* strudel-editor in unsere Themes integrieren */

#editor-wrapper {
  flex: 1;
  min-height: 300px;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--bg-tertiary);
}

strudel-editor {
  display: block;
  width: 100%;
  height: 100%;
}

/* Cyberpunk Theme */
[data-theme="default"] #editor-wrapper {
  box-shadow: var(--glow-primary);
}

/* Halloween Theme */
[data-theme="halloween"] #editor-wrapper {
  box-shadow: 0 0 20px rgba(255, 102, 0, 0.3);
}

/* 8-Bit Theme */
[data-theme="8bit"] #editor-wrapper {
  border: 4px solid #00ff00;
  border-radius: 0;
}
```

---

## 5. Herausforderungen und Lösungen

### 5.1 strudel-editor API herausfinden

**Problem:** Die genaue API der Web Component ist nicht dokumentiert.

**Lösung:** 
1. Quellcode auf Codeberg prüfen
2. In Browser DevTools die Component inspizieren
3. Experimentell testen

**Mögliche API:**
```typescript
interface StrudelEditorElement extends HTMLElement {
  // Methoden (zu verifizieren)
  evaluate(): Promise<void>;
  stop(): void;
  setCode(code: string): void;
  getCode(): string;
  
  // Events (zu verifizieren)
  addEventListener('play', callback): void;
  addEventListener('stop', callback): void;
  addEventListener('error', callback): void;
}
```

### 5.2 Styling der Web Component

**Problem:** Web Components haben Shadow DOM, der CSS blockiert.

**Lösungen:**
1. CSS Custom Properties (--variable) durchreichen
2. `::part()` Selektoren verwenden
3. Wrapper-Element stylen

### 5.3 Code-Synchronisation

**Problem:** Code zwischen Extension und strudel-editor synchronisieren.

**Lösung:**
```typescript
// Beim Laden einer .strudel Datei
strudelEditor.setCode(fileContent);

// Beim Speichern
const code = strudelEditor.getCode();
vscode.postMessage({ command: 'saveCode', payload: code });
```

---

## 6. Fallback-Strategie

Falls `<strudel-editor>` nicht wie erwartet funktioniert:

### Fallback: iframe mit strudel.cc

```html
<iframe 
  id="strudel-iframe"
  src="https://strudel.cc/"
  style="width: 100%; height: 100%; border: none;"
></iframe>
```

**Kommunikation:**
```typescript
// Code in iframe laden (URL-Hash)
const encodedCode = btoa(code);
iframe.src = `https://strudel.cc/#${encodedCode}`;
```

**Nachteile:**
- Weniger Kontrolle über UI
- Abhängigkeit von externer Website
- Keine direkte API-Kommunikation

---

## 7. Zusammenfassung

### Empfohlene Lösung: strudel-editor Web Component

| Aspekt | Lösung |
|--------|--------|
| **Audio Engine** | strudel-editor (alle Features) |
| **Editor** | strudel-editor's CodeMirror |
| **Themes** | Unsere CSS um strudel-editor |
| **Particles** | Unser Canvas |
| **Controls** | Unsere Buttons |
| **File I/O** | VS Code Extension API |

### Nächste Schritte

1. **strudel-editor API testen** - Welche Methoden/Events gibt es?
2. **Prototyp bauen** - Minimale Integration testen
3. **Styling anpassen** - Themes auf strudel-editor anwenden
4. **Controls verbinden** - Play/Stop/Save mit strudel-editor
5. **File-Handling** - .strudel Dateien laden/speichern

### Erwartetes Ergebnis

Eine VS Code Extension die:
- **Alle Strudel-Features** unterstützt (CSound, Hydra, MIDI, etc.)
- **Eigene Themes** hat (Cyberpunk, Halloween, 8-Bit)
- **Particle Effects** zeigt
- **Nahtlos** mit .strudel Dateien arbeitet
- **Genauso funktioniert** wie strudel.cc
