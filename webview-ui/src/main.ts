/**
 * Strudel Box - Webview Entry Point
 * BUILD: WEBVIEW_2024_003
 */

import { createEditor, setCode, getCode } from './editor';
import { postMessage } from './vscode';
import './styles.css';

// Strudel global declarations - extended for debugging
declare global {
  interface Window {
    initStrudel: () => Promise<void>;
    evaluate: (code: string) => Promise<unknown>;
    hush: () => void;
    getAudioContext: () => AudioContext;
    // Additional Strudel globals that might exist
    repl?: unknown;
    scheduler?: unknown;
    stop?: () => void;
    silence?: () => void;
  }
}

// Default code shown on startup - using sounds that work without samples
const DEFAULT_CODE = `// Strudel Box - Code your beats
// Press Ctrl+Enter (Cmd+Enter on Mac) to play
// Press Ctrl+. (Cmd+. on Mac) to stop

// Simple synth pattern (no samples needed)
note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)`;

// State
let editor: ReturnType<typeof createEditor> | null = null;
let isInitialized = false;
let isPlaying = false;
let audioContext: AudioContext | null = null;

console.log('[STRUDEL-BOX-WEBVIEW] Script loaded - WEBVIEW_2024_003');

/**
 * Log all Strudel-related functions on window for debugging
 */
function logStrudelGlobals(): void {
  const strudelFunctions = [
    'initStrudel', 'evaluate', 'hush', 'getAudioContext',
    'repl', 'scheduler', 'stop', 'silence', 'note', 's', 'sound',
    'setcps', 'getcps', 'panic'
  ];
  
  console.log('[STRUDEL-BOX-WEBVIEW] === Strudel Globals ===');
  strudelFunctions.forEach(fn => {
    const val = (window as Record<string, unknown>)[fn];
    if (val !== undefined) {
      console.log(`[STRUDEL-BOX-WEBVIEW] window.${fn}:`, typeof val);
    }
  });
  console.log('[STRUDEL-BOX-WEBVIEW] === End Globals ===');
}

/**
 * Initialize the webview
 */
async function init(): Promise<void> {
  console.log('[STRUDEL-BOX-WEBVIEW] init() called');
  
  const container = document.getElementById('editor');
  if (!container) {
    console.error('[STRUDEL-BOX-WEBVIEW] Editor container not found');
    return;
  }

  // Create CodeMirror editor
  editor = createEditor(container, DEFAULT_CODE, async (code) => {
    console.log('[STRUDEL-BOX-WEBVIEW] Editor callback - evaluating code');
    await play(code);
  });

  // Play button
  const playBtn = document.getElementById('play');
  playBtn?.addEventListener('click', async () => {
    console.log('[STRUDEL-BOX-WEBVIEW] Play button clicked');
    if (editor) {
      await play(getCode(editor));
    }
  });

  // Stop button
  const stopBtn = document.getElementById('stop');
  stopBtn?.addEventListener('click', () => {
    console.log('[STRUDEL-BOX-WEBVIEW] Stop button clicked');
    stop();
  });

  // Listen for hush event from keyboard shortcut (Ctrl+. / Cmd+.)
  window.addEventListener('strudel-hush', () => {
    console.log('[STRUDEL-BOX-WEBVIEW] strudel-hush event received');
    stop();
  });

  // Global keyboard listener for Cmd+. / Ctrl+.
  document.addEventListener('keydown', (e) => {
    // Cmd+. on Mac or Ctrl+. on Windows/Linux
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      console.log('[STRUDEL-BOX-WEBVIEW] Cmd/Ctrl+. pressed - stopping');
      e.preventDefault();
      stop();
    }
  });

  // Listen for messages from extension
  window.addEventListener('message', handleExtensionMessage);

  // Notify extension that webview is ready
  postMessage('ready');
  
  console.log('[STRUDEL-BOX-WEBVIEW] Initialization complete');
}

/**
 * Handle messages from VS Code extension
 */
