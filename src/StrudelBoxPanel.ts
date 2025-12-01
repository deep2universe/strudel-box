/**
 * Strudel Box - Webview Panel Management
 * Uses @strudel/web for audio + CodeMirror for editing
 */

import * as vscode from 'vscode';

export class StrudelBoxPanel {
  public static currentPanel: StrudelBoxPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.webview.onDidReceiveMessage(
      this._handleMessage.bind(this),
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'strudel-box',
      'Strudel Box',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')]
      }
    );

    StrudelBoxPanel.currentPanel = new StrudelBoxPanel(panel, extensionUri);
  }

  public sendMessage(command: string, payload?: unknown): void {
    this._panel.webview.postMessage({ command, payload });
  }

  public loadCode(code: string): void {
    this.sendMessage('loadCode', code);
  }

  public playCode(code: string): void {
    // Load and immediately play - handles AudioContext initialization
    this.sendMessage('playCode', code);
  }

  public hush(): void {
    this.sendMessage('hush');
  }

  public setTheme(theme: string): void {
    this.sendMessage('setTheme', theme);
  }

  public requestSave(): void {
    this.sendMessage('requestSave');
  }

  public async getCode(): Promise<string> {
    return new Promise((resolve) => {
      const handler = this._panel.webview.onDidReceiveMessage((message) => {
        if (message.command === 'codeResponse') {
          handler.dispose();
          resolve(message.payload as string);
        }
      });
      this.sendMessage('getCode');
      setTimeout(() => {
        handler.dispose();
        resolve('');
      }, 5000);
    });
  }

  private async _handleMessage(message: { command: string; payload?: unknown }): Promise<void> {
    switch (message.command) {
      case 'ready':
        console.log('[STRUDEL-BOX] Webview ready');
        break;
      case 'error':
        vscode.window.showErrorMessage(`Strudel Box: ${message.payload}`);
        break;
      case 'saveCode':
        await this._saveCode(message.payload as string);
        break;
      case 'codeResponse':
        break;
      case 'log':
        console.log('[STRUDEL-BOX]', message.payload);
        break;
    }
  }

  private async _saveCode(code: string): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      filters: { 'Strudel Pattern': ['strudel', 'js'] },
      saveLabel: 'Save Pattern'
    });
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
      vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
    }
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const distUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));

    const nonce = this._getNonce();

    const defaultCode = `// 🎵 Welcome to Strudel Box!
// Press Ctrl+Enter to play, Ctrl+. to stop

s("bd sd [~ bd] hh*4")
  .room(0.3)`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net ${webview.cspSource};
    style-src 'unsafe-inline' ${webview.cspSource} https://unpkg.com https://fonts.googleapis.com;
    font-src ${webview.cspSource} https://fonts.gstatic.com https://unpkg.com https:;
    img-src ${webview.cspSource} https: data: blob:;
    connect-src 
      https://unpkg.com 
      https://cdn.jsdelivr.net 
      https://raw.githubusercontent.com 
      https://*.strudel.cc 
      https://strudel.cc
      https://freesound.org
      https://*.freesound.org
      https://sampleswap.org
      https://*.sampleswap.org
      https:;
    media-src https: blob: data:;
    worker-src blob: data:;
  ">
  <title>Strudel Box</title>
  
  <!-- Strudel Web - Audio Engine -->
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
  
  <link rel="stylesheet" href="${styleUri}">
  <script nonce="${nonce}">window.INITIAL_CODE = ${JSON.stringify(defaultCode)};</script>
</head>
<body>
  <!-- Particle Effects Canvas (Animated Backgrounds) -->
  <canvas id="particles-canvas"></canvas>
  
  <div id="app">
    <header>
      <div class="header-left">
        <h1>🎵 Strudel Box</h1>
        <span class="tagline">Code your beats. Visualize your sound. Share your vibe.</span>
      </div>
      <div class="theme-switcher">
        <button class="theme-btn active" data-theme="default" title="Cyberpunk">🌃</button>
        <button class="theme-btn" data-theme="halloween" title="Halloween">🎃</button>
        <button class="theme-btn" data-theme="8bit" title="8-Bit">👾</button>
      </div>
    </header>
    
    <main>
      <!-- CodeMirror Editor -->
      <div id="editor-container">
        <div id="editor"></div>
      </div>
      
      <div id="controls">
        <button id="play" class="btn btn-play">▶ Play</button>
        <button id="stop" class="btn btn-stop">⏹ Stop</button>
        <button id="save" class="btn btn-save">💾 Save</button>
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

  private _getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

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
