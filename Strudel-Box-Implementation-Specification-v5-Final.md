# Strudel Box - Implementation Specification

> **"Code your beats. Visualize your sound. Share your vibe."**

> **Version**: 5.0 Final  
> **Target**: Senior Developer for autonomous implementation  
> **Goal**: VS Code Extension for Strudel live-coding music

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Project Structure](#3-project-structure)
4. [Strudel Integration & DOM Analysis](#4-strudel-integration--dom-analysis)
5. [CodeMirror 6 Setup](#5-codemirror-6-setup)
6. [Architecture](#6-architecture)
7. [Implementation Phases](#7-implementation-phases)
8. [Code Patterns & Examples](#8-code-patterns--examples)
9. [Troubleshooting](#9-troubleshooting)
10. [Quick Reference](#10-quick-reference)

---

## 1. Overview

### What is Strudel Box?

Strudel Box transforms VS Code into a live-coding music studio. It brings the power of Strudel (a JavaScript port of TidalCycles) directly into the world's most popular code editor, allowing developers and musicians to create algorithmic music without leaving their development environment.

### Why Strudel Box?

- **Seamless Integration**: No need to switch between browser and editor
- **Familiar Environment**: Use the same tools you code with daily
- **Visual Feedback**: See your music through real-time visualizations
- **Themes**: Express yourself with Default, Halloween, and 8-Bit visual styles
- **Keyboard-First**: Designed for fast iteration with keyboard shortcuts

### Target Users

- Developers curious about creative coding
- Musicians exploring algorithmic composition
- Live coders performing at events
- Educators teaching music and programming
- Anyone who wants to make music with code

---

## 2. Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Live REPL** | Write Strudel patterns and hear them instantly |
| **CodeMirror Editor** | Syntax highlighting, auto-completion, keyboard shortcuts |
| **Real-time Visualizer** | Spectrum analyzer and waveform display |
| **Theme System** | Default (Cyberpunk), Halloween, 8-Bit with CRT effect |
| **File Support** | Load and save `.strudel` pattern files |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Evaluate pattern |
| `Ctrl+.` / `Cmd+.` | Stop all audio (hush) |
| `Ctrl+S` / `Cmd+S` | Save pattern to file |

### Visualizations

| Visualization | Description |
|---------------|-------------|
| **Spectrum Bars** | Frequency spectrum with color-coded bands |
| **Waveform** | Real-time audio waveform display |
| **Theme-specific** | Halloween particles, 8-Bit pixel effects |

### Themes

| Theme | Aesthetic |
|-------|-----------|
| **Default** | Cyberpunk neon (cyan/magenta) |
| **Halloween** | Spooky orange and purple |
| **8-Bit** | Retro green with CRT scanlines |

### Commands

| Command | Description |
|---------|-------------|
| `Strudel Box: Open Player` | Open the Strudel Box panel |
| `Strudel Box: Hush` | Stop all playing patterns |
| `Strudel Box: Load File` | Load a .strudel file |
| `Strudel Box: Save` | Save current pattern |
| `Strudel Box: Set Theme` | Switch visual theme |

---

## 3. Project Structure

### Current State

The project skeleton is set up with the extension scaffolding. The `webview-ui` folder has been initialized with npm packages installed:

```
strudel_box/
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   ├── settings.json
│   └── tasks.json
├── src/
│   ├── extension.ts
│   └── StrudelBoxPanel.ts
├── webview-ui/
│   ├── src/                    # Empty - to be implemented
│   ├── package.json            # ✅ Created
│   └── node_modules/           # ✅ Installed
│       ├── @strudel/web
│       ├── codemirror
│       ├── @codemirror/lang-javascript
│       ├── vite
│       ├── typescript
│       └── @types/node
├── esbuild.js
├── package.json
├── tsconfig.json
└── README.md
```

### webview-ui/package.json (Current)

```json
{
  "name": "webview-ui",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@codemirror/lang-javascript": "^6.2.4",
    "@strudel/web": "^1.2.6",
    "codemirror": "^6.0.2"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "typescript": "^5.9.3",
    "vite": "^6.4.1"
  }
}
```

### Files to Create

```
webview-ui/
├── src/
│   ├── main.ts              # Webview entry point
│   ├── editor.ts            # CodeMirror setup
│   ├── visualizer.ts        # Audio visualization
│   ├── vscode.ts            # VS Code API wrapper
│   └── styles.css           # Styling and themes
├── index.html               # Webview HTML template
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite bundler config
```

---

## 4. Strudel Integration & DOM Analysis

### Important: Two Libraries Named "Strudel"

| Library | URL | Purpose |
|---------|-----|---------|
| **strudel.cc** | `@strudel/web` | Live-coding music (TidalCycles port) ✅ **This is what we need** |
| strudel.js.org | `strudel` | DOM component framework ❌ Do not confuse |

### What Does @strudel/web Do to the DOM?

Based on source code analysis and documentation:

**@strudel/web DOES NOT CREATE ANY DOM ELEMENTS!**

The library works exclusively with:
- Web Audio API (AudioContext, AudioWorklet)
- JavaScript pattern evaluation
- Global functions on `window`

```javascript
// What initStrudel() does:
// 1. Creates an AudioContext (no DOM)
// 2. Loads Audio Worklets (no DOM)
// 3. Registers global functions: note(), s(), evaluate(), hush(), etc.
// 4. NO canvas, NO div, NO DOM manipulation

initStrudel();
// Now available:
// - window.note()
// - window.s() / window.sound()
// - window.evaluate()
// - window.hush()
// - window.setcps()
// - window.getAudioContext()
```

### Strudel Isolation in VS Code Webview

Since Strudel doesn't create DOM elements, there are **no conflicts** with CodeMirror. However, consider these points:

#### 1. Global Functions

`initStrudel()` registers functions on `window`. In a webview, this is the isolated webview scope, not the VS Code window.

```typescript
// This is safe - webview has its own window scope
declare global {
  function initStrudel(): Promise<void>;
  function evaluate(code: string): Promise<any>;
  function hush(): void;
  function setcps(cps: number): void;
  function getAudioContext(): AudioContext;
}
```

#### 2. AudioContext Lifecycle

```typescript
// Strudel's AudioContext must be stopped on panel dispose
class StrudelEngine {
  private audioContext: AudioContext | null = null;
  
  async init() {
    await initStrudel();
    this.audioContext = getAudioContext();
  }
  
  dispose() {
    hush(); // Stop all patterns
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
```

#### 3. User Interaction Requirement

Browser autoplay policy requires user interaction for audio:

```typescript
// WRONG - will be blocked
window.onload = async () => {
  await initStrudel();
  await evaluate('s("bd")'); // ❌ No user event
};

// CORRECT - initiated by button click
document.getElementById('play')!.addEventListener('click', async () => {
  await initStrudel(); // ✅ Inside click handler
  await evaluate('s("bd")');
});
```

### Minimal Strudel Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@strudel/web@latest"></script>
</head>
<body>
  <button id="play">Play</button>
  <button id="stop">Stop</button>
  
  <script>
    document.getElementById('play').addEventListener('click', async () => {
      await initStrudel();
      await evaluate(`
        note("c3 e3 g3 c4")
          .s("piano")
          .room(0.5)
      `);
    });
    
    document.getElementById('stop').addEventListener('click', () => {
      hush();
    });
  </script>
</body>
</html>
```

---

## 5. CodeMirror 6 Setup

### Why CodeMirror 6?

| Editor | Pros | Cons |
|--------|------|------|
| `<textarea>` | Simple | No syntax highlighting, no autocomplete |
| Monaco | Full-featured | 2MB bundle, VS Code dependency |
| **CodeMirror 6** | Modular, fast, ~150KB | Learning curve |

CodeMirror 6 is the best choice because:
- Strudel REPL already uses it
- Lightweight and fast
- Excellent mobile support
- Extensible for Strudel syntax

### CodeMirror 6 Implementation

```typescript
// webview-ui/src/editor.ts
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { keymap } from '@codemirror/view';

type EvaluateCallback = (code: string) => void;

export function createEditor(
  parent: HTMLElement,
  initialCode: string,
  onEvaluate: EvaluateCallback
): EditorView {
  
  // Custom keymap for Strudel
  const strudelKeymap = keymap.of([
    {
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: (view) => {
        onEvaluate(view.state.doc.toString());
        return true;
      }
    },
    {
      key: 'Ctrl-.',
      mac: 'Cmd-.',
      run: () => {
        window.dispatchEvent(new CustomEvent('strudel-hush'));
        return true;
      }
    }
  ]);

  // Dark theme
  const darkTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      backgroundColor: 'var(--bg-secondary)'
    },
    '.cm-scroller': {
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace"
    },
    '.cm-content': {
      caretColor: 'var(--accent-primary)'
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--accent-primary)'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--accent-primary)33'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-muted)',
      border: 'none'
    }
  }, { dark: true });

  const state = EditorState.create({
    doc: initialCode,
    extensions: [
      basicSetup,
      javascript(),
      darkTheme,
      strudelKeymap
    ]
  });

  return new EditorView({
    state,
    parent
  });
}

// Get code from editor
export function getCode(editor: EditorView): string {
  return editor.state.doc.toString();
}

// Set code in editor
export function setCode(editor: EditorView, code: string): void {
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: code
    }
  });
}
```

---

## 6. Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        VS Code Extension                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Extension Host (Node.js)                 │  │
│  │                                                            │  │
│  │   extension.ts                                             │  │
│  │   ├── activate()           → Register commands             │  │
│  │   ├── strudel-box.open     → Create/show panel             │  │
│  │   ├── strudel-box.hush     → Send stop message to webview  │  │
│  │   └── strudel-box.loadFile → Load file, send to webview    │  │
│  │                                                            │  │
│  │   StrudelBoxPanel.ts                                       │  │
│  │   ├── createWebviewPanel()                                 │  │
│  │   ├── getHtmlForWebview()   → Generate HTML with CSP      │  │
│  │   └── handleMessage()        → Handle messages from webview│  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                     postMessage (JSON)                           │
│                              │                                    │
│  ┌────────────────────────────▼───────────────────────────────┐  │
│  │                      Webview (Browser)                      │  │
│  │                                                            │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │                  @strudel/web                         │ │  │
│  │   │   • initStrudel()   → Initialize audio               │ │  │
│  │   │   • evaluate(code)  → Execute pattern                │ │  │
│  │   │   • hush()          → Stop everything                │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │                  CodeMirror 6                         │ │  │
│  │   │   • Code editor with syntax highlighting             │ │  │
│  │   │   • Ctrl+Enter → evaluate()                          │ │  │
│  │   │   • Ctrl+. → hush()                                  │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │                  Visualizer                           │ │  │
│  │   │   • Canvas 2D for waveform/spectrum                  │ │  │
│  │   │   • Web Audio AnalyserNode                           │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Message Protocol

```typescript
// Extension → Webview
interface ExtensionToWebviewMessage {
  command: 'loadCode' | 'hush' | 'setTheme' | 'setVolume';
  payload?: any;
}

