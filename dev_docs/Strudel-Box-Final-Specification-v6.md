# Strudel Box - Final Implementation Specification

> **"Code your beats. Visualize your sound. Share your vibe."**

> **Version**: 6.0 Final  
> **Technology**: `@strudel/repl` Web Component  
> **Target**: Senior Developer for autonomous implementation

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Technical Architecture](#2-technical-architecture)
3. [Project Structure](#3-project-structure)
4. [Core Implementation](#4-core-implementation)
5. [Extension-Webview Communication](#5-extension-webview-communication)
6. [Styling & Theming](#6-styling--theming)
7. [Visualizer Integration](#7-visualizer-integration)
8. [CSP & Network Requirements](#8-csp--network-requirements)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing & Debugging](#10-testing--debugging)
11. [Production Checklist](#11-production-checklist)

---

## 1. Vision & Goals

### What We're Building

**Strudel Box** is a VS Code extension that transforms the editor into a live-coding music studio. It embeds the full Strudel REPL (the same technology powering strudel.cc) directly in VS Code, enabling developers to:

- Write algorithmic music patterns in JavaScript
- Hear changes instantly with zero-latency feedback
- See real-time audio visualizations
- Save and load `.strudel` pattern files
- Work with a professional-grade, battle-tested audio engine

### Why @strudel/repl?

| Requirement | @strudel/web | @strudel/repl |
|-------------|--------------|---------------|
| Samples prebaked | ❌ Manual loading | ✅ Out of the box |
| CodeMirror editor | ❌ Build yourself | ✅ Included |
| Syntax highlighting | ❌ Build yourself | ✅ Strudel-specific |
| Event highlighting | ❌ Not possible | ✅ Shows active sounds |
| Mini-notation support | ⚠️ Via evaluate() | ✅ Native |
| Transpiler included | ⚠️ Manual setup | ✅ Built-in |
| Version pinning | ✅ Yes | ✅ Yes |
| Maintenance burden | High | Low |

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Live REPL** | Full Strudel editor with syntax highlighting | P0 |
| **Instant Audio** | Web Audio with prebaked samples | P0 |
| **Event Highlighting** | Visual feedback on active sounds | P0 |
| **File Integration** | Load/save .strudel files | P1 |
| **Visualizer** | Spectrum analyzer (separate canvas) | P1 |
| **Theme Support** | Match VS Code theme | P2 |

---

## 2. Technical Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VS Code Extension                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Extension Host (Node.js)                    │ │
│  │                                                                │ │
│  │   src/extension.ts                                             │ │
│  │   ├── activate()                                               │ │
│  │   ├── strudel-box.open        → Create/show panel              │ │
│  │   ├── strudel-box.hush        → Send stop to webview           │ │
│  │   ├── strudel-box.loadFile    → Read file, send to webview     │ │
│  │   └── strudel-box.save        → Get code, write file           │ │
│  │                                                                │ │
│  │   src/StrudelBoxPanel.ts                                       │ │
│  │   ├── createWebviewPanel()                                     │ │
│  │   ├── getHtmlForWebview()     → CSP, scripts, styles           │ │
│  │   └── message handlers                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                     postMessage (JSON)                              │
│                              │                                      │
│  ┌───────────────────────────▼───────────────────────────────────┐ │
│  │                      Webview (Browser)                         │ │
│  │                                                                │ │
│  │   ┌────────────────────────────────────────────────────────┐  │ │
│  │   │              <strudel-editor> Web Component             │  │ │
│  │   │                                                        │  │ │
│  │   │   ┌──────────────────────────────────────────────────┐ │  │ │
│  │   │   │              CodeMirror 6 Editor                 │ │  │ │
│  │   │   │  • Strudel syntax highlighting                   │ │  │ │
│  │   │   │  • Mini-notation support ("bd sd hh")            │ │  │ │
│  │   │   │  • Event highlighting (shows active sounds)      │ │  │ │
│  │   │   │  • Ctrl+Enter to evaluate                        │ │  │ │
│  │   │   └──────────────────────────────────────────────────┘ │  │ │
│  │   │                                                        │  │ │
│  │   │   ┌──────────────────────────────────────────────────┐ │  │ │
│  │   │   │              Audio Engine (superdough)           │ │  │ │
│  │   │   │  • Web Audio API                                 │ │  │ │
│  │   │   │  • Prebaked samples (drums, instruments)         │ │  │ │
│  │   │   │  • Synthesizers (sine, saw, square, etc.)        │ │  │ │
│  │   │   │  • Effects (reverb, delay, filters)              │ │  │ │
│  │   │   └──────────────────────────────────────────────────┘ │  │ │
│  │   └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │   ┌────────────────────────────────────────────────────────┐  │ │
│  │   │              Custom Visualizer (Canvas)                 │  │ │
│  │   │  • Spectrum analyzer                                   │  │ │
│  │   │  • Connected to Web Audio AnalyserNode                 │  │ │
│  │   └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │   ┌────────────────────────────────────────────────────────┐  │ │
│  │   │              VS Code Bridge (main.ts)                   │  │ │
│  │   │  • postMessage communication                           │  │ │
│  │   │  • State persistence                                   │  │ │
│  │   └────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Extension** | TypeScript, VS Code API | ^1.85.0 |
| **Bundler (Extension)** | esbuild | ^0.20.0 |
| **Webview** | HTML, TypeScript | - |
| **Bundler (Webview)** | Vite | ^6.4.1 |
| **REPL Component** | @strudel/repl | ^1.1.0 (pinned) |
| **Audio Engine** | superdough (via @strudel/repl) | - |
| **Editor** | CodeMirror 6 (via @strudel/repl) | - |

---

## 3. Project Structure

### Current State

```
strudel_box/
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   ├── settings.json
│   └── tasks.json
├── src/
│   ├── extension.ts              # Extension entry point
│   └── StrudelBoxPanel.ts        # Webview panel management
├── webview-ui/
│   ├── src/
│   │   ├── main.ts               # ← TO CREATE
│   │   ├── visualizer.ts         # ← TO CREATE
│   │   └── styles.css            # ← TO CREATE
│   ├── index.html                # ← TO CREATE
│   ├── vite.config.ts            # ← TO CREATE
│   ├── tsconfig.json             # ← TO CREATE
│   ├── package.json              # ✅ EXISTS (update scripts)
│   └── node_modules/             # ✅ EXISTS
├── package.json                  # Extension manifest
├── tsconfig.json
├── esbuild.js
└── README.md
```

### Files to Create/Update

| File | Action | Purpose |
|------|--------|---------|
| `webview-ui/index.html` | Create | Webview HTML with strudel-editor |
| `webview-ui/src/main.ts` | Create | VS Code bridge, event handlers |
| `webview-ui/src/visualizer.ts` | Create | Canvas-based spectrum analyzer |
| `webview-ui/src/styles.css` | Create | Styling and theme overrides |
| `webview-ui/vite.config.ts` | Create | Vite bundler configuration |
| `webview-ui/tsconfig.json` | Create | TypeScript config for webview |
| `webview-ui/package.json` | Update | Add scripts, type: module |
| `src/StrudelBoxPanel.ts` | Create | Panel management class |
| `src/extension.ts` | Update | Register commands |

---

## 4. Core Implementation

### 4.1 webview-ui/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="{{CSP}}">
  <title>Strudel Box</title>
  
  <!-- Strudel REPL - Pinned Version for Stability -->
  <script src="https://unpkg.com/@strudel/repl@1.1.0"></script>
  
  <link rel="stylesheet" href="{{styleUri}}">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header id="header">
      <h1>🎵 Strudel Box</h1>
      <span class="tagline">Code your beats. Visualize your sound. Share your vibe.</span>
      <div class="controls">
        <span id="status">Ready</span>
      </div>
    </header>
    
    <!-- Main Content -->
    <main id="main">
      <!-- Strudel Editor -->
      <div id="editor-container">
        <strudel-editor id="strudel-repl">
        <!--
// Welcome to Strudel Box!
// Press Ctrl+Enter to play, Ctrl+. to stop

s("bd sd:1 [~ bd] sd:2")
  .bank("RolandTR909")
  .room(0.5)
        -->
        </strudel-editor>
      </div>
      
      <!-- Visualizer -->
      <div id="visualizer-container">
        <canvas id="visualizer"></canvas>
      </div>
    </main>
  </div>
  
  <script type="module" src="{{scriptUri}}"></script>
</body>
</html>
```

### 4.2 webview-ui/src/main.ts

```typescript
import { Visualizer } from './visualizer';
import './styles.css';

// =============================================================================
// Type Definitions
// =============================================================================

interface StrudelMirror {
  setCode(code: string): void;
  getCode(): string;
  evaluate(): Promise<void>;
  start(): void;
  stop(): void;
  // Internal access to audio context
  repl?: {
    scheduler?: {
      audioContext?: AudioContext;
    };
  };
}

interface StrudelEditorElement extends HTMLElement {
  editor: StrudelMirror;
}

interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

// =============================================================================
// Global State
// =============================================================================

let strudelEditor: StrudelEditorElement | null = null;
let visualizer: Visualizer | null = null;
const vscode = acquireVsCodeApi();

// =============================================================================
// Status Updates
// =============================================================================

function updateStatus(text: string, type: 'ready' | 'playing' | 'stopped' | 'error' = 'ready') {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = `status-${type}`;
  }
}

// =============================================================================
// Strudel REPL Integration
// =============================================================================

async function initStrudelEditor(): Promise<void> {
  // Wait for custom element to be defined
  await customElements.whenDefined('strudel-editor');
  
  strudelEditor = document.getElementById('strudel-repl') as StrudelEditorElement;
  
  if (!strudelEditor) {
    console.error('Strudel editor element not found');
    updateStatus('Error: Editor not found', 'error');
    return;
  }
  
  // Wait a tick for the editor to fully initialize
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Strudel Editor initialized:', strudelEditor.editor);
  updateStatus('Ready - Press Ctrl+Enter to play', 'ready');
  
  // Restore state if available
  const savedState = vscode.getState();
  if (savedState?.code) {
    strudelEditor.editor.setCode(savedState.code);
  }
  
  // Notify extension that we're ready
  vscode.postMessage({ command: 'ready' });
}

// =============================================================================
// Visualizer Integration
// =============================================================================

function initVisualizer(): void {
  const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
  if (!canvas) {
    console.warn('Visualizer canvas not found');
    return;
  }
  
  visualizer = new Visualizer(canvas);
  visualizer.start();
}

/**
 * Connect visualizer to Strudel's AudioContext
 * Must be called after audio starts (due to autoplay policy)
 */
function connectVisualizerToAudio(): void {
  if (!visualizer || !strudelEditor?.editor) return;
  
  try {
    // Access the audio context from Strudel's internals
    // This path may vary depending on @strudel/repl version
    const audioContext = (window as any).getAudioContext?.();
    
    if (audioContext) {
      visualizer.connect(audioContext);
      console.log('Visualizer connected to AudioContext');
    }
  } catch (err) {
    console.warn('Could not connect visualizer to audio:', err);
  }
}

// =============================================================================
// VS Code Communication
// =============================================================================

function setupVSCodeBridge(): void {
  window.addEventListener('message', (event) => {
    const message = event.data;
    
    switch (message.command) {
      case 'loadCode':
        if (strudelEditor?.editor) {
          strudelEditor.editor.setCode(message.payload);
          saveState();
        }
        break;
        
      case 'evaluate':
        if (strudelEditor?.editor) {
          strudelEditor.editor.evaluate();
          updateStatus('▶ Playing', 'playing');
          connectVisualizerToAudio();
        }
        break;
        
      case 'stop':
      case 'hush':
        if (strudelEditor?.editor) {
          strudelEditor.editor.stop();
          updateStatus('⏹ Stopped', 'stopped');
        }
        break;
        
      case 'getCode':
        if (strudelEditor?.editor) {
          vscode.postMessage({
            command: 'codeResponse',
            payload: strudelEditor.editor.getCode()
          });
        }
        break;
        
      case 'setTheme':
        document.documentElement.setAttribute('data-theme', message.payload);
        break;
    }
  });
}

// =============================================================================
// State Persistence
// =============================================================================

function saveState(): void {
  if (strudelEditor?.editor) {
    vscode.setState({
      code: strudelEditor.editor.getCode()
    });
  }
}

// Save state periodically
setInterval(saveState, 5000);

// =============================================================================
// Keyboard Shortcuts (Global)
// =============================================================================

function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Ctrl+. or Cmd+. to stop (hush)
    if ((e.ctrlKey || e.metaKey) && e.key === '.') {
      e.preventDefault();
      if (strudelEditor?.editor) {
        strudelEditor.editor.stop();
        updateStatus('⏹ Stopped', 'stopped');
      }
    }
  });
}

// =============================================================================
// Initialization
// =============================================================================

async function init(): Promise<void> {
  console.log('Strudel Box initializing...');
  
  setupVSCodeBridge();
  setupKeyboardShortcuts();
  initVisualizer();
  
  await initStrudelEditor();
  
  console.log('Strudel Box initialized successfully');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

### 4.3 webview-ui/src/visualizer.ts

```typescript
/**
 * Audio Visualizer using Web Audio AnalyserNode
 */
export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private animationId: number = 0;
  private dataArray: Uint8Array | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }
  
  /**
   * Connect to an AudioContext to visualize its output
   */
  connect(audioContext: AudioContext): void {
    // Create analyser node
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Connect to destination (we're tapping into the output)
    // Note: Strudel might have its own routing, this is a basic implementation
    try {
      // Try to connect to the main output
      const destination = audioContext.destination;
      
      // Create a gain node to tap the audio without affecting output
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(destination);
      gainNode.connect(this.analyser);
    } catch (err) {
      console.warn('Could not connect analyser to audio graph:', err);
    }
    
    // Prepare data array
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }
  
  /**
   * Start the visualization loop
   */
  start(): void {
    this.draw();
  }
  
  /**
   * Stop the visualization loop
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }
  
  /**
   * Main draw loop
   */
  private draw = (): void => {
    this.animationId = requestAnimationFrame(this.draw);
    
    const { width, height } = this.canvas;
    
    // Get theme colors
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--visualizer-bg').trim() || '#0a0a0f';
    const barColor = styles.getPropertyValue('--visualizer-bar').trim() || '#00ffff';
    
    // Clear canvas
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);
    
    // If no analyser connected, draw placeholder
    if (!this.analyser || !this.dataArray) {
      this.drawPlaceholder(width, height);
      return;
    }
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Draw bars
    const bufferLength = this.analyser.frequencyBinCount;
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * height;
      
      // Color based on frequency
      const hue = (i / bufferLength) * 180 + 180; // Cyan to magenta
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  
  /**
   * Draw a placeholder when no audio is connected
   */
  private drawPlaceholder(width: number, height: number): void {
    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue('--text-muted').trim() || '#666';
    
    this.ctx.fillStyle = mutedColor;
    this.ctx.font = '14px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('▶ Play to see visualizer', width / 2, height / 2);
  }
  
  /**
   * Handle canvas resize
   */
  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
  }
}
```

### 4.4 webview-ui/src/styles.css

```css
/* ==========================================================================
   CSS Variables (Theme System)
   ========================================================================== */

:root {
  /* Default Theme: Cyberpunk */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #666680;
  --accent-primary: #00ffff;
  --accent-secondary: #ff00ff;
  --border-color: #2a2a3a;
  
  /* Visualizer */
  --visualizer-bg: #0a0a0f;
  --visualizer-bar: #00ffff;
  
  /* Status Colors */
  --status-ready: #888888;
  --status-playing: #00ff88;
  --status-stopped: #ff8800;
  --status-error: #ff4444;
}

/* Halloween Theme */
[data-theme="halloween"] {
  --bg-primary: #1a0a1a;
  --bg-secondary: #2a1a2a;
  --bg-tertiary: #3a2a3a;
  --accent-primary: #ff6600;
  --accent-secondary: #8b00ff;
  --visualizer-bar: #ff6600;
}

/* 8-Bit Theme */
[data-theme="8bit"] {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #141414;
  --accent-primary: #00ff00;
  --accent-secondary: #ff0000;
  --visualizer-bar: #00ff00;
}

/* ==========================================================================
   Reset & Base
   ========================================================================== */

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* ==========================================================================
   Layout
   ========================================================================== */

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 12px;
  gap: 12px;
}

#header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

#header h1 {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

#header .tagline {
  color: var(--text-muted);
  font-size: 13px;
  flex: 1;
}

#header .controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

#main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* ==========================================================================
   Strudel Editor Container
   ========================================================================== */

#editor-container {
  flex: 1;
  min-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

/* Style the strudel-editor web component */
strudel-editor {
  display: block;
  height: 100%;
  width: 100%;
}

/* Override strudel-editor internal styles if possible */
strudel-editor::part(container) {
  background: var(--bg-secondary);
}

/* Target CodeMirror inside strudel-editor */
#editor-container .cm-editor {
  height: 100%;
  font-size: 14px;
  background: var(--bg-secondary);
}

#editor-container .cm-scroller {
  font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
}

#editor-container .cm-gutters {
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
}

/* ==========================================================================
   Visualizer
   ========================================================================== */

#visualizer-container {
  height: 80px;
  min-height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

#visualizer {
  display: block;
  width: 100%;
  height: 100%;
}

/* 8-Bit CRT Effect */
[data-theme="8bit"] #visualizer {
  image-rendering: pixelated;
}

[data-theme="8bit"] #visualizer-container::after {
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

/* ==========================================================================
   Status Indicator
   ========================================================================== */

#status {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  transition: all 0.2s ease;
}

.status-ready {
  color: var(--status-ready);
}

.status-playing {
  color: var(--status-playing);
  animation: pulse 1.5s infinite;
}

.status-stopped {
  color: var(--status-stopped);
}

.status-error {
  color: var(--status-error);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ==========================================================================
   Scrollbar Styling
   ========================================================================== */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ==========================================================================
   Responsive
   ========================================================================== */

@media (max-height: 400px) {
  #visualizer-container {
    height: 50px;
    min-height: 50px;
  }
  
  #header .tagline {
    display: none;
  }
}
```

### 4.5 webview-ui/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Don't minify for easier debugging
    minify: false,
    sourcemap: true
  },
  // Exclude strudel from optimization (loaded via CDN)
  optimizeDeps: {
    exclude: ['@strudel/repl', '@strudel/web']
  }
});
```

### 4.6 webview-ui/tsconfig.json

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
    "sourceMap": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.7 webview-ui/package.json (Updated)

```json
{
  "name": "webview-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "preview": "vite preview"
  },
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

> **Note**: @strudel/repl is loaded via CDN in index.html, not via npm.

---

## 5. Extension-Webview Communication

### 5.1 src/StrudelBoxPanel.ts

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export class StrudelBoxPanel {
  public static currentPanel: StrudelBoxPanel | undefined;
  
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    
    // Set HTML content
    this._panel.webview.html = this._getHtmlForWebview();
    
    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      this._handleMessage,
      this,
      this._disposables
    );
    
    // Handle panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    // If panel already exists, reveal it
    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      'strudel-box',
      'Strudel Box',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true, // CRITICAL: Keep audio running when tab is hidden
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
        ]
      }
    );

    StrudelBoxPanel.currentPanel = new StrudelBoxPanel(panel, extensionUri);
  }

  // =========================================================================
  // Public Methods (called by extension commands)
  // =========================================================================

  public sendMessage(command: string, payload?: any): void {
    this._panel.webview.postMessage({ command, payload });
  }

  public loadCode(code: string): void {
    this.sendMessage('loadCode', code);
  }

  public hush(): void {
    this.sendMessage('hush');
  }

  public setTheme(theme: string): void {
    this.sendMessage('setTheme', theme);
  }

  public async getCode(): Promise<string> {
    return new Promise((resolve) => {
      const handler = this._panel.webview.onDidReceiveMessage((message) => {
        if (message.command === 'codeResponse') {
          handler.dispose();
          resolve(message.payload);
        }
      });
      this.sendMessage('getCode');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        handler.dispose();
        resolve('');
      }, 5000);
    });
  }

  // =========================================================================
  // Message Handling
  // =========================================================================

  private async _handleMessage(message: any): Promise<void> {
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
        
      case 'log':
        console.log('[Webview]', message.payload);
        break;
    }
  }

  private async _saveCode(code: string): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      filters: { 'Strudel Pattern': ['strudel', 'js'] },
      defaultUri: vscode.Uri.file('pattern.strudel')
    });
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
      vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
    }
  }

  // =========================================================================
  // HTML Generation
  // =========================================================================

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const distUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
    
    // Get URIs for resources
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'style.css'));
    
    // Generate nonce for CSP
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}' https://unpkg.com https://cdn.jsdelivr.net;
    style-src ${webview.cspSource} 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
    font-src ${webview.cspSource} https://fonts.gstatic.com https://unpkg.com;
    img-src ${webview.cspSource} https: data: blob:;
    connect-src 
      https://unpkg.com 
      https://cdn.jsdelivr.net 
      https://raw.githubusercontent.com 
      https://*.strudel.cc 
      https://strudel.cc
      https://freesound.org
      https://*.freesound.org
      https://sampleswap.org;
    media-src https: blob: data:;
    worker-src blob:;
  ">
  <title>Strudel Box</title>
  
  <!-- Strudel REPL - Pinned Version -->
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/repl@1.1.0"></script>
  
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>🎵 Strudel Box</h1>
      <span class="tagline">Code your beats. Visualize your sound. Share your vibe.</span>
      <div class="controls">
        <span id="status">Ready</span>
      </div>
    </header>
    
    <main id="main">
      <div id="editor-container">
        <strudel-editor id="strudel-repl">
        <!--
