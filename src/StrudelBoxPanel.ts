/**
 * Strudel Box - Webview Panel Management
 */

import * as vscode from 'vscode';

export class StrudelBoxPanel {
  public static currentPanel: StrudelBoxPanel | undefined;
  
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    
    // Set HTML content
    this._panel.webview.html = this._getHtmlForWebview();
    
    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      this._handleMessage.bind(this),
      null,
      this._disposables
    );
    
    // Handle panel disposal
    this._panel.onDidDispose(
      () => this.dispose(),
      null,
      this._disposables
    );
  }

  private static readonly PANEL_BUILD_ID = 'PANEL_BUILD_2024_001';

  /**
   * Create or show the Strudel Box panel
   */
  public static createOrShow(extensionUri: vscode.Uri): void {
    console.log(`[STRUDEL-BOX-PANEL] createOrShow called - ${StrudelBoxPanel.PANEL_BUILD_ID}`);
    console.log(`[STRUDEL-BOX-PANEL] extensionUri: ${extensionUri.fsPath}`);
    
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    // If panel exists, reveal it
    if (StrudelBoxPanel.currentPanel) {
      console.log('[STRUDEL-BOX-PANEL] Panel exists, revealing');
      StrudelBoxPanel.currentPanel._panel.reveal(column);
      return;
    }

    console.log('[STRUDEL-BOX-PANEL] Creating new panel');
    
    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      'strudel-box',
      'Strudel-Box-REPL',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
        ]
      }
    );

    console.log('[STRUDEL-BOX-PANEL] Panel created, initializing StrudelBoxPanel');
    StrudelBoxPanel.currentPanel = new StrudelBoxPanel(panel, extensionUri);
  }

  /**
   * Send message to webview
   */
  public sendMessage(command: string, payload?: unknown): void {
    this._panel.webview.postMessage({ command, payload });
  }

  /**
   * Load code into the editor
   */
  public loadCode(code: string): void {
    this.sendMessage('loadCode', code);
  }

  /**
   * Stop all audio
   */
  public hush(): void {
    this.sendMessage('hush');
  }

  /**
   * Set theme
   */
  public setTheme(theme: string): void {
    this.sendMessage('setTheme', theme);
  }

  /**
   * Request save from webview
   */
  public requestSave(): void {
    this.sendMessage('requestSave');
  }

  /**
   * Handle messages from webview
   */
  private async _handleMessage(message: { command: string; payload?: unknown }): Promise<void> {
    switch (message.command) {
      case 'ready':
        console.log('Strudel Box webview ready');
        break;
        
      case 'error':
        vscode.window.showErrorMessage(`Strudel Box: ${message.payload}`);
        break;
        
      case 'saveCode':
        await this._saveCode(message.payload as string);
        break;
        
      case 'log':
        console.log('Strudel Box:', message.payload);
        break;
    }
  }

  /**
   * Save code to file
   */
  private async _saveCode(code: string): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      filters: { 'Strudel': ['strudel'] },
      saveLabel: 'Save Pattern'
    });
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
      vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
    }
  }

  /**
   * Generate HTML for webview
   */
  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const distUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
    
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));
    
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline' data: blob: https://unpkg.com https://cdn.jsdelivr.net https://*.strudel.cc;
    script-src-elem 'nonce-${nonce}' 'unsafe-inline' data: blob: https://unpkg.com https://cdn.jsdelivr.net https://*.strudel.cc;
    style-src ${webview.cspSource} 'unsafe-inline';
    font-src ${webview.cspSource} https://fonts.gstatic.com https://*.strudel.cc;
    img-src ${webview.cspSource} https: data: blob:;
    connect-src https: data: blob:;
    media-src https: blob: data:;
    worker-src blob: data:;
  ">
  <title>Strudel Box</title>
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <!-- Particle Effects Canvas -->
  <canvas id="particles-canvas"></canvas>
  
  <div id="app">
    <header>
      <div class="header-left">
        <h1>🎵 Strudel Box</h1>
        <span class="tagline">Code your beats. Visualize your sound. Share your vibe.</span>
      </div>
      
      <!-- Theme Switcher -->
      <div class="theme-switcher">
        <button class="theme-btn active" data-theme="default" title="Cyberpunk Theme">🌃</button>
        <button class="theme-btn" data-theme="halloween" title="Halloween Theme">🎃</button>
        <button class="theme-btn" data-theme="8bit" title="8-Bit Theme">👾</button>
      </div>
    </header>
    
    <main>
      <div id="editor-container">
        <div id="editor"></div>
      </div>
      
      <div id="controls">
        <button id="play" class="btn btn-play">
          <span class="btn-icon"></span>
          <span class="btn-text">▶ Play</span>
        </button>
        <button id="stop" class="btn btn-stop">
          <span class="btn-icon"></span>
          <span class="btn-text">⏹ Stop</span>
        </button>
        <span id="status">Ready</span>
        <div class="keyboard-hints">
          <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Play</span>
          <span><kbd>Ctrl</kbd>+<kbd>.</kbd> Stop</span>
        </div>
      </div>
    </main>
  </div>
  
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Dispose panel and cleanup
   */
  public dispose(): void {
    StrudelBoxPanel.currentPanel = undefined;
    this._panel.dispose();
    
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

/**
 * Generate a random nonce for CSP
 */
function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