// Webview → Extension
interface WebviewToExtensionMessage {
  command: 'ready' | 'error' | 'saveCode' | 'log';
  payload?: any;
}
```

---

## 7. Implementation Phases

### Phase 1: Audio Foundation (Days 1-2)

**Goal**: Type code → Hear sound

**Files to create:**

**webview-ui/src/main.ts**
```typescript
import { createEditor, setCode } from './editor';
import { postMessage } from './vscode';
import './styles.css';

declare global {
  function initStrudel(): Promise<void>;
  function evaluate(code: string): Promise<any>;
  function hush(): void;
}

const DEFAULT_CODE = `// Strudel Box - Code your beats
note("c3 e3 g3 c4")
  .s("piano")
  .room(0.5)`;

let editor: any;
let isInitialized = false;

async function init() {
  const container = document.getElementById('editor')!;
  
  editor = createEditor(container, DEFAULT_CODE, async (code) => {
    await play(code);
  });
  
  document.getElementById('play')!.addEventListener('click', async () => {
    await play(editor.state.doc.toString());
  });
  
  document.getElementById('stop')!.addEventListener('click', stop);
  
  window.addEventListener('strudel-hush', stop);
  
  // Listen for messages from extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'loadCode':
        setCode(editor, message.payload);
        break;
      case 'hush':
        stop();
        break;
      case 'setTheme':
        document.documentElement.setAttribute('data-theme', message.payload);
        break;
    }
  });
  
  postMessage('ready');
}

