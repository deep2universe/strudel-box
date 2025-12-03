/**
 * Strudel Box - VS Code Extension
 * "Code your beats. Visualize your sound. Share your vibe."
 */

import * as vscode from 'vscode';
import { StrudelBoxPanel } from './StrudelBoxPanel';
import { StrudelExplorerProvider } from './StrudelExplorerProvider';
import { SampleBrowserProvider } from './SampleBrowserProvider';

// Debug flag for this file
const DEBUG = false;

export function activate(context: vscode.ExtensionContext) {
  if (DEBUG) { console.log('[STRUDEL-BOX] Extension activated'); }

  // Register Strudel Explorer (Sidebar File Browser & Player)
  const explorerProvider = new StrudelExplorerProvider(context.extensionUri);
  const explorerView = vscode.window.registerWebviewViewProvider(
    StrudelExplorerProvider.viewType,
    explorerProvider
  );

  // Register Sample Browser (Sidebar Sample Pack Discovery)
  const sampleBrowserProvider = new SampleBrowserProvider(context.extensionUri);
  const sampleBrowserView = vscode.window.registerWebviewViewProvider(
    SampleBrowserProvider.viewType,
    sampleBrowserProvider
  );

  // Command: Open Strudel Box
  const openCommand = vscode.commands.registerCommand('strudel-box.open', () => {
    StrudelBoxPanel.createOrShow(context.extensionUri);
  });

  // Command: Focus Strudel Explorer
  const focusExplorerCommand = vscode.commands.registerCommand('strudel-box.focusExplorer', () => {
    vscode.commands.executeCommand('strudel-box.explorer.focus');
  });

  // Command: Hush (stop all audio)
  const hushCommand = vscode.commands.registerCommand('strudel-box.hush', () => {
    // Stop in standalone panel
    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.hush();
    }
    // Stop in all custom editors
    StrudelEditorProvider.hushAll();
  });

  // Command: Evaluate active editor (play)
  const evaluateActiveCommand = vscode.commands.registerCommand('strudel-box.evaluateActive', () => {
    StrudelEditorProvider.evaluateActive();
  });

  // Command: Load File
  const loadFileCommand = vscode.commands.registerCommand('strudel-box.loadFile', async () => {
    const uri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Strudel': ['strudel'], 'JavaScript': ['js'] },
      openLabel: 'Load Pattern'
    });

    if (uri && uri[0]) {
      await openFileInStrudelBox(context.extensionUri, uri[0]);
    }
  });

  // Command: Set Theme
  const setThemeCommand = vscode.commands.registerCommand('strudel-box.setTheme', async () => {
    const theme = await vscode.window.showQuickPick(
      [
        { label: 'Default', description: 'Cyberpunk neon (cyan/magenta)', value: 'default' },
        { label: 'Halloween', description: 'Spooky orange and purple', value: 'halloween' },
        { label: '8-Bit', description: 'Retro green with CRT effect', value: '8bit' }
      ],
      { placeHolder: 'Select a theme' }
    );

    if (theme && StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.setTheme(theme.value);
    }
  });

  // Command: Save Pattern
  const saveCommand = vscode.commands.registerCommand('strudel-box.save', () => {
    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.requestSave();
    } else {
      vscode.window.showInformationMessage('Strudel Box is not open');
    }
  });

  // Command: Open in Strudel Box (from context menu)
  const openInReplCommand = vscode.commands.registerCommand('strudel-box.openInRepl', async (uri?: vscode.Uri) => {
    const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
    if (!fileUri) {
      vscode.window.showWarningMessage('No file selected');
      return;
    }
    await openFileInStrudelBox(context.extensionUri, fileUri);
  });

  // Custom Editor Provider for .strudel files (double-click to open)
  const customEditorProvider = vscode.window.registerCustomEditorProvider(
    'strudel-box.strudelEditor',
    new StrudelEditorProvider(context.extensionUri),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false
    }
  );

  context.subscriptions.push(
    explorerView,
    sampleBrowserView,
    openCommand,
    focusExplorerCommand,
    hushCommand,
    evaluateActiveCommand,
    loadFileCommand,
    setThemeCommand,
    saveCommand,
    openInReplCommand,
    customEditorProvider
  );
}