// Welcome to Strudel Box!
// Press Ctrl+Enter to play, Ctrl+. to stop

s("bd sd:1 [~ bd] sd:2")
  .bank("RolandTR909")
  .room(0.5)
        -->
        </strudel-editor>
      </div>
      
      <div id="visualizer-container">
        <canvas id="visualizer"></canvas>
      </div>
    </main>
  </div>
  
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  // =========================================================================
  // Disposal
  // =========================================================================

  public dispose(): void {
    StrudelBoxPanel.currentPanel = undefined;
    this._panel.dispose();
    
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
```

### 5.2 src/extension.ts

```typescript
import * as vscode from 'vscode';
import { StrudelBoxPanel } from './StrudelBoxPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('Strudel Box extension activated');

  // Command: Open Strudel Box
  const openCommand = vscode.commands.registerCommand('strudel-box.open', () => {
    StrudelBoxPanel.createOrShow(context.extensionUri);
  });

  // Command: Stop all sounds (Hush)
  const hushCommand = vscode.commands.registerCommand('strudel-box.hush', () => {
    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.hush();
    }
  });

  // Command: Load file
  const loadCommand = vscode.commands.registerCommand('strudel-box.load', async () => {
    const uri = await vscode.window.showOpenDialog({
      filters: { 'Strudel Pattern': ['strudel', 'js'] },
      canSelectMany: false
    });
    
    if (uri && uri[0] && StrudelBoxPanel.currentPanel) {
      const content = await vscode.workspace.fs.readFile(uri[0]);
      const code = Buffer.from(content).toString('utf-8');
      StrudelBoxPanel.currentPanel.loadCode(code);
    }
  });

  // Command: Save current pattern
  const saveCommand = vscode.commands.registerCommand('strudel-box.save', async () => {
    if (StrudelBoxPanel.currentPanel) {
      const code = await StrudelBoxPanel.currentPanel.getCode();
      
      const uri = await vscode.window.showSaveDialog({
        filters: { 'Strudel Pattern': ['strudel', 'js'] }
      });
      
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
        vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
      }
    }
  });

  // Command: Set theme
  const themeCommand = vscode.commands.registerCommand('strudel-box.setTheme', async () => {
    const themes = ['default', 'halloween', '8bit'];
    const selected = await vscode.window.showQuickPick(themes, {
      placeHolder: 'Select a theme'
    });
    
    if (selected && StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.setTheme(selected);
    }
  });

  context.subscriptions.push(
    openCommand,
    hushCommand,
    loadCommand,
    saveCommand,
    themeCommand
  );
}