async function play(code: string) {
  try {
    if (!isInitialized) {
      await initStrudel();
      isInitialized = true;
    }
    await evaluate(code);
    updateStatus('▶ Playing');
  } catch (err: any) {
    updateStatus(`❌ ${err.message}`);
    postMessage('error', err.message);
  }
}

function stop() {
  hush();
  updateStatus('⏹ Stopped');
}

function updateStatus(text: string) {
  document.getElementById('status')!.textContent = text;
}

init();
```

**webview-ui/index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Strudel Box</title>
  <script src="https://unpkg.com/@strudel/web@latest"></script>
</head>
<body>
  <div id="app">
    <header>
      <h1>🎵 Strudel Box</h1>
      <span class="tagline">Code your beats. Visualize your sound. Share your vibe.</span>
    </header>
    
    <main>
      <div id="editor-container">
        <div id="editor"></div>
      </div>
      
      <div id="controls">
        <button id="play" class="btn btn-play">▶ Play</button>
        <button id="stop" class="btn btn-stop">⏹ Stop</button>
        <span id="status">Ready</span>
      </div>
    </main>
  </div>
  
  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

**webview-ui/src/vscode.ts**
```typescript
interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let vscodeApi: VSCodeAPI | undefined;

export function getVSCodeAPI(): VSCodeAPI {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

export function postMessage(command: string, payload?: any) {
  getVSCodeAPI().postMessage({ command, payload });
}

export function saveState(state: any) {
  getVSCodeAPI().setState(state);
}

export function getState<T>(): T | undefined {
  return getVSCodeAPI().getState();
}
```

**webview-ui/src/styles.css**
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --text-primary: #ffffff;
  --text-muted: #666680;
  --accent-primary: #00ffff;
  --accent-secondary: #ff00ff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
}

header {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

header h1 {
  font-size: 24px;
  font-weight: 600;
}

.tagline {
  color: var(--text-muted);
  font-size: 14px;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

#editor-container {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bg-secondary);
}

#editor {
  height: 100%;
}

#controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-play {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.btn-play:hover {
  filter: brightness(1.1);
}

.btn-stop {
  background: var(--accent-secondary);
  color: white;
}

.btn-stop:hover {
  filter: brightness(1.1);
}

#status {
  color: var(--text-muted);
  font-size: 14px;
  margin-left: auto;
}

/* Halloween Theme */
[data-theme="halloween"] {
  --bg-primary: #1a0a1a;
  --bg-secondary: #2a1a2a;
  --accent-primary: #ff6600;
  --accent-secondary: #8b00ff;
}

/* 8-Bit Theme */
[data-theme="8bit"] {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --accent-primary: #00ff00;
  --accent-secondary: #ff0000;
}
```

**webview-ui/vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  optimizeDeps: {
    exclude: ['@strudel/web']
  }
});
```

**webview-ui/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": false,
    "declarationMap": false,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Checkpoint ✓**
- [ ] CodeMirror editor appears with syntax highlighting
- [ ] Play button starts audio
- [ ] Stop button stops audio
- [ ] Ctrl+Enter evaluates code
- [ ] Ctrl+. stops audio

---

### Phase 2: Extension-Webview Communication (Days 3-4)

**Goal**: Load files, extension commands work

**src/StrudelBoxPanel.ts**
```typescript
import * as vscode from 'vscode';

