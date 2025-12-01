/**
 * Strudel Box - Webview Entry Point
 * Uses @strudel/web for audio engine + CodeMirror for editing
 */

import { postMessage, saveState, getState } from './vscode';
import { ParticleSystem, ThemeType } from './particles';
// Visualizer removed - not needed for this extension
import { createEditor, setCode, getCode } from './editor';
import { 
  loadDefaultSamples, 
  areSamplesLoaded, 
  setLogCallback,
  warnAboutUnknownBanks 
} from './sampleLoader';
import { initLogPanel, addLog, getLogCallback } from './logPanel';
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
let currentTheme: ThemeType = 'default';
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
  if (areSamplesLoaded()) return;
  
  console.log('[STRUDEL-BOX] Loading samples...');
  updateStatus('Loading samples...', 'ready');
  
  const success = await loadDefaultSamples();
  if (success) {
    console.log('[STRUDEL-BOX] Samples loaded');
  } else {
    console.warn('[STRUDEL-BOX] Some samples may not have loaded');
  }
}

async function initStrudel(): Promise<void> {
  if (strudelReady && repl) return;
  
  updateStatus('Loading Strudel...', 'ready');
  
  try {
    await waitForStrudel();
    
    console.log('[STRUDEL-BOX] Initializing Strudel REPL...');
    
    // Initialize Strudel REPL FIRST - this makes window.samples available
    repl = await window.initStrudel!();
    strudelReady = true;
    
    console.log('[STRUDEL-BOX] Strudel ready:', Object.keys(repl));
    
    // NOW load samples (after initStrudel made window.samples available)
    await loadSamples();
    
    updateStatus('Ready - Press Ctrl+Enter to play', 'ready');
    
  } catch (err) {
    console.error('[STRUDEL-BOX] Failed to initialize Strudel:', err);
    updateStatus(`Error: ${err}`, 'error');
    addLog(`Failed to initialize: ${err}`, 'error');
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
// Audio Controls
// =============================================================================

async function playPattern(code?: string): Promise<void> {
  // Always ensure Strudel and samples are loaded
  if (!repl || !strudelReady) {
    console.log('[STRUDEL-BOX] Initializing Strudel before play...');
    updateStatus('Initializing...', 'ready');
    addLog('Initializing Strudel audio engine...', 'info');
    await initStrudel();
    if (!repl) {
      updateStatus('Failed to initialize', 'error');
      addLog('Failed to initialize Strudel', 'error');
      return;
    }
  }
  
  // Ensure samples are loaded
  if (!areSamplesLoaded()) {
    await loadSamples();
  }
  
  const patternCode = code || (editor ? getCode(editor) : '');
  if (!patternCode.trim()) {
    updateStatus('No code to play', 'error');
    addLog('No code to play', 'warn');
    return;
  }
  
  // Warn about potentially missing banks
  warnAboutUnknownBanks(patternCode);
  
  try {
    console.log('[STRUDEL-BOX] Evaluating pattern...');
    addLog('Evaluating pattern...', 'info');
    await repl.evaluate(patternCode);
    updateStatus('▶ Playing', 'playing');
    addLog('Pattern playing', 'success');
    saveCurrentState();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[STRUDEL-BOX] Evaluation error:', err);
    updateStatus(`Error: ${errorMsg}`, 'error');
    addLog(`Evaluation error: ${errorMsg}`, 'error');
  }
}

function stopPattern(): void {
  if (!repl) return;
  
  try {
    repl.stop();
    updateStatus('⏹ Stopped', 'stopped');
    console.log('[STRUDEL-BOX] Pattern stopped');
    addLog('Pattern stopped', 'info');
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
  
  // Initialize editor first (shows UI immediately)
  initEditor();
  
  // Initialize log panel and connect to sample loader
  initLogPanel();
  setLogCallback(getLogCallback());
  addLog('Strudel Box initialized', 'success');
  
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
