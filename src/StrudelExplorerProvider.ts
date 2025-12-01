/**
 * Strudel Explorer - File Browser & Music Player
 * WebviewViewProvider for sidebar integration
 */

import * as vscode from 'vscode';

interface StrudelFile {
  name: string;
  uri: vscode.Uri;
  relativePath: string;
}

interface ExplorerState {
  currentTrack: string | null;
  isPlaying: boolean;
  shuffleMode: boolean;
  theme: 'halloween' | '8bit' | 'tech';
  playlist: string[];
  playlistIndex: number;
}

export class StrudelExplorerProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'strudel-box.explorer';
  
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _files: StrudelFile[] = [];
  private _state: ExplorerState = {
    currentTrack: null,
    isPlaying: false,
    shuffleMode: false,
    theme: 'tech',
    playlist: [],
    playlistIndex: -1
  };
  private _fileWatcher?: vscode.FileSystemWatcher;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._setupFileWatcher();
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

    // Initial file scan
    this._scanFiles();
  }

  private _setupFileWatcher(): void {
    this._fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.strudel');
    
    this._fileWatcher.onDidCreate(() => this._scanFiles());
    this._fileWatcher.onDidDelete(() => this._scanFiles());
    this._fileWatcher.onDidChange((uri) => this._onFileChanged(uri));
  }

  private async _onFileChanged(_uri: vscode.Uri): Promise<void> {
    // Refresh file list - the custom editor handles its own document sync
    await this._scanFiles();
  }

  private async _scanFiles(): Promise<void> {
    const files = await vscode.workspace.findFiles('**/*.strudel', '**/node_modules/**');
    
    this._files = files.map(uri => ({
      name: uri.path.split('/').pop() || '',
      uri,
      relativePath: vscode.workspace.asRelativePath(uri)
    })).sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    this._state.playlist = this._files.map(f => f.relativePath);
    
    // Build tree structure from flat file list
    const tree = this._buildFileTree(this._files);
    // Send both tree structure and flat playlist
    this._sendMessage('updateFiles', { 
      tree, 
      playlist: this._state.playlist 
    });
  }

  private _buildFileTree(files: StrudelFile[]): unknown {
    interface TreeNode {
      name: string;
      path: string;
      type: 'file' | 'folder';
      children?: TreeNode[];
    }
    
    const root: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();
    
    for (const file of files) {
      // Normalize path separators to forward slashes
      const normalizedRelPath = file.relativePath.replace(/\\/g, '/');
      const parts = normalizedRelPath.split('/');
      let currentPath = '';
      let currentLevel = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (isFile) {
          // Add file to current level - use normalized path
          currentLevel.push({
            name: part,
            path: normalizedRelPath,
            type: 'file'
          });
        } else {
          // Check if folder already exists
          let folder = folderMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: []
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      }
    }
    
    // Sort: folders first, then files, both alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(node => {
        if (node.children) {
          node.children = sortNodes(node.children);
        }
        return node;
      });
    };
    
    return sortNodes(root);
  }

  private async _handleMessage(message: { command: string; payload?: unknown }): Promise<void> {
    console.log('[STRUDEL-EXPLORER] Received message:', message.command, message.payload);
    
    switch (message.command) {
      case 'ready':
        await this._scanFiles();
        this._sendMessage('updateState', this._state);
        break;

      case 'play':
        console.log('[STRUDEL-EXPLORER] Play requested for:', message.payload);
        await this._playFile(message.payload as string);
        break;

      case 'requestCode':
        // Player requests code for a track
        await this._playFile(message.payload as string);
        break;

      case 'stop':
        this._state.isPlaying = false;
        this._sendMessage('updateState', this._state);
        break;

      case 'playbackStarted':
        this._state.isPlaying = true;
        break;

      case 'playbackStopped':
        this._state.isPlaying = false;
        break;

      case 'next':
        await this._playNext();
        break;

      case 'previous':
        await this._playPrevious();
        break;

      case 'toggleShuffle':
        this._state.shuffleMode = !this._state.shuffleMode;
        this._sendMessage('updateState', this._state);
        break;

      case 'setTheme':
        this._state.theme = message.payload as 'halloween' | '8bit' | 'tech';
        this._sendMessage('updateState', this._state);
        break;

      case 'openInStrudelCC':
        await this._openInStrudelCC(message.payload as string);
        break;

      case 'openInEditor':
        await this._openInEditor(message.payload as string);
        break;

      case 'refresh':
        await this._scanFiles();
        break;
    }
  }

  private async _playFile(relativePath: string): Promise<void> {
    console.log('[STRUDEL-EXPLORER] _playFile called with:', relativePath);
    
    // Normalize path separators for comparison
    const normalizedPath = relativePath.replace(/\\/g, '/');
    console.log('[STRUDEL-EXPLORER] Normalized path:', normalizedPath);
    console.log('[STRUDEL-EXPLORER] Available files:', this._files.map(f => ({
      original: f.relativePath,
      normalized: f.relativePath.replace(/\\/g, '/')
    })));
    
    const file = this._files.find(f => f.relativePath.replace(/\\/g, '/') === normalizedPath);
    
    if (!file) { 
      console.error('[STRUDEL-EXPLORER] File not found:', relativePath);
      vscode.window.showErrorMessage(`File not found: ${relativePath}`);
      return; 
    }
    
    console.log('[STRUDEL-EXPLORER] Found file:', file.uri.toString());

    try {
      // Read the file content fresh from disk
      const content = await vscode.workspace.fs.readFile(file.uri);
      const code = Buffer.from(content).toString('utf-8');
      
      console.log('[STRUDEL-EXPLORER] Read code length:', code.length);
      console.log('[STRUDEL-EXPLORER] Code preview:', code.substring(0, 100));

      // Send code to the player webview to play
      this._sendMessage('playCode', code, relativePath);
      console.log('[STRUDEL-EXPLORER] Sent playCode message');

      this._state.currentTrack = relativePath;
      this._state.isPlaying = true;
      this._state.playlistIndex = this._state.playlist.indexOf(relativePath);

    } catch (err) {
      vscode.window.showErrorMessage(`Failed to play: ${err}`);
    }
  }

  private async _playNext(): Promise<void> {
    if (this._state.playlist.length === 0) {return;}

    let nextIndex: number;
    if (this._state.shuffleMode) {
      nextIndex = Math.floor(Math.random() * this._state.playlist.length);
    } else {
      nextIndex = (this._state.playlistIndex + 1) % this._state.playlist.length;
    }

    await this._playFile(this._state.playlist[nextIndex]);
  }

  private async _playPrevious(): Promise<void> {
    if (this._state.playlist.length === 0) {return;}

    let prevIndex: number;
    if (this._state.shuffleMode) {
      prevIndex = Math.floor(Math.random() * this._state.playlist.length);
    } else {
      prevIndex = this._state.playlistIndex - 1;
      if (prevIndex < 0) {prevIndex = this._state.playlist.length - 1;}
    }

    await this._playFile(this._state.playlist[prevIndex]);
  }

  private async _openInStrudelCC(relativePath: string): Promise<void> {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const file = this._files.find(f => f.relativePath.replace(/\\/g, '/') === normalizedPath);
    if (!file) {
      console.error('[STRUDEL] File not found for StrudelCC:', relativePath);
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(file.uri);
      const code = Buffer.from(content).toString('utf-8');
      const base64Code = Buffer.from(code).toString('base64');
      const url = `https://strudel.cc/#${base64Code}`;

      const opened = await vscode.env.openExternal(vscode.Uri.parse(url));
      
      if (!opened) {
        // Fallback: copy to clipboard
        await vscode.env.clipboard.writeText(url);
        vscode.window.showInformationMessage('Link copied to clipboard!');
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open in Strudel.cc: ${err}`);
    }
  }

  private async _openInEditor(relativePath: string): Promise<void> {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const file = this._files.find(f => f.relativePath.replace(/\\/g, '/') === normalizedPath);
    if (!file) {
      console.error('[STRUDEL] File not found for editor:', relativePath);
      return;
    }

    await vscode.commands.executeCommand('strudel-box.openInRepl', file.uri);
  }

  private _sendMessage(command: string, payload?: unknown, track?: string): void {
    if (this._view) {
      this._view.webview.postMessage({ command, payload, track });
    }
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
  <title>Strudel Player</title>
  <!-- Strudel Audio Engine -->
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
  <style>
    ${this._getStyles()}
  </style>
</head>
<body data-theme="tech">
  <canvas id="animation-canvas"></canvas>
  <div class="explorer">
    <div class="header">
      <h2>🎵 Strudel Player</h2>
      <div class="theme-buttons">
        <button class="theme-btn" data-theme="tech" title="Tech">⚡</button>
        <button class="theme-btn" data-theme="halloween" title="Halloween">🎃</button>
        <button class="theme-btn" data-theme="8bit" title="8-Bit">👾</button>
      </div>
    </div>

    <div class="now-playing">
      <div class="now-playing-label">Now Playing</div>
      <div class="now-playing-track" id="currentTrack">—</div>
      <div class="player-controls">
        <button id="prevBtn" class="ctrl-btn" title="Previous">⏮</button>
        <button id="playPauseBtn" class="ctrl-btn play-btn" title="Play/Stop">▶</button>
        <button id="nextBtn" class="ctrl-btn" title="Next">⏭</button>
        <button id="shuffleBtn" class="ctrl-btn" title="Shuffle">🔀</button>
      </div>
    </div>

    <div class="file-list-header">
      <span>Files</span>
      <button id="refreshBtn" class="icon-btn" title="Refresh">🔄</button>
    </div>

    <div class="file-list" id="fileList">
      <div class="empty-state">No .strudel files found</div>
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
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

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
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }

      .explorer {
        position: relative;
        z-index: 1;
      }

      /* Theme Variables */
      body[data-theme="tech"] {
        --accent: #00d4ff;
        --accent-dim: #00d4ff40;
        --accent-glow: 0 0 10px #00d4ff80;
        --playing-bg: linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%);
        --file-hover: #00d4ff15;
        --icon-color: #00d4ff;
      }

      body[data-theme="halloween"] {
        --accent: #ff6b00;
        --accent-dim: #ff6b0040;
        --accent-glow: 0 0 10px #ff6b0080;
        --playing-bg: linear-gradient(135deg, #1a0a00 0%, #2d1810 100%);
        --file-hover: #ff6b0015;
        --icon-color: #ff6b00;
      }

      body[data-theme="8bit"] {
        --accent: #00ff41;
        --accent-dim: #00ff4140;
        --accent-glow: 0 0 10px #00ff4180;
        --playing-bg: linear-gradient(135deg, #001a00 0%, #0a2a0a 100%);
        --file-hover: #00ff4115;
        --icon-color: #00ff41;
      }

      .explorer {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        position: relative;
        z-index: 1;
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

      .theme-buttons {
        display: flex;
        gap: 4px;
      }

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

      .now-playing {
        background: var(--playing-bg);
        border: 1px solid var(--accent-dim);
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0;
        text-align: center;
      }

      .now-playing-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--accent);
        opacity: 0.8;
      }

      .now-playing-track {
        font-size: 14px;
        font-weight: 600;
        margin: 8px 0;
        color: var(--vscode-foreground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .player-controls {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
      }

      .ctrl-btn {
        background: var(--vscode-button-secondaryBackground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ctrl-btn:hover {
        border-color: var(--accent);
        box-shadow: var(--accent-glow);
      }

      .ctrl-btn.play-btn {
        width: 40px;
        height: 40px;
        font-size: 16px;
        background: var(--accent-dim);
        border-color: var(--accent);
      }

      .ctrl-btn.active {
        background: var(--accent);
        color: #000;
      }

      .file-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
      }

      .icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 12px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .icon-btn:hover {
        opacity: 1;
      }

      .file-list {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .tree-item {
        user-select: none;
      }

      .folder-header {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s;
        gap: 6px;
      }

      .folder-header:hover {
        background: var(--file-hover);
      }

      .folder-chevron {
        width: 16px;
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        transition: transform 0.15s;
      }

      .folder-header.expanded .folder-chevron {
        transform: rotate(90deg);
      }

      .folder-icon {
        font-size: 14px;
      }

      .folder-name {
        flex: 1;
        font-size: 12px;
        font-weight: 500;
      }

      .folder-children {
        display: none;
        padding-left: 12px;
      }

      .folder-children.expanded {
        display: block;
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        padding-left: 30px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s;
        gap: 8px;
      }

      .file-item:hover {
        background: var(--file-hover);
      }

      .file-item.playing {
        background: var(--accent-dim);
        border-left: 2px solid var(--accent);
      }

      .file-icon {
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: bold;
        border: 1.5px solid var(--icon-color);
        border-radius: 3px;
        color: var(--icon-color);
        flex-shrink: 0;
      }

      .file-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
      }

      .file-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .file-item:hover .file-actions {
        opacity: 1;
      }

      .file-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 4px;
        border-radius: 3px;
        transition: background 0.15s;
      }

      .file-action-btn:hover {
        background: var(--accent-dim);
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
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
    `;
  }

  private _getScript(): string {
    return `
      const vscode = acquireVsCodeApi();
      
      let state = {
        currentTrack: null,
        isPlaying: false,
        shuffleMode: false,
        theme: 'tech',
        playlist: [],
        playlistIndex: -1
      };
      
      let fileTree = [];  // Tree structure for display
      let flatPlaylist = [];  // Flat list of file paths for playback
      let repl = null;
      let currentCode = '';

      // Elements
      const fileList = document.getElementById('fileList');
      const currentTrackEl = document.getElementById('currentTrack');
      const playPauseBtn = document.getElementById('playPauseBtn');
      const shuffleBtn = document.getElementById('shuffleBtn');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      const refreshBtn = document.getElementById('refreshBtn');
      const themeButtons = document.querySelectorAll('.theme-btn');

      // ========== STRUDEL AUDIO ENGINE ==========
      // Store reference to window.initStrudel before defining local function
      const strudelInit = window.initStrudel;
      let samplesLoaded = false;
      let samplesLoading = false;
      
      // Sample sources (same as sampleLoader.ts)
      const DOUGH_SAMPLES_BASE = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
      const SAMPLE_SOURCES = [
        { json: DOUGH_SAMPLES_BASE + '/tidal-drum-machines.json', name: 'Drum Machines' },
        { json: DOUGH_SAMPLES_BASE + '/piano.json', name: 'Piano' },
        { json: DOUGH_SAMPLES_BASE + '/Dirt-Samples.json', name: 'Dirt Samples' },
        { json: DOUGH_SAMPLES_BASE + '/EmuSP12.json', name: 'Emu SP12' },
        { json: DOUGH_SAMPLES_BASE + '/vcsl.json', name: 'VCSL' },
      ];
      
      async function loadSamples() {
        if (samplesLoaded || samplesLoading) return;
        if (!window.samples) {
          console.warn('window.samples not available yet');
          return;
        }
        
        samplesLoading = true;
        console.log('Loading sample libraries...');
        
        let successCount = 0;
        for (const { json, name } of SAMPLE_SOURCES) {
          try {
            console.log('Loading ' + name + '...');
            await window.samples(json);
            successCount++;
            console.log('Loaded ' + name);
          } catch (err) {
            console.warn('Could not load ' + name + ':', err);
          }
        }
        
        // Also load GitHub Dirt-Samples as fallback
        try {
          await window.samples('github:tidalcycles/Dirt-Samples/master');
          successCount++;
          console.log('Loaded Dirt-Samples from GitHub');
        } catch (err) {
          console.warn('Could not load GitHub samples:', err);
        }
        
        samplesLoaded = successCount > 0;
        samplesLoading = false;
        console.log('Sample loading complete. Loaded ' + successCount + ' libraries.');
      }
      
      async function initAudioEngine() {
        if (repl) return;
        if (!strudelInit) {
          console.error('Strudel not loaded from CDN');
          return;
        }
        try {
          repl = await strudelInit();
          console.log('Strudel initialized');
          
          // Load samples AFTER Strudel init (window.samples becomes available)
          await loadSamples();
        } catch (err) {
          console.error('Failed to init Strudel:', err);
        }
      }

      async function playCode(code) {
        await initAudioEngine();
        if (!repl) return;
        
        // Ensure samples are loaded before playing
        if (!samplesLoaded && !samplesLoading) {
          await loadSamples();
        }
        
        try {
          currentCode = code;
          await repl.evaluate(code);
          state.isPlaying = true;
          updateUI();
          vscode.postMessage({ command: 'playbackStarted' });
        } catch (err) {
          console.error('Playback error:', err);
        }
      }

      function stopPlayback() {
        if (repl) {
          repl.stop();
        }
        state.isPlaying = false;
        updateUI();
        vscode.postMessage({ command: 'playbackStopped' });
      }

      // ========== EVENT LISTENERS ==========
      playPauseBtn.addEventListener('click', async () => {
        if (state.isPlaying) {
          stopPlayback();
        } else if (currentCode) {
          await playCode(currentCode);
        } else if (state.currentTrack) {
          vscode.postMessage({ command: 'requestCode', payload: state.currentTrack });
        } else if (flatPlaylist.length > 0) {
          vscode.postMessage({ command: 'requestCode', payload: flatPlaylist[0] });
        }
      });

      prevBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'previous' });
      });

      nextBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'next' });
      });

      shuffleBtn.addEventListener('click', () => {
        state.shuffleMode = !state.shuffleMode;
        updateUI();
        vscode.postMessage({ command: 'toggleShuffle' });
      });

      refreshBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'refresh' });
      });

      themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          vscode.postMessage({ command: 'setTheme', payload: btn.dataset.theme });
        });
      });

      // ========== MESSAGE HANDLER ==========
      window.addEventListener('message', async event => {
        const message = event.data;
        
        switch (message.command) {
          case 'updateFiles':
            fileTree = message.payload.tree || [];
            flatPlaylist = message.payload.playlist || [];
            renderFileList();
            break;
          case 'updateState':
            state = { ...state, ...message.payload };
            updateUI();
            break;
          case 'playCode':
            // Stop current playback first, then play new code
            console.log('[WEBVIEW] Received playCode message');
            console.log('[WEBVIEW] Track:', message.track);
            console.log('[WEBVIEW] Payload type:', typeof message.payload);
            console.log('[WEBVIEW] Payload length:', message.payload ? message.payload.length : 'null/undefined');
            console.log('[WEBVIEW] Payload preview:', message.payload ? message.payload.substring(0, 100) : 'empty');
            
            stopPlayback();
            state.currentTrack = message.track;
            state.playlistIndex = state.playlist.indexOf(message.track);
            currentTrackEl.textContent = message.track ? message.track.split('/').pop() : '—';
            await playCode(message.payload);
            break;
          case 'stop':
            stopPlayback();
            break;
        }
      });

      // Track expanded folders
      let expandedFolders = new Set();
      
      function renderFileList() {
        console.log('[WEBVIEW] renderFileList called');
        console.log('[WEBVIEW] fileTree:', JSON.stringify(fileTree, null, 2));
        console.log('[WEBVIEW] flatPlaylist:', flatPlaylist);
        
        if (!fileTree || fileTree.length === 0) {
          fileList.innerHTML = '<div class="empty-state">No .strudel files found</div>';
          return;
        }

        fileList.innerHTML = renderTreeNodes(fileTree, 0);
        attachTreeEventHandlers();
      }
      
      function renderTreeNodes(nodes, depth) {
        return nodes.map(node => {
          if (node.type === 'folder') {
            const isExpanded = expandedFolders.has(node.path);
            return \`
              <div class="tree-item" data-folder-path="\${node.path}">
                <div class="folder-header \${isExpanded ? 'expanded' : ''}" data-folder="\${node.path}">
                  <span class="folder-chevron">▶</span>
                  <span class="folder-icon">\${isExpanded ? '📂' : '📁'}</span>
                  <span class="folder-name">\${node.name}</span>
                </div>
                <div class="folder-children \${isExpanded ? 'expanded' : ''}" data-folder-children="\${node.path}">
                  \${node.children ? renderTreeNodes(node.children, depth + 1) : ''}
                </div>
              </div>
            \`;
          } else {
            const isPlaying = state.currentTrack === node.path;
            return \`
              <div class="file-item \${isPlaying ? 'playing' : ''}" data-path="\${node.path}">
                \${isPlaying && state.isPlaying ? '<div class="playing-indicator"></div>' : '<div class="file-icon">S</div>'}
                <span class="file-name" title="\${node.path}">\${node.name}</span>
                <div class="file-actions">
                  <button class="file-action-btn play-file-btn" title="Play">▶</button>
                  <button class="file-action-btn link-btn" title="Open in Strudel.cc">🔗</button>
                  <button class="file-action-btn edit-btn" title="Open in Editor">📝</button>
                </div>
              </div>
            \`;
          }
        }).join('');
      }
      
      // Use event delegation for all clicks - more reliable for dynamic content
      fileList.addEventListener('click', (e) => {
        const target = e.target;
        
        // Handle folder header clicks
        const folderHeader = target.closest('.folder-header');
        if (folderHeader) {
          e.stopPropagation();
          const folderPath = folderHeader.dataset.folder;
          const children = fileList.querySelector('[data-folder-children="' + folderPath + '"]');
          
          if (expandedFolders.has(folderPath)) {
            expandedFolders.delete(folderPath);
            folderHeader.classList.remove('expanded');
            children.classList.remove('expanded');
            folderHeader.querySelector('.folder-icon').textContent = '📁';
          } else {
            expandedFolders.add(folderPath);
            folderHeader.classList.add('expanded');
            children.classList.add('expanded');
            folderHeader.querySelector('.folder-icon').textContent = '📂';
          }
          return;
        }
        
        // Handle play button clicks
        if (target.closest('.play-file-btn')) {
          e.stopPropagation();
          const fileItem = target.closest('.file-item');
          if (fileItem) {
            const path = fileItem.dataset.path;
            console.log('[WEBVIEW] Play button clicked for:', path);
            vscode.postMessage({ command: 'play', payload: path });
          }
          return;
        }
        
        // Handle link button clicks
        if (target.closest('.link-btn')) {
          e.stopPropagation();
          const fileItem = target.closest('.file-item');
          if (fileItem) {
            const path = fileItem.dataset.path;
            console.log('[WEBVIEW] Link button clicked for:', path);
            vscode.postMessage({ command: 'openInStrudelCC', payload: path });
          }
          return;
        }
        
        // Handle edit button clicks
        if (target.closest('.edit-btn')) {
          e.stopPropagation();
          const fileItem = target.closest('.file-item');
          if (fileItem) {
            const path = fileItem.dataset.path;
            console.log('[WEBVIEW] Edit button clicked for:', path);
            vscode.postMessage({ command: 'openInEditor', payload: path });
          }
          return;
        }
      });
      
      // Handle double-click separately
      fileList.addEventListener('dblclick', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) {
          const path = fileItem.dataset.path;
          console.log('[WEBVIEW] Double-click on file:', path);
          vscode.postMessage({ command: 'play', payload: path });
        }
      });
      
      function attachTreeEventHandlers() {
        // Event delegation is used instead - this function is now just for logging
        const fileItems = fileList.querySelectorAll('.file-item');
        console.log('[WEBVIEW] Total file items in DOM:', fileItems.length);
        fileItems.forEach(item => {
          console.log('[WEBVIEW] File in DOM:', item.dataset.path);
        });
      }

      function updateUI() {
        // Update theme
        document.body.dataset.theme = state.theme;
        themeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.theme === state.theme);
        });

        // Update now playing
        currentTrackEl.textContent = state.currentTrack 
          ? state.currentTrack.split('/').pop() 
          : '—';

        // Update play/pause button
        playPauseBtn.textContent = state.isPlaying ? '⏹' : '▶';
        playPauseBtn.title = state.isPlaying ? 'Stop' : 'Play';

        // Update shuffle button
        shuffleBtn.classList.toggle('active', state.shuffleMode);

        // Re-render file list to update playing state
        renderFileList();
      }

      // Initialize
      vscode.postMessage({ command: 'ready' });

      // ========== THEME ANIMATIONS ==========
      const canvas = document.getElementById('animation-canvas');
      const ctx = canvas.getContext('2d');
      let particles = [];
      let animationId = null;

      function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Particle classes for each theme
      class TechParticle {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 2 + 1;
          this.speedX = (Math.random() - 0.5) * 0.5;
          this.speedY = (Math.random() - 0.5) * 0.5;
          this.opacity = Math.random() * 0.5 + 0.2;
          this.glitch = Math.random() > 0.95;
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.glitch) {
            this.x += (Math.random() - 0.5) * 10;
            this.glitch = Math.random() > 0.95;
          }
          if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
          }
        }
        draw() {
          ctx.fillStyle = 'rgba(0, 212, 255, ' + this.opacity + ')';
          ctx.fillRect(this.x, this.y, this.size, this.size);
          // Scan line effect
          if (Math.random() > 0.99) {
            ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
            ctx.fillRect(0, this.y, canvas.width, 1);
          }
        }
      }

      class HalloweenParticle {
        constructor() {
          this.reset();
          this.type = ['🎃', '👻', '🦇', '🕷️', '💀', '🕸️'][Math.floor(Math.random() * 6)];
        }
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = -20;
          this.size = Math.random() * 12 + 8;
          this.speedY = Math.random() * 1 + 0.5;
          this.speedX = (Math.random() - 0.5) * 0.5;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotationSpeed = (Math.random() - 0.5) * 0.05;
          this.wobble = Math.random() * Math.PI * 2;
          this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        }
        update() {
          this.y += this.speedY;
          this.wobble += this.wobbleSpeed;
          this.x += Math.sin(this.wobble) * 0.5 + this.speedX;
          this.rotation += this.rotationSpeed;
          if (this.y > canvas.height + 20) {
            this.reset();
          }
        }
        draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          ctx.font = this.size + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.type, 0, 0);
          ctx.restore();
        }
      }

      class EightBitParticle {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = -10;
          this.size = Math.floor(Math.random() * 3 + 2) * 2;
          this.speedY = Math.random() * 2 + 1;
          this.color = ['#00ff41', '#00cc33', '#009926', '#33ff66'][Math.floor(Math.random() * 4)];
          this.trail = [];
        }
        update() {
          this.trail.push({ x: this.x, y: this.y });
          if (this.trail.length > 5) this.trail.shift();
          this.y += this.speedY;
          if (this.y > canvas.height + 10) {
            this.reset();
          }
        }
        draw() {
          // Draw trail
          this.trail.forEach((pos, i) => {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = this.color.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba').replace('#', '');
            ctx.globalAlpha = alpha;
            ctx.fillRect(Math.floor(pos.x / 4) * 4, Math.floor(pos.y / 4) * 4, this.size, this.size);
          });
          ctx.globalAlpha = 1;
          // Draw pixel
          ctx.fillStyle = this.color;
          ctx.fillRect(Math.floor(this.x / 4) * 4, Math.floor(this.y / 4) * 4, this.size, this.size);
        }
      }

      function initParticles(theme) {
        particles = [];
        const count = theme === 'halloween' ? 15 : 30;
        for (let i = 0; i < count; i++) {
          if (theme === 'tech') {
            particles.push(new TechParticle());
          } else if (theme === 'halloween') {
            particles.push(new HalloweenParticle());
          } else if (theme === '8bit') {
            particles.push(new EightBitParticle());
          }
        }
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // CRT effect for 8bit
        if (state.theme === '8bit') {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.02)';
          for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 2);
          }
        }

        particles.forEach(p => {
          p.update();
          p.draw();
        });

        animationId = requestAnimationFrame(animate);
      }

      // Start animation with current theme
      function startAnimation() {
        if (animationId) cancelAnimationFrame(animationId);
        initParticles(state.theme);
        animate();
      }

      // Watch for theme changes
      const originalUpdateUI = updateUI;
      updateUI = function() {
        const prevTheme = document.body.dataset.theme;
        originalUpdateUI();
        if (prevTheme !== state.theme) {
          startAnimation();
        }
      };

      // Initial start
      setTimeout(startAnimation, 100);
    `;
  }

  private _getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  public dispose(): void {
    this._fileWatcher?.dispose();
  }
}
