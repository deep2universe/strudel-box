/**
 * Strudel Box - Webview Panel Management
 * Uses iframe with strudel.cc for full feature support
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

  public hush(): void {
    this.sendMessage('hush');
  }

  public setTheme(theme: string): void {
    this.sendMessage('setTheme', theme);
  }

  public requestSave(): void {
    this.sendMessage('requestSave');
  }

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

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const distUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));

    const defaultCode = `// 🎵 Strudel Box
// Press Ctrl+Enter to play, Ctrl+. to stop

note("c3 e3 g3 c4")
  .sound("sawtooth")
  .lpf(800)
  .room(0.3)`;

    // Base64 encode the default code for the iframe URL
    const encodedCode = Buffer.from(defaultCode).toString('base64');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'unsafe-eval' 'unsafe-inline' ${webview.cspSource};
    style-src 'unsafe-inline' ${webview.cspSource};
    font-src ${webview.cspSource} https: data:;
    img-src ${webview.cspSource} https: data: blob:;
    frame-src https://strudel.cc https://*.strudel.cc;
    connect-src https: wss: data: blob:;
  ">
  <title>Strudel Box</title>
  <link rel="stylesheet" href="${styleUri}">
  <style>
    #strudel-iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: var(--border-radius);
    }
    #editor-wrapper {
      flex: 1;
      min-height: 400px;
      border-radius: var(--border-radius);
      overflow: hidden;
      border: 1px solid var(--bg-tertiary);
    }
    #editor-wrapper:focus-within {
      border-color: var(--accent-primary);
      box-shadow: var(--glow-primary);
    }
  </style>
</head>
<body>
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
      <div id="editor-wrapper">
        <iframe 
          id="strudel-iframe"
          src="https://strudel.cc/#${encodedCode}"
          allow="autoplay; microphone"
        ></iframe>
      </div>
      
      <div id="controls">
        <span id="status">Full Strudel REPL - All features available!</span>
        <div class="keyboard-hints">
          <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Play</span>
          <span><kbd>Ctrl</kbd>+<kbd>.</kbd> Stop</span>
        </div>
      </div>
    </main>
  </div>
  
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose(): void {
    StrudelBoxPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