export function deactivate() {
  console.log('Strudel Box extension deactivated');
}
```

---

## 6. Styling & Theming

### VS Code Theme Integration

The extension uses CSS variables that can be mapped to VS Code's theme:

```css
/* Future enhancement: Map to VS Code colors */
:root {
  --bg-primary: var(--vscode-editor-background, #0a0a0f);
  --bg-secondary: var(--vscode-sideBar-background, #12121a);
  --text-primary: var(--vscode-editor-foreground, #ffffff);
  --accent-primary: var(--vscode-focusBorder, #00ffff);
}
```

### Theme Switching

```typescript
// Extension side
StrudelBoxPanel.currentPanel.setTheme('halloween');

// Webview side (in message handler)
document.documentElement.setAttribute('data-theme', 'halloween');
```

---

## 7. Visualizer Integration

### Connecting to Strudel's Audio

The visualizer connects to Strudel's internal AudioContext:

```typescript
// After audio starts playing
const audioContext = (window as any).getAudioContext?.();
if (audioContext) {
  visualizer.connect(audioContext);
}
```

### Note on Audio Access

Strudel may expose `getAudioContext()` globally, but this depends on version.
Alternative approach:

```typescript
// Listen for audio start event (if available)
window.addEventListener('strudel-start', () => {
  connectVisualizerToAudio();
});
```

---

## 8. CSP & Network Requirements

### Content Security Policy

```
default-src 'none';
script-src 'nonce-${nonce}' https://unpkg.com https://cdn.jsdelivr.net;
style-src ${webview.cspSource} 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
font-src ${webview.cspSource} https://fonts.gstatic.com https://unpkg.com;
img-src ${webview.cspSource} https: data: blob:;
connect-src 
  https://unpkg.com 
  https://cdn.jsdelivr.net 
  https://raw.githubusercontent.com 
  https://*.strudel.cc 
  https://strudel.cc
  https://freesound.org
  https://*.freesound.org
  https://sampleswap.org;
media-src https: blob: data:;
worker-src blob:;
```

### Required Domains

| Domain | Purpose |
|--------|---------|
| `unpkg.com` | @strudel/repl package |
| `cdn.jsdelivr.net` | Alternative CDN |
| `raw.githubusercontent.com` | Sample files from GitHub |
| `*.strudel.cc` | Strudel assets and samples |
| `freesound.org` | Some sample sources |
| `sampleswap.org` | Additional samples |

---

## 9. Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Goal**: Strudel REPL working in webview

- [ ] Create `webview-ui/index.html` with `<strudel-editor>`
- [ ] Create `webview-ui/src/main.ts` with VS Code bridge
- [ ] Create `webview-ui/src/styles.css`
- [ ] Update `webview-ui/vite.config.ts`
- [ ] Create `src/StrudelBoxPanel.ts`
- [ ] Update `src/extension.ts` with commands
- [ ] Test: Audio plays when pressing Ctrl+Enter

**Checkpoint ✓**
```
[ ] Extension opens panel
[ ] Strudel editor appears
[ ] Code can be typed
[ ] Ctrl+Enter plays audio
[ ] Ctrl+. stops audio
```

### Phase 2: Communication (Days 3-4)

**Goal**: Extension ↔ Webview messaging works

- [ ] Implement `loadCode` message
- [ ] Implement `hush` message
- [ ] Implement `getCode` for saving
- [ ] Add file load/save commands
- [ ] State persistence with `vscode.getState()`

**Checkpoint ✓**
```
[ ] "Strudel Box: Load" opens file picker
[ ] "Strudel Box: Save" saves current code
[ ] "Strudel Box: Hush" stops audio
[ ] Code persists when panel is hidden/shown
```

### Phase 3: Visualizer (Days 5-6)

**Goal**: Spectrum analyzer shows audio

- [ ] Create `visualizer.ts`
- [ ] Connect to AudioContext
- [ ] Draw spectrum bars
- [ ] Handle resize
- [ ] Add placeholder when no audio

**Checkpoint ✓**
```
[ ] Visualizer canvas visible
[ ] Shows "Play to see visualizer" when stopped
[ ] Bars animate when playing
[ ] Responsive to window resize
```

### Phase 4: Theming (Days 7-8)

**Goal**: Theme system complete

- [ ] CSS variables for themes
- [ ] Default (Cyberpunk) theme
- [ ] Halloween theme
- [ ] 8-Bit theme with CRT effect
- [ ] Theme command in palette

**Checkpoint ✓**
```
[ ] Default theme looks good
[ ] "Strudel Box: Set Theme" shows picker
[ ] Halloween theme applies
[ ] 8-Bit theme has scanlines
```

### Phase 5: Polish (Days 9-10)

**Goal**: Production ready

- [ ] Error handling
- [ ] Loading states
- [ ] Keyboard shortcuts documented
- [ ] README with screenshots
- [ ] `vsce package` creates .vsix

---

## 10. Testing & Debugging

### Development Workflow

```
Terminal 1 (Extension):
$ npm run watch

Terminal 2 (Webview):
$ cd webview-ui && npm run dev

VS Code:
Press F5 → Extension Development Host opens
```

### Debugging

| Issue | Debug Method |
|-------|--------------|
| Webview blank | Open DevTools: `Ctrl+Shift+P` → "Open Webview Developer Tools" |
| Audio not playing | Check console for CSP errors |
| Strudel not loading | Check Network tab for failed requests |
| Samples not found | Check `connect-src` in CSP |

### Common Issues

| Problem | Solution |
|---------|----------|
| "strudel-editor is not defined" | Ensure script loads before use |
| No audio after click | Autoplay policy - audio must start from user gesture |
| Samples not loading | Check CSP `connect-src` includes sample domains |
| Visualizer not animating | Check if AudioContext is connected |

---

## 11. Production Checklist

### Before Publishing

- [ ] Pin @strudel/repl to specific version (not `@latest`)
- [ ] Test on Windows, macOS, Linux
- [ ] Test offline behavior (synths should work)
- [ ] Verify CSP is complete
- [ ] README includes screenshots
- [ ] CHANGELOG updated
- [ ] License file present
- [ ] `vsce package` succeeds
- [ ] Test .vsix installation

### Performance Targets

| Metric | Target |
|--------|--------|
| Panel open time | < 1s |
| First audio | < 500ms after play |
| Visualizer FPS | ≥ 60 |
| Memory usage | < 200MB |

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Evaluate pattern |
| `Ctrl+.` / `Cmd+.` | Stop all (hush) |

### Commands

| Command | Description |
|---------|-------------|
| `Strudel Box: Open` | Open the panel |
| `Strudel Box: Hush` | Stop all sounds |
| `Strudel Box: Load` | Load .strudel file |
| `Strudel Box: Save` | Save current pattern |
| `Strudel Box: Set Theme` | Change theme |

### StrudelMirror API

```typescript
const editor = document.getElementById('strudel-repl').editor;

editor.setCode('s("bd sd")');  // Set code
editor.getCode();              // Get code
editor.evaluate();             // Play
editor.start();                // Start scheduler
editor.stop();                 // Stop all
```

---

*Document Version: 6.0 Final*  
*Project: Strudel Box - VS Code Extension for Live-Coding Music*  
*Technology: @strudel/repl Web Component*  
*Slogan: "Code your beats. Visualize your sound. Share your vibe."*