export class StrudelBoxPanel {
  public static currentPanel: StrudelBoxPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlForWebview(extensionUri);
    
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'ready':
            console.log('Strudel Box webview ready');
            break;
          case 'error':
            vscode.window.showErrorMessage(`Strudel Box: ${message.payload}`);
            break;
          case 'saveCode':
            await this._saveCode(message.payload);
            break;
        }
      },
      null,
      this._disposables
    );
    
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'strudel-box',
      'Strudel Box',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
        ]
      }
    );

    StrudelBoxPanel.currentPanel = new StrudelBoxPanel(panel, extensionUri);
  }

  public sendMessage(command: string, payload?: any) {
    this._panel.webview.postMessage({ command, payload });
  }

  public loadCode(code: string) {
    this.sendMessage('loadCode', code);
  }

  public hush() {
    this.sendMessage('hush');
  }

  public setTheme(theme: string) {
    this.sendMessage('setTheme', theme);
  }

  private async _saveCode(code: string) {
    const uri = await vscode.window.showSaveDialog({
      filters: { 'Strudel': ['strudel'] }
    });
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
      vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
    }
  }

  private _getHtmlForWebview(extensionUri: vscode.Uri): string {
    const webviewUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
    );
    
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        script-src 'nonce-${nonce}' https://unpkg.com;
        style-src ${this._panel.webview.cspSource} 'unsafe-inline';
        font-src ${this._panel.webview.cspSource} https://fonts.gstatic.com;
        img-src ${this._panel.webview.cspSource} https: data:;
        connect-src https://unpkg.com https://cdn.jsdelivr.net https://raw.githubusercontent.com https://*.strudel.cc;
        media-src https: blob:;
        worker-src blob:;
      ">
      <title>Strudel Box</title>
      <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
      <link rel="stylesheet" href="${webviewUri}/style.css">
    </head>
    <body>
      <div id="app"></div>
      <script nonce="${nonce}" type="module" src="${webviewUri}/main.js"></script>
    </body>
    </html>`;
  }

  public dispose() {
    StrudelBoxPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
```

