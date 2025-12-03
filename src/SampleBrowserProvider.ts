/**
 * Strudel Box - Sample Browser Provider
 * WebviewViewProvider for sample pack discovery and management
 */

import * as vscode from 'vscode';

// Debug flag for this file
const DEBUG = false;

interface SampleBrowserState {
  theme: 'tech' | 'halloween' | '8bit';
  searchQuery: string;
  expandedCategories: string[];
  loadedPacks: string[];
  previewingPack: string | null;
}

export class SampleBrowserProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'strudel-box.sampleBrowser';
  
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _state: SampleBrowserState = {
    theme: 'tech',
    searchQuery: '',
    expandedCategories: ['builtin'],
    loadedPacks: [],
    previewingPack: null
  };

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this._handleMessage(message);
    });
  }

  private async _handleMessage(message: { command: string; payload?: unknown }): Promise<void> {
    if (DEBUG) { console.log('[SAMPLE-BROWSER] Message:', message.command, message.payload); }

    switch (message.command) {
      case 'ready':
        this._sendMessage('updateState', this._state);
        break;

      case 'setTheme':
        this._state.theme = message.payload as 'tech' | 'halloween' | '8bit';
        this._sendMessage('updateState', this._state);
        break;

      case 'copyUrl':
        const url = message.payload as string;
        const snippet = `samples('${url}')`;
        await vscode.env.clipboard.writeText(snippet);
        vscode.window.showInformationMessage(`Copied: ${snippet}`);
        break;

      case 'toggleCategory':
        const categoryId = message.payload as string;
        const idx = this._state.expandedCategories.indexOf(categoryId);
        if (idx >= 0) {
          this._state.expandedCategories.splice(idx, 1);
        } else {
          this._state.expandedCategories.push(categoryId);
        }
        this._sendMessage('updateState', this._state);
        break;

      case 'packLoaded':
        const packId = message.payload as string;
        if (!this._state.loadedPacks.includes(packId)) {
          this._state.loadedPacks.push(packId);
        }
        this._sendMessage('updateState', this._state);
        break;

      case 'previewStarted':
        this._state.previewingPack = message.payload as string;
        this._sendMessage('updateState', this._state);
        break;

      case 'previewStopped':
        this._state.previewingPack = null;
        this._sendMessage('updateState', this._state);
        break;

      case 'log':
        if (DEBUG) { console.log('[SAMPLE-BROWSER-WEBVIEW]', message.payload); }
        break;

      case 'error':
        if (DEBUG) { console.error('[SAMPLE-BROWSER-WEBVIEW]', message.payload); }
        vscode.window.showErrorMessage(`Sample Browser: ${message.payload}`);
        break;
    }
  }

  private _sendMessage(command: string, payload?: unknown): void {
    if (this._view) {
      this._view.webview.postMessage({ command, payload });
    }
  }

  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src 'unsafe-inline' ${webview.cspSource};
    script-src 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net;
    font-src ${webview.cspSource} https:;
    connect-src https: wss: data: blob:;
    media-src https: blob: data:;
    worker-src blob: data:;
  ">
  <title>Sample Browser</title>
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
  <style>
    ${this._getStyles()}
  </style>
</head>
<body data-theme="tech">
  <canvas id="animation-canvas"></canvas>
  <div class="browser">
    <div class="header">
      <h2>🎵 Sample Browser</h2>
      <div class="header-actions">
        <button id="reloadBtn" class="icon-btn" title="Reload Samples">🔄</button>
        <div class="theme-buttons">
          <button class="theme-btn" data-theme="tech" title="Tech">⚡</button>
          <button class="theme-btn" data-theme="halloween" title="Halloween">🎃</button>
          <button class="theme-btn" data-theme="8bit" title="8-Bit">👾</button>
        </div>
      </div>
    </div>

    <div class="search-container">
      <input type="text" id="searchInput" placeholder="Search samples..." />
    </div>

    <div id="statusBar" class="status-bar"></div>

    <div class="pack-list" id="packList">
      <!-- Populated by JavaScript -->
    </div>
  </div>

  <script nonce="${nonce}">
    ${this._getScript()}
  </script>
