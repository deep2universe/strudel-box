/**
 * Strudel Box - Webview Entry Point
 * Uses @strudel/web for audio engine + CodeMirror for editing
 */

import { postMessage, saveState, getState } from './vscode';
import { ParticleSystem, ThemeType } from './particles';
import { Visualizer } from './visualizer';
import { createEditor, setCode, getCode } from './editor';
import type { EditorView } from 'codemirror';
import './styles.css';

// =============================================================================
// Type Definitions
// =============================================================================

interface StrudelREPL {
  evaluate: (code: string) => Promise<unknown>;
  stop: () => void;
  start: () => void;
  pause: () => void;
  scheduler?: {
    audioContext?: AudioContext;
  };
}

interface AppState {
  theme: ThemeType;
  code?: string;
}

declare global {
  interface Window {
    INITIAL_CODE?: string;
    initStrudel?: () => Promise<StrudelREPL>;
    samples?: (url: string) => Promise<void>;
    initAudio?: () => Promise<void>;
  }
}

// =============================================================================
// Global State
// =============================================================================

let editor: EditorView | null = null;
let repl: StrudelREPL | null = null;
let particleSystem: ParticleSystem | null = null;
let visualizer: Visualizer | null = null;
let currentTheme: ThemeType = 'default';
let samplesLoaded = false;
let strudelReady = false;

const DEFAULT_CODE = `// 🎵 Welcome to Strudel Box!
// Press Ctrl+Enter to play, Ctrl+. to stop

s("bd sd hh*4")`;

console.log('[STRUDEL-BOX] Webview loaded');

// =============================================================================
// Status Updates
// =============================================================================

function updateStatus(text: string, type: 'ready' | 'playing' | 'stopped' | 'error' = 'ready'): void {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = type === 'playing' ? 'playing' : type === 'error' ? 'error' : '';
  }
}

// =============================================================================
// Strudel Audio Engine
// =============================================================================

async function waitForStrudel(): Promise<void> {
  let attempts = 0;
  while (!window.initStrudel && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  if (!window.initStrudel) {
    throw new Error('Strudel not loaded from CDN');
  }
}

async function loadSamples(): Promise<void> {
  if (samplesLoaded) return;
  
  console.log('[STRUDEL-BOX] Loading samples...');
  updateStatus('Loading samples...', 'ready');
  
  if (window.samples) {
    await window.samples('github:tidalcycles/Dirt-Samples/master');
    samplesLoaded = true;
    console.log('[STRUDEL-BOX] Samples loaded');
  }
}

async function initStrudel(): Promise<void> {
  if (strudelReady && repl) return;
  
  updateStatus('Loading Strudel...', 'ready');
  
  try {
    await waitForStrudel();
    
    // Load samples first
    await loadSamples();
    
    console.log('[STRUDEL-BOX] Initializing Strudel REPL...');
    
    // Initialize Strudel REPL
    repl = await window.initStrudel!();
    strudelReady = true;
    
    console.log('[STRUDEL-BOX] Strudel ready:', Object.keys(repl));
    updateStatus('Ready - Press Ctrl+Enter to play', 'ready');
    
  } catch (err) {
    console.error('[STRUDEL-BOX] Failed to initialize Strudel:', err);
    updateStatus(`Error: ${err}`, 'error');
  }
}

// =============================================================================
// Editor Setup
// =============================================================================

function initEditor(): void {
  const container = document.getElementById('editor');
  if (!container) {
    console.error('[STRUDEL-BOX] Editor container not found');
    return;
  }
  
  // Get initial code
  const savedState = getState<AppState>();
  const initialCode = savedState?.code || window.INITIAL_CODE || DEFAULT_CODE;
  
  // Create CodeMirror editor
  editor = createEditor(container, initialCode, async (code) => {
    await playPattern(code);
  });
  
  console.log('[STRUDEL-BOX] Editor initialized');
}

// =============================================================================
// Visualizer Integration
// =============================================================================

function initVisualizer(): void {
  const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
  if (!canvas) {
    console.warn('[STRUDEL-BOX] Visualizer canvas not found');
    return;
  }
  
  visualizer = new Visualizer(canvas);
  visualizer.start();
}

function connectVisualizerToAudio(): void {
  if (!visualizer || !repl) return;
  
  try {
    const audioContext = repl.scheduler?.audioContext;
    if (audioContext) {
      visualizer.connect(audioContext);
      console.log('[STRUDEL-BOX] Visualizer connected');
    }
  } catch (err) {
    console.warn('[STRUDEL-BOX] Could not connect visualizer:', err);
  }
}

// =============================================================================
// Audio Controls
// =============================================================================

async function playPattern(code?: string): Promise<void> {
  // Always ensure Strudel and samples are loaded
  if (!repl || !strudelReady) {
    console.log('[STRUDEL-BOX] Initializing Strudel before play...');
    updateStatus('Initializing...', 'ready');
    await initStrudel();
    if (!repl) {
      updateStatus('Failed to initialize', 'error');
      return;
    }
  }
  
  // Ensure samples are loaded
  if (!samplesLoaded) {
    await loadSamples();
  }
  
  const patternCode = code || (editor ? getCode(editor) : '');
  if (!patternCode.trim()) {
    updateStatus('No code to play', 'error');
    return;
  }
  
  try {
    console.log('[STRUDEL-BOX] Evaluating pattern...');
    await repl.evaluate(patternCode);
    updateStatus('▶ Playing', 'playing');
    connectVisualizerToAudio();
    saveCurrentState();
  } catch (err) {
    console.error('[STRUDEL-BOX] Evaluation error:', err);
    updateStatus(`Error: ${err}`, 'error');
  }
}

function stopPattern(): void {
  if (!repl) return;
  
  try {
    repl.stop();
    updateStatus('⏹ Stopped', 'stopped');
    console.log('[STRUDEL-BOX] Pattern stopped');
  } catch (err) {
    console.error('[STRUDEL-BOX] Stop error:', err);
  }
}

// =============================================================================
// Theme System
// =============================================================================

function setupThemeSwitcher(): void {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme') as ThemeType;
      if (theme) {
        setTheme(theme);
      }
    });
  });
}