**Checkpoint ✓**
- [ ] "Strudel Box: Hush" command stops audio
- [ ] "Strudel Box: Load File" loads .strudel files
- [ ] "Strudel Box: Save" saves code

---

### Phase 3: Visualizations (Days 5-7)

**Goal**: Display audio visually

**webview-ui/src/visualizer.ts**
```typescript
export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private animationId: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  connect(audioContext: AudioContext) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }
  
  start() {
    this.draw();
  }
  
  stop() {
    cancelAnimationFrame(this.animationId);
  }
  
  private draw() {
    if (!this.analyser) {
      this.animationId = requestAnimationFrame(() => this.draw());
      return;
    }
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    const { width, height } = this.canvas;
    
    // Clear with theme background
    this.ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary').trim() || '#0a0a0f';
    this.ctx.fillRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      
      // Color gradient based on frequency
      const hue = (i / bufferLength) * 180 + 180;
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    
    this.animationId = requestAnimationFrame(() => this.draw());
  }
  
  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * dpr;
    this.canvas.height = this.canvas.offsetHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }
}
```

**Checkpoint ✓**
- [ ] Spectrum bars react to audio
- [ ] Waveform visualization works
- [ ] 60fps performance

---

### Phase 4: Themes (Days 8-10)

**Goal**: Default, Halloween, 8-Bit themes

Add theme-specific styles and CRT effect for 8-Bit:

```css
/* 8-Bit CRT Effect */
[data-theme="8bit"] #visualizer {
  position: relative;
  image-rendering: pixelated;
}

[data-theme="8bit"] #visualizer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}

/* Halloween particles */
[data-theme="halloween"] {
  --glow-color: #ff6600;
}
```

**Checkpoint ✓**
- [ ] Theme switcher works
- [ ] Halloween theme with orange/purple palette
- [ ] 8-Bit theme with CRT effect

---

### Phase 5: Polish & Release (Days 11-14)

**Goal**: Production ready

- [ ] Complete error handling
- [ ] Performance optimization
- [ ] Write README.md
- [ ] Create screenshots
- [ ] `vsce package` creates .vsix
- [ ] Publish to VS Code Marketplace

---

## 8. Code Patterns & Examples

### Update webview-ui/package.json Scripts

```json
{
  "name": "webview-ui",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@codemirror/lang-javascript": "^6.2.4",
    "@strudel/web": "^1.2.6",
    "codemirror": "^6.0.2"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "typescript": "^5.9.3",
    "vite": "^6.4.1"
  }
}
```

---

## 9. Troubleshooting

### Problem: No Audio

| Symptom | Cause | Solution |
|---------|-------|----------|
| Silence, no errors | Autoplay policy | Audio must be started by user click |
| CSP error | Missing CSP rule | Add `media-src blob:; worker-src blob:;` |
| "AudioContext not allowed" | No user event | Move `initStrudel()` to click handler |

### Problem: Webview Shows Nothing

1. Open DevTools: `Ctrl+Shift+I`
2. Check console for errors
3. Network tab: Are assets loading?
4. Check `localResourceRoots`

### Problem: CodeMirror Not Appearing

```typescript
const container = document.getElementById('editor');
if (!container) {
  console.error('Editor container not found!');
  return;
}
console.log('Container dimensions:', container.offsetWidth, container.offsetHeight);
```

### CSP Template

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  script-src 'nonce-${nonce}' https://unpkg.com;
  style-src ${webview.cspSource} 'unsafe-inline';
  font-src ${webview.cspSource} https://fonts.gstatic.com;
  img-src ${webview.cspSource} https: data:;
  connect-src https://unpkg.com https://cdn.jsdelivr.net https://raw.githubusercontent.com https://*.strudel.cc;
  media-src https: blob:;
  worker-src blob:;
">
```

---

## 10. Quick Reference

### Important Shortcuts

| Action | Shortcut |
|--------|----------|
| Start extension | `F5` |
| Window reload (test window) | `Ctrl+R` / `Cmd+R` |
| Webview DevTools | `Ctrl+Shift+P` → "Open Webview Developer Tools" |
| Stop debugging | `Shift+F5` |

### Strudel Quick Reference

```javascript
// Sounds
s("bd sd hh cp")        // Drums
note("c e g b")         // Notes
sound("piano")          // Instrument

// Modifiers
.fast(2)                // Double speed
.slow(2)                // Half speed
.rev()                  // Reverse
.jux(rev)               // Left normal, right reversed

// Effects
.room(0.5)              // Reverb
.delay(0.25)            // Delay
.lpf(1000)              // Low pass filter

// Control
hush()                  // Stop all
setcps(0.5)             // Tempo (cycles per second)
```

### Files to Create (Summary)

```
webview-ui/
├── src/
│   ├── main.ts          ← Webview entry point
│   ├── editor.ts        ← CodeMirror setup
│   ├── visualizer.ts    ← Audio visualization
│   ├── vscode.ts        ← VS Code API wrapper
│   └── styles.css       ← Styling and themes
├── index.html           ← Webview HTML template
├── tsconfig.json        ← TypeScript config
└── vite.config.ts       ← Vite bundler config
```

---

*Document Version: 5.0 Final*  
*Project: Strudel Box - VS Code Extension for Live-Coding Music*  
*Slogan: "Code your beats. Visualize your sound. Share your vibe."*