</body>
</html>`;
  }


  private _getStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
        height: 100vh;
        overflow: hidden;
        position: relative;
      }

      #animation-canvas {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 0;
      }

      .browser {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
      }

      /* Theme Variables */
      body[data-theme="tech"] {
        --accent: #00d4ff;
        --accent-dim: #00d4ff40;
        --accent-glow: 0 0 10px #00d4ff80;
        --file-hover: #00d4ff15;
        --playing-bg: linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%);
      }

      body[data-theme="halloween"] {
        --accent: #ff6b00;
        --accent-dim: #ff6b0040;
        --accent-glow: 0 0 10px #ff6b0080;
        --file-hover: #ff6b0015;
        --playing-bg: linear-gradient(135deg, #1a0a00 0%, #2d1810 100%);
      }

      body[data-theme="8bit"] {
        --accent: #00ff41;
        --accent-dim: #00ff4140;
        --accent-glow: 0 0 10px #00ff4180;
        --file-hover: #00ff4115;
        --playing-bg: linear-gradient(135deg, #001a00 0%, #0a2a0a 100%);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }

      .header h2 {
        font-size: 13px;
        font-weight: 600;
        color: var(--accent);
        text-shadow: var(--accent-glow);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        opacity: 0.7;
        transition: all 0.2s;
        padding: 4px;
      }

      .icon-btn:hover {
        opacity: 1;
        transform: rotate(180deg);
      }

      .icon-btn.loading {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .theme-buttons { display: flex; gap: 4px; }

      .theme-btn {
        background: transparent;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 2px 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .theme-btn:hover, .theme-btn.active {
        border-color: var(--accent);
        box-shadow: var(--accent-glow);
      }

      .search-container { padding: 8px 0; }

      #searchInput {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 12px;
      }

      #searchInput:focus {
        outline: none;
        border-color: var(--accent);
      }

      .status-bar {
        font-size: 10px;
        padding: 4px 0;
        color: var(--vscode-descriptionForeground);
        min-height: 18px;
      }

      .status-bar.error { color: #ff6b6b; }
      .status-bar.success { color: var(--accent); }

      .pack-list {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .category-header {
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        gap: 8px;
        font-weight: 600;
        font-size: 12px;
        transition: background 0.15s;
      }

      .category-header:hover { background: var(--file-hover); }

      .category-chevron {
        font-size: 10px;
        transition: transform 0.15s;
      }

      .category-header.expanded .category-chevron {
        transform: rotate(90deg);
      }

      .category-items {
        display: none;
        padding-left: 16px;
      }

      .category-items.expanded { display: block; }

      .pack-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        border-radius: 4px;
        gap: 8px;
        transition: background 0.15s;
      }

      .pack-item:hover { background: var(--file-hover); }

      .pack-item.playing {
        background: var(--playing-bg);
        border-left: 2px solid var(--accent);
      }

      .pack-info { flex: 1; min-width: 0; }

      .pack-name {
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pack-meta {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
      }

      .pack-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .pack-item:hover .pack-actions,
      .pack-item.playing .pack-actions { opacity: 1; }

      .action-btn {
        background: transparent;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 2px 6px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.15s;
      }

      .action-btn:hover {
        border-color: var(--accent);
        background: var(--accent-dim);
      }

      .action-btn.loaded {
        background: var(--accent-dim);
        border-color: var(--accent);
        color: var(--accent);
      }

      .action-btn.playing {
        background: var(--accent);
        color: #000;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.95); }
      }

      .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
      }

      .playing-indicator {
        width: 8px;
        height: 8px;
        background: var(--accent);
        border-radius: 50%;
        animation: pulse 1s infinite;
        flex-shrink: 0;
      }
    `;
  }


  private _getScript(): string {
    return `
      const vscode = acquireVsCodeApi();
      
      // Debug flag for webview
      const DEBUG = false;
      
      // ========== LOGGING ==========
      function log(msg, level = 'info') {
        if (!DEBUG) return;
        const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level] || 'ℹ️';
        console.log('[SAMPLE-BROWSER] ' + prefix + ' ' + msg);
        vscode.postMessage({ command: 'log', payload: prefix + ' ' + msg });
      }

      function setStatus(msg, type = '') {
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
          statusBar.textContent = msg;
          statusBar.className = 'status-bar ' + type;
        }
      }

      // ========== SAMPLE PACK DATA ==========
      ${this._getSamplePackData()}
      
      // ========== STATE ==========
      let state = {
        theme: 'tech',
        searchQuery: '',
        expandedCategories: ['builtin'],
        loadedPacks: [],
        previewingPack: null
      };
      
      // Cache for loaded sample banks
      let sampleBanksCache = {};
      let repl = null;
      let isInitializing = false;
      const strudelInit = window.initStrudel;

      // Elements
      const packList = document.getElementById('packList');
      const searchInput = document.getElementById('searchInput');
      const themeButtons = document.querySelectorAll('.theme-btn');
      const reloadBtn = document.getElementById('reloadBtn');

      // ========== STRUDEL AUDIO ENGINE ==========
      async function initAudioEngine() {
        if (repl) {
          log('Audio engine already initialized', 'info');
          return true;
        }
        if (isInitializing) {
          log('Audio engine initialization in progress...', 'info');
          while (isInitializing) {
            await new Promise(r => setTimeout(r, 100));
          }
          return !!repl;
        }
        
        isInitializing = true;
        log('Initializing Strudel audio engine...', 'info');
        setStatus('Initializing audio...');
        
        if (!strudelInit) {
          log('Strudel not loaded from CDN!', 'error');
          setStatus('Error: Strudel not loaded', 'error');
          isInitializing = false;
          return false;
        }
        
        try {
          repl = await strudelInit();
          log('Strudel REPL initialized successfully', 'success');
          log('Available methods: ' + Object.keys(repl).join(', '), 'info');
          setStatus('Audio ready', 'success');
          isInitializing = false;
          return true;
        } catch (err) {
          log('Failed to init Strudel: ' + err.message, 'error');
          setStatus('Error: ' + err.message, 'error');
          vscode.postMessage({ command: 'error', payload: 'Failed to initialize audio: ' + err.message });
          isInitializing = false;
          return false;
        }
      }

      // ========== SAMPLE LOADING ==========
      async function loadSamplePack(packId, url) {
        log('Loading sample pack: ' + packId + ' from ' + url, 'info');
        setStatus('Loading ' + packId + '...');
        
        const initialized = await initAudioEngine();
        if (!initialized) {
          log('Cannot load samples - audio engine not ready', 'error');
          return null;
        }
        
        if (!window.samples) {
          log('window.samples not available!', 'error');
          setStatus('Error: samples() not available', 'error');
          return null;
        }
        
        try {
          log('Calling samples("' + url + '")...', 'info');
          const result = await window.samples(url);
          log('samples() returned: ' + JSON.stringify(result), 'info');
          
          // Cache the result
          sampleBanksCache[packId] = { url, result, loadedAt: Date.now() };
          
          setStatus('Loaded ' + packId, 'success');
          vscode.postMessage({ command: 'packLoaded', payload: packId });
          
          return result;
        } catch (err) {
          log('Failed to load ' + packId + ': ' + err.message, 'error');
          setStatus('Error loading ' + packId, 'error');
          return null;
        }
      }

      // ========== PREVIEW ==========
      async function previewPack(packId, url) {
        log('Preview requested for: ' + packId, 'info');
        
        // If already previewing this pack, stop it
        if (state.previewingPack === packId) {
          log('Stopping preview for ' + packId, 'info');
          stopPreview();
          return;
        }
        
        // Stop any current preview
        stopPreview();
        
        setStatus('Loading preview...');
        
        // Initialize audio if needed
        const initialized = await initAudioEngine();
        if (!initialized) {
          log('Cannot preview - audio not initialized', 'error');
          return;
        }
        
        try {
          // Load the sample pack first
          log('Loading samples for preview...', 'info');
          await window.samples(url);
          log('Samples loaded, now playing preview...', 'info');
          
          // For built-in packs, we know some sample names
          // For others, try a generic pattern
          let pattern;
          
          if (url === 'tidal-drum-machines') {
            pattern = 's("RolandTR808_bd RolandTR808_sd RolandTR808_hh*2")';
          } else if (url === 'piano') {
            pattern = 'note("c3 e3 g3 c4").s("piano")';
          } else if (url === 'vcsl') {
            pattern = 's("vcsl:0 vcsl:1 vcsl:2 vcsl:3")';
          } else if (url === 'mridangam') {
            pattern = 's("mridangam:0 mridangam:1 mridangam:2")';
          } else if (url === 'uzu-drumkit') {
            pattern = 's("uzu_kick uzu_snare uzu_hat*2")';
          } else {
            // Generic pattern - try to play first few samples
            // Extract bank name from URL
            const bankName = url.split('/').pop()?.split(':').pop() || 'sample';
            pattern = 's("' + bankName + ':0 ' + bankName + ':1 ' + bankName + ':2 ' + bankName + ':3")';
          }
          
          log('Evaluating pattern: ' + pattern, 'info');
          await repl.evaluate(pattern);
          
          state.previewingPack = packId;
          vscode.postMessage({ command: 'previewStarted', payload: packId });
          setStatus('Playing: ' + packId, 'success');
          renderPackList();
          
        } catch (err) {
          log('Preview error: ' + err.message, 'error');
          setStatus('Preview error: ' + err.message, 'error');
          stopPreview();
        }
      }

      function stopPreview() {
        if (repl) {
          try {
            repl.stop();
            log('Playback stopped', 'info');
          } catch (e) {
            log('Error stopping: ' + e.message, 'warn');
          }
        }
        state.previewingPack = null;
        vscode.postMessage({ command: 'previewStopped' });
        setStatus('');
        renderPackList();
      }

      // ========== RELOAD ==========
      function reloadSamples() {
        log('Reloading all samples...', 'info');
        setStatus('Reloading...');
        reloadBtn.classList.add('loading');
        
        // Clear cache
        sampleBanksCache = {};
        state.loadedPacks = [];
        
        // Stop any preview
        stopPreview();
        
        setTimeout(() => {
          reloadBtn.classList.remove('loading');
          setStatus('Cache cleared', 'success');
          renderPackList();
        }, 500);
      }

      // ========== RENDERING ==========
      function filterPacks(packs, query) {
        if (!query.trim()) return packs;
        const q = query.toLowerCase();
        return packs.filter(p => 
          p.name.toLowerCase().includes(q) ||
          p.url.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.author || '').toLowerCase().includes(q)
        );
      }

      function groupByCategory(packs) {
        const grouped = {};
        CATEGORIES.forEach(c => grouped[c.id] = []);
        packs.forEach(p => {
          if (grouped[p.category]) grouped[p.category].push(p);
        });
        return grouped;
      }

      function renderPackList() {
        const filtered = filterPacks(SAMPLE_PACKS, state.searchQuery);
        const grouped = groupByCategory(filtered);
        
        let html = '';
        
        CATEGORIES.forEach(cat => {
          const packs = grouped[cat.id] || [];
          if (packs.length === 0) return;
          
          const isExpanded = state.expandedCategories.includes(cat.id);
          
          html += '<div class="category">';
          html += '<div class="category-header ' + (isExpanded ? 'expanded' : '') + '" data-category="' + cat.id + '">';
          html += '<span class="category-chevron">▶</span>';
          html += '<span>' + cat.icon + ' ' + cat.name + '</span>';
          html += '<span style="margin-left:auto;opacity:0.6">(' + packs.length + ')</span>';
          html += '</div>';
          html += '<div class="category-items ' + (isExpanded ? 'expanded' : '') + '">';
          packs.forEach(p => { html += renderPackItem(p); });
          html += '</div></div>';
        });
        
        if (!html) {
          html = '<div class="empty-state">No samples found</div>';
        }
        
        packList.innerHTML = html;
        attachEventHandlers();
      }

      function renderPackItem(pack) {
        const isLoaded = state.loadedPacks.includes(pack.id);
        const isPreviewing = state.previewingPack === pack.id;
        
        let html = '<div class="pack-item ' + (isPreviewing ? 'playing' : '') + '" data-pack-id="' + pack.id + '" data-pack-url="' + pack.url + '">';
        
        if (isPreviewing) {
          html += '<div class="playing-indicator"></div>';
        }
        
        html += '<div class="pack-info">';
        html += '<div class="pack-name">' + pack.name + '</div>';
        html += '<div class="pack-meta">';
        if (pack.sampleCount) html += pack.sampleCount + ' samples';
        if (pack.author) html += ' • ' + pack.author;
        html += '</div></div>';
        
        html += '<div class="pack-actions">';
        html += '<button class="action-btn preview-btn ' + (isPreviewing ? 'playing' : '') + '" title="' + (isPreviewing ? 'Stop' : 'Preview') + '">' + (isPreviewing ? '⏹' : '▶') + '</button>';
        html += '<button class="action-btn copy-btn" title="Copy URL">📋</button>';
        html += '<button class="action-btn load-btn ' + (isLoaded ? 'loaded' : '') + '" title="' + (isLoaded ? 'Loaded' : 'Load') + '">' + (isLoaded ? '✓' : '⬇') + '</button>';
        html += '</div></div>';
        
        return html;
      }

      function attachEventHandlers() {
        // Category headers
        document.querySelectorAll('.category-header').forEach(header => {
          header.addEventListener('click', () => {
            vscode.postMessage({ command: 'toggleCategory', payload: header.dataset.category });
          });
        });

        // Pack actions
        document.querySelectorAll('.pack-item').forEach(item => {
          const packId = item.dataset.packId;
          const packUrl = item.dataset.packUrl;

          item.querySelector('.preview-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            previewPack(packId, packUrl);
          });

          item.querySelector('.copy-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            vscode.postMessage({ command: 'copyUrl', payload: packUrl });
          });

          item.querySelector('.load-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            loadSamplePack(packId, packUrl);
          });
        });
      }

      // ========== EVENT LISTENERS ==========
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderPackList();
      });

      reloadBtn.addEventListener('click', reloadSamples);

      themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const theme = btn.dataset.theme;
          vscode.postMessage({ command: 'setTheme', payload: theme });
          particles.setTheme(theme);
        });
      });

      // ========== MESSAGE HANDLER ==========
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'updateState') {
          state = { ...state, ...message.payload };
          document.body.setAttribute('data-theme', state.theme);
          themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === state.theme);
          });
          particles.setTheme(state.theme);
          renderPackList();
        }
      });

      // ========== PARTICLE SYSTEM ==========
      ${this._getParticleSystem()}

      // ========== INIT ==========
      log('Sample Browser initializing...', 'info');
      const canvas = document.getElementById('animation-canvas');
      const particles = new ParticleSystem(canvas);
      particles.setTheme(state.theme);
      particles.start();

      vscode.postMessage({ command: 'ready' });
      renderPackList();
      log('Sample Browser ready', 'success');
    `;
  }


  private _getSamplePackData(): string {
    return `
      const CATEGORIES = [
        { id: 'builtin', name: 'Built-in Samples', icon: '📦', expanded: true },
        { id: 'github', name: 'GitHub Collections', icon: '🐙', expanded: false },
        { id: 'external', name: 'External URLs', icon: '🌐', expanded: false },
        { id: 'community', name: 'Community Packs', icon: '👥', expanded: false },
      ];

      const SAMPLE_PACKS = [
        // Built-in (these work with simple names)
        { id: 'tidal-drum-machines', name: 'Tidal Drum Machines', url: 'tidal-drum-machines', category: 'builtin', sampleCount: 683 },
        { id: 'vcsl', name: 'VCSL', url: 'vcsl', category: 'builtin', sampleCount: 128 },
        { id: 'uzu-drumkit', name: 'Uzu Drumkit', url: 'uzu-drumkit', category: 'builtin', sampleCount: 16 },
        { id: 'mridangam', name: 'Mridangam', url: 'mridangam', category: 'builtin', sampleCount: 13 },
        { id: 'piano', name: 'Piano', url: 'piano', category: 'builtin', sampleCount: 1 },

        // External URLs
        { id: 'grbt-samples', name: 'GRBT Samples', url: 'https://samples.grbt.com.au', category: 'external', sampleCount: 629 },
        { id: 'mellotron', name: 'Mellotron', url: 'https://sound.intercrap.com/strudel/mellotron', category: 'external', sampleCount: 24 },

        // GitHub - Major Collections
        { id: 'dirt-samples', name: 'Dirt Samples', url: 'github:tidalcycles/Dirt-Samples', category: 'github', sampleCount: 218, author: 'tidalcycles' },
        { id: 'blu-mar-ten-breaks', name: 'Blu-Mar-Ten Breaks', url: 'github:sonidosingapura/blu-mar-ten/Breaks', category: 'github', sampleCount: 448, author: 'sonidosingapura' },
        { id: 'blu-mar-ten-riffs', name: 'Blu-Mar-Ten Riffs', url: 'github:sonidosingapura/blu-mar-ten/Riffs_Arps_Hits', category: 'github', sampleCount: 260, author: 'sonidosingapura' },
        { id: 'blu-mar-ten-fx', name: 'Blu-Mar-Ten FX', url: 'github:sonidosingapura/blu-mar-ten/FX', category: 'github', sampleCount: 240, author: 'sonidosingapura' },
        { id: 'blu-mar-ten-pads', name: 'Blu-Mar-Ten Pads', url: 'github:sonidosingapura/blu-mar-ten/Pads', category: 'github', sampleCount: 152, author: 'sonidosingapura' },
        { id: 'blu-mar-ten-vocals', name: 'Blu-Mar-Ten Vocals', url: 'github:sonidosingapura/blu-mar-ten/Vocals', category: 'github', sampleCount: 136, author: 'sonidosingapura' },
        { id: 'blu-mar-ten-bass', name: 'Blu-Mar-Ten Bass', url: 'github:sonidosingapura/blu-mar-ten/Bass', category: 'github', sampleCount: 114, author: 'sonidosingapura' },
        { id: 'dough-amiga', name: 'Dough Amiga', url: 'github:Bubobubobubobubo/Dough-Amiga', category: 'github', sampleCount: 116, author: 'Bubobubobubobubo' },
        { id: 'dough-waveforms', name: 'Dough Waveforms', url: 'github:Bubobubobubobubo/Dough-Waveforms', category: 'github', sampleCount: 65, author: 'Bubobubobubobubo' },
        { id: 'dough-fox', name: 'Dough Fox', url: 'github:Bubobubobubobubo/Dough-Fox', category: 'github', sampleCount: 63, author: 'Bubobubobubobubo' },
        { id: 'dough-bourges', name: 'Dough Bourges', url: 'github:Bubobubobubobubo/Dough-Bourges', category: 'github', sampleCount: 45, author: 'Bubobubobubobubo' },
        { id: 'spicule', name: 'Spicule', url: 'github:yaxu/spicule', category: 'github', sampleCount: 75, author: 'yaxu' },
        { id: 'clean-breaks', name: 'Clean Breaks', url: 'github:yaxu/clean-breaks', category: 'github', sampleCount: 32, author: 'yaxu' },
        { id: 'estuary-samples', name: 'Estuary Samples', url: 'github:felixroos/estuary-samples', category: 'github', sampleCount: 19, author: 'felixroos' },

        // Community Packs
        { id: 'samplesKzur', name: 'Samples Kzur', url: 'github:MartinMaguna/samplesKzur', category: 'community', sampleCount: 35, author: 'MartinMaguna' },
        { id: 'randumsample', name: 'Random Sample', url: 'github:mmmgarlic/randumsample', category: 'community', sampleCount: 35, author: 'mmmgarlic' },
        { id: 'studel-beats', name: 'Strudel Beats', url: 'github:mistipher/studel-beats', category: 'community', sampleCount: 32, author: 'mistipher' },
        { id: 'v10101a-samples', name: 'V10101A Samples', url: 'github:sandpills/v10101a-samples', category: 'community', sampleCount: 32, author: 'sandpills' },
        { id: 'ms-teams-sounds', name: 'MS Teams Sounds', url: 'github:AustinOliverHaskell/ms-teams-sounds-strudel', category: 'community', sampleCount: 31, author: 'AustinOliverHaskell' },
        { id: 'proudly-breaks', name: 'Proudly Breaks', url: 'github:proudly-music/breaks', category: 'community', sampleCount: 28, author: 'proudly-music' },
        { id: 'terrorhank-samples', name: 'Terrorhank Samples', url: 'github:terrorhank/samples', category: 'community', sampleCount: 28, author: 'terrorhank' },
        { id: 'k09-samples', name: 'K09 Samples', url: 'github:k09/samples', category: 'community', sampleCount: 27, author: 'k09' },
        { id: 'a-maze', name: 'A-Maze', url: 'github:heavy-lifting/a-maze', category: 'community', sampleCount: 26, author: 'heavy-lifting' },
        { id: 'bs-breaks', name: 'BS Breaks', url: 'github:bsssssss/strudel-samples/bs-breaks', category: 'community', sampleCount: 20, author: 'bsssssss' },
        { id: 'mamal-samples', name: 'Mamal Samples', url: 'github:mamalLivecoder/samples', category: 'community', sampleCount: 19, author: 'mamalLivecoder' },
        { id: 'eddyflux-crate', name: 'Eddyflux Crate', url: 'github:eddyflux/crate', category: 'community', sampleCount: 18, author: 'eddyflux' },
        { id: 'glorkglunk-wavetables', name: 'Glorkglunk Wavetables', url: 'github:kyrsive/glorkglunk-wavetables', category: 'community', sampleCount: 9, author: 'kyrsive' },
        { id: 'strudel-m8-dnb', name: 'M8 DNB Jungle', url: 'github:creativenucleus/strudel-m8-168-dnb-jungle', category: 'community', sampleCount: 8, author: 'creativenucleus' },
      ];
    `;
  }


  private _getParticleSystem(): string {
    return `
      class ParticleSystem {
        constructor(canvas) {
          this.canvas = canvas;
          this.ctx = canvas.getContext('2d');
          this.particles = [];
          this.theme = 'tech';
          this.isRunning = false;
          this.lastTime = 0;
          this.resize();
          window.addEventListener('resize', () => this.resize());
        }

        resize() {
          const dpr = window.devicePixelRatio || 1;
          const rect = this.canvas.getBoundingClientRect();
          this.canvas.width = rect.width * dpr;
          this.canvas.height = rect.height * dpr;
          this.ctx.scale(dpr, dpr);
        }

        setTheme(theme) {
          this.theme = theme;
          this.particles = [];
        }

        start() {
          if (this.isRunning) return;
          this.isRunning = true;
          this.lastTime = performance.now();
          this.animate();
        }

        stop() {
          this.isRunning = false;
        }

        animate() {
          if (!this.isRunning) return;

          const now = performance.now();
          const delta = (now - this.lastTime) / 1000;
          this.lastTime = now;

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.spawnParticles();

          this.particles = this.particles.filter(p => {
            p.life -= delta;
            if (p.life <= 0) return false;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.opacity = Math.min(1, p.life / p.maxLife);
            if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
              p.rotation += p.rotationSpeed * delta;
            }
            this.drawParticle(p);
            return true;
          });

          requestAnimationFrame(() => this.animate());
        }

        spawnParticles() {
          const rect = this.canvas.getBoundingClientRect();
          const spawnRate = this.theme === 'halloween' ? 0.15 : 0.1;

          if (Math.random() < spawnRate) {
            switch (this.theme) {
              case 'tech':
                this.spawnCyberpunkParticle(rect);
                break;
              case 'halloween':
                this.spawnHalloweenParticle(rect);
                break;
              case '8bit':
                this.spawn8BitParticle(rect);
                break;
            }
          }
        }

        spawnCyberpunkParticle(rect) {
          const types = ['neon-line', 'digital-drop', 'glitch'];
          const type = types[Math.floor(Math.random() * types.length)];
          this.particles.push({
            x: Math.random() * rect.width,
            y: type === 'digital-drop' ? -10 : Math.random() * rect.height,
            vx: type === 'glitch' ? (Math.random() - 0.5) * 200 : 0,
            vy: type === 'digital-drop' ? 50 + Math.random() * 100 : (Math.random() - 0.5) * 20,
            size: type === 'neon-line' ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
            opacity: 0.3 + Math.random() * 0.5,
            life: 2 + Math.random() * 3,
            maxLife: 5,
            type,
            color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
          });
        }

        spawnHalloweenParticle(rect) {
          const types = ['ghost', 'bat', 'spark', 'fog'];
          const type = types[Math.floor(Math.random() * types.length)];
          this.particles.push({
            x: type === 'bat' ? (Math.random() > 0.5 ? -20 : rect.width + 20) : Math.random() * rect.width,
            y: type === 'fog' ? rect.height + 10 : Math.random() * rect.height * 0.7,
            vx: type === 'bat' ? (Math.random() > 0.5 ? 80 : -80) + (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 30,
            vy: type === 'ghost' ? -20 - Math.random() * 30 : type === 'fog' ? -15 : (Math.random() - 0.5) * 20,
            size: type === 'ghost' ? 15 + Math.random() * 10 : type === 'bat' ? 12 + Math.random() * 8 : 4 + Math.random() * 4,
            opacity: type === 'fog' ? 0.1 + Math.random() * 0.15 : 0.4 + Math.random() * 0.4,
            life: type === 'fog' ? 8 + Math.random() * 4 : 3 + Math.random() * 4,
            maxLife: type === 'fog' ? 12 : 7,
            type,
            rotation: 0,
            rotationSpeed: type === 'bat' ? 3 + Math.random() * 2 : 0,
            color: type === 'spark' ? '#ff6600' : type === 'ghost' ? '#ffffff' : '#8b00ff'
          });
        }

        spawn8BitParticle(rect) {
          const types = ['pixel-star', 'arcade-spark', 'retro-block'];
          const type = types[Math.floor(Math.random() * types.length)];
          const colors = ['#00ff00', '#ff0000', '#ffff00', '#00ffff', '#ff00ff'];
          this.particles.push({
            x: Math.random() * rect.width,
            y: type === 'arcade-spark' ? rect.height + 5 : Math.random() * rect.height,
            vx: (Math.random() - 0.5) * 60,
            vy: type === 'arcade-spark' ? -80 - Math.random() * 60 : (Math.random() - 0.5) * 40,
            size: 4 + Math.floor(Math.random() * 3) * 2,
            opacity: 0.6 + Math.random() * 0.4,
            life: 2 + Math.random() * 2,
            maxLife: 4,
            type,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }

        drawParticle(p) {
          this.ctx.save();
          this.ctx.globalAlpha = p.opacity;

          switch (p.type) {
            case 'neon-line':
              this.ctx.strokeStyle = p.color;
              this.ctx.lineWidth = 1;
              this.ctx.shadowColor = p.color;
              this.ctx.shadowBlur = 10;
              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(p.x + p.size * 3, p.y + p.size);
              this.ctx.stroke();
              break;

            case 'digital-drop':
              this.ctx.fillStyle = p.color;
              this.ctx.shadowColor = p.color;
              this.ctx.shadowBlur = 8;
              this.ctx.fillRect(p.x, p.y, 2, p.size * 2);
              break;

            case 'glitch':
              this.ctx.fillStyle = p.color;
              this.ctx.fillRect(p.x, p.y, p.size * 4, 2);
              break;

            case 'ghost':
              this.ctx.fillStyle = 'rgba(255, 255, 255, ' + (p.opacity * 0.6) + ')';
              this.ctx.shadowColor = '#ffffff';
              this.ctx.shadowBlur = 15;
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size * 0.6, Math.PI, 0);
              this.ctx.lineTo(p.x + p.size * 0.6, p.y + p.size * 0.8);
              for (let i = 0; i < 3; i++) {
                const waveX = p.x + p.size * 0.6 - (i + 1) * (p.size * 0.4);
                const waveY = p.y + p.size * 0.8 + (i % 2 === 0 ? 5 : -2);
                this.ctx.lineTo(waveX, waveY);
              }
              this.ctx.closePath();
              this.ctx.fill();
              this.ctx.fillStyle = '#000000';
              this.ctx.beginPath();
              this.ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.1, 2, 0, Math.PI * 2);
              this.ctx.arc(p.x + p.size * 0.2, p.y - p.size * 0.1, 2, 0, Math.PI * 2);
              this.ctx.fill();
              break;

            case 'bat':
              this.ctx.save();
              this.ctx.translate(p.x, p.y);
              if (p.rotation) {
                const flapAngle = Math.sin(p.rotation) * 0.3;
                this.ctx.rotate(flapAngle);
              }
              this.ctx.fillStyle = '#1a0a1a';
              this.ctx.shadowColor = '#8b00ff';
              this.ctx.shadowBlur = 5;
              this.ctx.beginPath();
              this.ctx.ellipse(0, 0, p.size * 0.3, p.size * 0.5, 0, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.beginPath();
              this.ctx.moveTo(-p.size * 0.2, 0);
              this.ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.4, -p.size, 0);
              this.ctx.quadraticCurveTo(-p.size * 0.6, p.size * 0.2, -p.size * 0.2, 0);
              this.ctx.fill();
              this.ctx.beginPath();
              this.ctx.moveTo(p.size * 0.2, 0);
              this.ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.4, p.size, 0);
              this.ctx.quadraticCurveTo(p.size * 0.6, p.size * 0.2, p.size * 0.2, 0);
              this.ctx.fill();
              this.ctx.fillStyle = '#ff6600';
              this.ctx.beginPath();
              this.ctx.arc(-p.size * 0.1, -p.size * 0.15, 1.5, 0, Math.PI * 2);
              this.ctx.arc(p.size * 0.1, -p.size * 0.15, 1.5, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.restore();
              break;

            case 'spark':
              this.ctx.fillStyle = p.color;
              this.ctx.shadowColor = '#ff6600';
              this.ctx.shadowBlur = 12;
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
              this.ctx.fill();
              break;

            case 'fog':
              const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
              gradient.addColorStop(0, 'rgba(139, 0, 255, ' + (p.opacity * 0.3) + ')');
              gradient.addColorStop(0.5, 'rgba(139, 0, 255, ' + (p.opacity * 0.15) + ')');
              gradient.addColorStop(1, 'rgba(139, 0, 255, 0)');
              this.ctx.fillStyle = gradient;
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
              this.ctx.fill();
              break;

            case 'pixel-star':
              this.ctx.fillStyle = p.color;
              this.ctx.shadowColor = p.color;
              this.ctx.shadowBlur = 4;
              const s = Math.floor(p.size / 2) * 2;
              this.ctx.fillRect(p.x, p.y - s, s, s * 3);
              this.ctx.fillRect(p.x - s, p.y, s * 3, s);
              break;

            case 'arcade-spark':
              this.ctx.fillStyle = p.color;
              this.ctx.shadowColor = p.color;
              this.ctx.shadowBlur = 6;
              this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
              break;

            case 'retro-block':
              this.ctx.fillStyle = p.color;
              const bs = Math.floor(p.size);
              this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), bs, bs);
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              this.ctx.fillRect(Math.floor(p.x) + 1, Math.floor(p.y) + 1, bs - 2, 2);
              this.ctx.fillRect(Math.floor(p.x) + 1, Math.floor(p.y) + 1, 2, bs - 2);
              break;

            default:
              this.ctx.fillStyle = p.color || '#00ffff';
              this.ctx.shadowColor = p.color || '#00ffff';
              this.ctx.shadowBlur = 8;
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              this.ctx.fill();
          }

          this.ctx.restore();
        }
      }
    `;
  }
}