function setTheme(theme: ThemeType): void {
  currentTheme = theme;
  applyTheme(theme);
  if (particleSystem) {
    particleSystem.setTheme(theme);
  }
  saveCurrentState();
  console.log(`[STRUDEL-BOX] Theme changed to: ${theme}`);
}

function applyTheme(theme: ThemeType): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}

// =============================================================================
// State Persistence
// =============================================================================

function saveCurrentState(): void {
  const state: AppState = { theme: currentTheme };
  if (editor) {
    state.code = getCode(editor);
  }
  saveState(state);
}

// Save state periodically
setInterval(saveCurrentState, 5000);

// =============================================================================
// VS Code Communication
// =============================================================================

function setupVSCodeBridge(): void {
  window.addEventListener('message', (event) => {
    const message = event.data;
    console.log('[STRUDEL-BOX] Message from extension:', message.command);

    switch (message.command) {
      case 'loadCode':
        if (editor && message.payload) {
          setCode(editor, message.payload as string);
          saveCurrentState();
        }
        break;
        
      case 'evaluate':
        playPattern();
        break;
        
      case 'stop':
      case 'hush':
        stopPattern();
        break;
        
      case 'getCode':
        if (editor) {
          postMessage('codeResponse', getCode(editor));
        }
        break;
        
      case 'requestSave':
        if (editor) {
          postMessage('saveCode', getCode(editor));
        }
        break;
        
      case 'setTheme':
        if (message.payload) {
          setTheme(message.payload as ThemeType);
        }
        break;
    }
  });
}

// =============================================================================
// UI Event Handlers
// =============================================================================

function setupControls(): void {
  const playBtn = document.getElementById('play');
  const stopBtn = document.getElementById('stop');
  const saveBtn = document.getElementById('save');
  
  playBtn?.addEventListener('click', () => playPattern());
  stopBtn?.addEventListener('click', () => stopPattern());
  saveBtn?.addEventListener('click', () => {
    if (editor) {
      postMessage('saveCode', getCode(editor));
    }
  });
}

// =============================================================================
// Keyboard Shortcuts (Global)
// =============================================================================

function setupKeyboardShortcuts(): void {
  // Listen for hush event from editor.ts
  window.addEventListener('strudel-hush', () => stopPattern());
}

// =============================================================================
// Initialization
// =============================================================================

async function init(): Promise<void> {
  console.log('[STRUDEL-BOX] Initializing...');

  // Restore saved state
  const savedState = getState<AppState>();
  if (savedState?.theme) {
    currentTheme = savedState.theme;
  }
  applyTheme(currentTheme);

  // Initialize particle system (animated backgrounds)
  const particleCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
  if (particleCanvas) {
    particleSystem = new ParticleSystem(particleCanvas);
    particleSystem.setTheme(currentTheme);
    particleSystem.start();
  }

  // Setup all handlers
  setupVSCodeBridge();
  setupKeyboardShortcuts();
  setupThemeSwitcher();
  setupControls();
  initVisualizer();
  
  // Initialize editor first (shows UI immediately)
  initEditor();
  
  // Initialize Strudel audio engine (async)
  await initStrudel();
  
  // Notify extension that we're ready
  postMessage('ready');

  console.log('[STRUDEL-BOX] Initialization complete');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