function handleExtensionMessage(event: MessageEvent): void {
  const message = event.data;
  console.log('[STRUDEL-BOX-WEBVIEW] Message from extension:', message.command);
  
  switch (message.command) {
    case 'loadCode':
      if (editor && message.payload) {
        setCode(editor, message.payload);
      }
      break;
    case 'hush':
      stop();
      break;
    case 'setTheme':
      if (message.payload) {
        document.documentElement.setAttribute('data-theme', message.payload);
      }
      break;
  }
}

/**
 * Play/evaluate Strudel code
 */
async function play(code: string): Promise<void> {
  console.log('[STRUDEL-BOX-WEBVIEW] play() called');
  
  try {
    updateStatus('Initializing...', 'playing');
    
    // Initialize Strudel on first play (requires user interaction)
    if (!isInitialized) {
      console.log('[STRUDEL-BOX-WEBVIEW] Initializing Strudel...');
      await window.initStrudel();
      isInitialized = true;
      
      // Get AudioContext reference for fallback stop
      if (typeof window.getAudioContext === 'function') {
        audioContext = window.getAudioContext();
        console.log('[STRUDEL-BOX-WEBVIEW] AudioContext obtained, state:', audioContext?.state);
      }
      
      console.log('[STRUDEL-BOX-WEBVIEW] Strudel initialized successfully');
      logStrudelGlobals();
    }
    
    // Resume AudioContext if suspended
    if (audioContext && audioContext.state === 'suspended') {
      console.log('[STRUDEL-BOX-WEBVIEW] Resuming AudioContext...');
      await audioContext.resume();
    }
    
    // Evaluate the code
    console.log('[STRUDEL-BOX-WEBVIEW] Evaluating code...');
    const result = await window.evaluate(code);
    console.log('[STRUDEL-BOX-WEBVIEW] Evaluate result:', result);
    
    isPlaying = true;
    updateStatus('▶ Playing', 'playing');
    console.log('[STRUDEL-BOX-WEBVIEW] Code evaluated, playing');
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[STRUDEL-BOX-WEBVIEW] Strudel error:', errorMessage);
    updateStatus(`❌ ${errorMessage}`, 'error');
    postMessage('error', errorMessage);
  }
}

/**
 * Stop all audio - tries multiple methods
 */
function stop(): void {
  console.log('[STRUDEL-BOX-WEBVIEW] stop() called');
  console.log('[STRUDEL-BOX-WEBVIEW] isInitialized:', isInitialized);
  console.log('[STRUDEL-BOX-WEBVIEW] isPlaying:', isPlaying);
  
  try {
    // Method 1: Try window.hush()
    if (typeof window.hush === 'function') {
      console.log('[STRUDEL-BOX-WEBVIEW] Method 1: Calling window.hush()');
      window.hush();
      console.log('[STRUDEL-BOX-WEBVIEW] window.hush() called');
    }
    
    // Method 2: Try window.stop() if it exists
    if (typeof window.stop === 'function' && window.stop !== window.stop) {
      console.log('[STRUDEL-BOX-WEBVIEW] Method 2: Calling window.stop()');
      // Note: window.stop is a native browser function, so we skip this
    }
    
    // Method 3: Try evaluating silence/hush pattern
    if (isInitialized && typeof window.evaluate === 'function') {
      console.log('[STRUDEL-BOX-WEBVIEW] Method 3: Evaluating silence pattern');
      // Evaluate an empty pattern or silence to stop
      window.evaluate('silence').catch(e => {
        console.log('[STRUDEL-BOX-WEBVIEW] silence eval failed, trying hush()');
        window.evaluate('hush()').catch(() => {});
      });
    }
    
    // Method 4: Suspend AudioContext as last resort
    if (audioContext && audioContext.state === 'running') {
      console.log('[STRUDEL-BOX-WEBVIEW] Method 4: Suspending AudioContext');
      audioContext.suspend().then(() => {
        console.log('[STRUDEL-BOX-WEBVIEW] AudioContext suspended');
      });
    }
    
    isPlaying = false;
    updateStatus('⏹ Stopped', 'stopped');
    console.log('[STRUDEL-BOX-WEBVIEW] Stop complete');
    
  } catch (err) {
    console.error('[STRUDEL-BOX-WEBVIEW] Error stopping:', err);
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
