/**
 * Strudel Box - Webview Entry Point
 * Uses iframe with strudel.cc for full feature support
 */

import { postMessage, saveState, getState } from './vscode';
import { ParticleSystem, ThemeType } from './particles';
import './styles.css';

interface AppState {
  theme: ThemeType;
}

let particleSystem: ParticleSystem | null = null;
let currentTheme: ThemeType = 'default';

console.log('[STRUDEL-BOX] Webview loaded - iframe version');

async function init(): Promise<void> {
  console.log('[STRUDEL-BOX] Initializing...');

  // Restore saved state
  const savedState = getState<AppState>();
  if (savedState?.theme) {
    currentTheme = savedState.theme;
  }

  applyTheme(currentTheme);

  // Initialize particle system
  const particleCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
  if (particleCanvas) {
    particleSystem = new ParticleSystem(particleCanvas);
    particleSystem.setTheme(currentTheme);
    particleSystem.start();
  }

  // Setup theme switcher
  setupThemeSwitcher();

  // Listen for messages from extension
  window.addEventListener('message', handleExtensionMessage);

  // Notify extension that webview is ready
  postMessage('ready');

  console.log('[STRUDEL-BOX] Initialization complete');
}

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
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
  saveCurrentState();
  console.log(`[STRUDEL-BOX] Theme changed to: ${theme}`);
}

function applyTheme(theme: ThemeType): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}

function saveCurrentState(): void {
  saveState({ theme: currentTheme });
}

function handleExtensionMessage(event: MessageEvent): void {
  const message = event.data;
  console.log('[STRUDEL-BOX] Message from extension:', message.command);

  const iframe = document.getElementById('strudel-iframe') as HTMLIFrameElement;

  switch (message.command) {
    case 'loadCode':
      if (iframe && message.payload) {
        // Encode the code and update iframe URL
        const encodedCode = btoa(unescape(encodeURIComponent(message.payload as string)));
        iframe.src = `https://strudel.cc/#${encodedCode}`;
      }
      break;

    case 'setTheme':
      if (message.payload) {
        setTheme(message.payload as ThemeType);
      }
      break;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