async function openFileInStrudelBox(extensionUri: vscode.Uri, fileUri: vscode.Uri): Promise<void> {
  try {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const code = Buffer.from(content).toString('utf-8');
    
    StrudelBoxPanel.createOrShow(extensionUri);
    
    setTimeout(() => {
      if (StrudelBoxPanel.currentPanel) {
        StrudelBoxPanel.currentPanel.loadCode(code);
      }
    }, 500);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to open file: ${err}`);
  }
}

/**
 * Custom Editor Provider for .strudel files
 * Opens files directly in Strudel Box REPL when double-clicked
 */
class StrudelEditorProvider implements vscode.CustomTextEditorProvider {
  // Track active webview panels by document URI
  private static _activeWebviews: Map<string, vscode.WebviewPanel> = new Map();

  constructor(private readonly extensionUri: vscode.Uri) {}

  // Static method to send evaluate command to active editor
  public static evaluateActive(): void {
    // Find the most recently focused webview
    for (const [, panel] of StrudelEditorProvider._activeWebviews) {
      if (panel.active) {
        panel.webview.postMessage({ command: 'evaluate' });
        return;
      }
    }
    // If no active panel, try the first one
    const firstPanel = StrudelEditorProvider._activeWebviews.values().next().value;
    if (firstPanel) {
      firstPanel.webview.postMessage({ command: 'evaluate' });
    }
  }

  // Static method to stop playback on all editors
  public static hushAll(): void {
    for (const [, panel] of StrudelEditorProvider._activeWebviews) {
      panel.webview.postMessage({ command: 'hush' });
    }
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const docUri = document.uri.toString();

    // Track this webview
    StrudelEditorProvider._activeWebviews.set(docUri, webviewPanel);

    // Configure webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist')]
    };

    // Set HTML content
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.getText());

    // Flag to prevent reload loop during save
    let isSaving = false;

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'ready':
          webviewPanel.webview.postMessage({ command: 'loadCode', payload: document.getText() });
          break;
        case 'saveCode':
          isSaving = true;
          try {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
              document.uri,
              new vscode.Range(0, 0, document.lineCount, 0),
              message.payload
            );
            await vscode.workspace.applyEdit(edit);
            // Actually save the document to disk
            await document.save();
            vscode.window.showInformationMessage(`Saved: ${vscode.workspace.asRelativePath(document.uri)}`);
          } finally {
            // Reset flag after a short delay to allow document change events to settle
            setTimeout(() => { isSaving = false; }, 100);
          }
          break;
        case 'error':
          vscode.window.showErrorMessage(`Strudel Box: ${message.payload}`);
          break;
      }
    });

    // Update webview when document changes externally (not from our save)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !isSaving) {
        // Only reload if change came from outside (e.g., git checkout, external editor)
        webviewPanel.webview.postMessage({ command: 'loadCode', payload: document.getText() });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      StrudelEditorProvider._activeWebviews.delete(docUri);
    });
  }

  private getHtmlForWebview(webview: vscode.Webview, initialCode: string): string {
    const distUri = vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));
    const nonce = this.getNonce();

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
    connect-src https: wss: data: blob:;
    media-src https: blob: data:;
    worker-src blob: data:;
  ">
  <title>Strudel Box</title>
  <script nonce="${nonce}" src="https://unpkg.com/@strudel/web@latest"></script>
  <link rel="stylesheet" href="${styleUri}">
  <script nonce="${nonce}">window.INITIAL_CODE = ${JSON.stringify(initialCode)};</script>
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

  private getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
}

export function deactivate() {
  // Cleanup handled by panel disposal
}
