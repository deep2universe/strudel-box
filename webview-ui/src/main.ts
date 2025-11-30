/**
 * Strudel Box - Webview Entry Point
 * Complete Theme System with Particles and Icons
 */

import { createEditor, setCode, getCode } from './editor';
import { postMessage, saveState, getState } from './vscode';
import { ParticleSystem, ThemeType } from './particles';
import { updateIcons, getThemeDisplayName } from './icons';
import './styles.css';

// Strudel global declarations
declare global {
  interface Window {
    initStrudel: () => Promise<void>;
    evaluate: (code: string) => Promise<unknown>;
    hush: () => void;
    getAudioContext: () => AudioContext;
    repl?: unknown;
    scheduler?: unknown;
    strudelStop?: () => void;
    silence?: () => void;
  }
}

// Default code shown on startup
const DEFAULT_CODE = `// 🎵 Strudel Box - Code your beats!
// Press Ctrl+Enter (Cmd+Enter on Mac) to play
// Press Ctrl+. (Cmd+. on Mac) to stop

// Simple synth pattern
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)`;

// State
interface AppState {
  theme: ThemeType;
  code?: string;
}

let editor: ReturnType<typeof createEditor> | null = null;
let isInitialized = false;
let isPlaying = false;
let audioContext: AudioContext | null = null;
let particleSystem: ParticleSystem | null = null;
let currentTheme: ThemeType = 'default';

console.log('[STRUDEL-BOX] Webview loaded');


/**
 * Initialize the webview
 */
async function init(): Promise<void> {
  console.log('[STRUDEL-BOX] Initializing...');
  
  // Restore saved state
  const savedState = getState<AppState>();
  if (savedState?.theme) {
    currentTheme = savedState.theme;
  }
  
  // Apply initial theme
  applyTheme(currentTheme);
  
  // Initialize particle system
  const particleCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
  if (particleCanvas) {
    particleSystem = new ParticleSystem(particleCanvas);
    particleSystem.setTheme(currentTheme);
    particleSystem.start();
  }
  
  // Initialize editor
  const container = document.getElementById('editor');
  if (!container) {
    console.error('[STRUDEL-BOX] Editor container not found');
    return;
  }

  const initialCode = savedState?.code || DEFAULT_CODE;
  editor = createEditor(container, initialCode, async (code) => {
    await play(code);
  });

  // Setup button handlers
  setupControls();
  
  // Setup theme switcher
  setupThemeSwitcher();
  
  // Update icons for current theme
  updateIcons(currentTheme);

  // Listen for messages from extension
  window.addEventListener('message', handleExtensionMessage);

  // Notify extension that webview is ready
  postMessage('ready');
  
  console.log('[STRUDEL-BOX] Initialization complete');
}

/**
 * Setup control buttons
 */
function setupControls(): void {
  // Play button
  const playBtn = document.getElementById('play');
  playBtn?.addEventListener('click', async () => {
    if (editor) {
      await play(getCode(editor));
    }
  });

  // Stop button
  const stopBtn = document.getElementById('stop');
  stopBtn?.addEventListener('click', () => {
    stop();
  });

  // Listen for hush event from keyboard shortcut
  window.addEventListener('strudel-hush', () => {
    stop();
  });

  // Global keyboard listener for Cmd+. / Ctrl+.
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      e.preventDefault();
      stop();
    }
  });
}

/**
 * Setup theme switcher buttons
 */
function setupThemeSwitcher(): void {
  const themeBtns = document.querySelectorAll('.theme-btn');
  
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme') as ThemeType;
      if (theme) {
        setTheme(theme);
      }
    });
  });
}


/**
 * Set and apply theme
 */
function setTheme(theme: ThemeType): void {
  currentTheme = theme;
  applyTheme(theme);
  
  // Update particle system
  if (particleSystem) {
    particleSystem.setTheme(theme);
  }
  
  // Update icons
  updateIcons(theme);
  
  // Update active button state
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
  
  // Save state
  saveCurrentState();
  
  // Log theme change
  console.log(`[STRUDEL-BOX] Theme changed to: ${getThemeDisplayName(theme)}`);
}

/**
 * Apply theme to document
 */
function applyTheme(theme: ThemeType): void {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update active button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}

/**
 * Save current state
 */
function saveCurrentState(): void {
  const state: AppState = {
    theme: currentTheme,
    code: editor ? getCode(editor) : undefined
  };
  saveState(state);
}

/**
 * Handle messages from VS Code extension
 */
function handleExtensionMessage(event: MessageEvent): void {
  const message = event.data;
  console.log('[STRUDEL-BOX] Message from extension:', message.command);
  
  switch (message.command) {
    case 'loadCode':
      if (editor && message.payload) {
        setCode(editor, message.payload);
        saveCurrentState();
      }
      break;
    case 'hush':
      stop();
      break;
    case 'setTheme':
      if (message.payload) {
        setTheme(message.payload as ThemeType);
      }
      break;
    case 'requestSave':
      if (editor) {
        postMessage('saveCode', getCode(editor));
      }
      break;
  }
}


/**
 * Play/evaluate Strudel code
 */
async function play(code: string): Promise<void> {
  console.log('[STRUDEL-BOX] Playing...');
  
  try {
    updateStatus('Initializing...', 'playing');
    
    // Initialize Strudel on first play (requires user interaction)
    if (!isInitialized) {
      console.log('[STRUDEL-BOX] Initializing Strudel...');
      await window.initStrudel();
      isInitialized = true;
      
      // Get AudioContext reference
      if (typeof window.getAudioContext === 'function') {
        audioContext = window.getAudioContext();
        console.log('[STRUDEL-BOX] AudioContext state:', audioContext?.state);
      }
    }
    
    // Resume AudioContext if suspended
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Evaluate the code
    await window.evaluate(code);
    
    isPlaying = true;
    updateStatus('▶ Playing', 'playing');
    saveCurrentState();
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[STRUDEL-BOX] Error:', errorMessage);
    updateStatus(`❌ ${errorMessage}`, 'error');
    postMessage('error', errorMessage);
  }
}

/**
 * Stop all audio
 */
function stop(): void {
  console.log('[STRUDEL-BOX] Stopping...');
  
  try {
    // Try window.hush()
    if (typeof window.hush === 'function') {
      window.hush();
    }
    
    // Try evaluating silence pattern
    if (isInitialized && typeof window.evaluate === 'function') {
      window.evaluate('silence').catch(() => {
        window.evaluate('hush()').catch(() => {});
      });
    }
    
    // Suspend AudioContext as fallback
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend();
    }
    
    isPlaying = false;
    updateStatus('⏹ Stopped', 'stopped');
    
  } catch (err) {
    console.error('[STRUDEL-BOX] Error stopping:', err);
  }
}

/**
 * Update status display
 */
function updateStatus(text: string, state: 'playing' | 'stopped' | 'error' = 'stopped'): void {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = state;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
