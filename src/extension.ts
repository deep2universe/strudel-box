/**
 * Strudel Box - VS Code Extension
 * "Code your beats. Visualize your sound. Share your vibe."
 */

import * as vscode from 'vscode';
import { StrudelBoxPanel } from './StrudelBoxPanel';

const BUILD_ID = 'BUILD_2024_001'; // Change this to verify reload

export function activate(context: vscode.ExtensionContext) {
  console.log(`[STRUDEL-BOX] Extension activated - ${BUILD_ID}`);
  console.log(`[STRUDEL-BOX] Extension URI: ${context.extensionUri.fsPath}`);

  // Command: Open Strudel Box
  const openCommand = vscode.commands.registerCommand('strudel-box.open', () => {
    console.log(`[STRUDEL-BOX] Opening panel - ${BUILD_ID}`);
    StrudelBoxPanel.createOrShow(context.extensionUri);
  });

  // Command: Hush (stop all audio)
  const hushCommand = vscode.commands.registerCommand('strudel-box.hush', () => {
    if (StrudelBoxPanel.currentPanel) {
      StrudelBoxPanel.currentPanel.hush();
    } else {
      vscode.window.showInformationMessage('Strudel Box is not open');
    }
  });

  // Command: Load File
  const loadFileCommand = vscode.commands.registerCommand('strudel-box.loadFile', async () => {
    const uri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Strudel': ['strudel'], 'JavaScript': ['js'] },
      openLabel: 'Load Pattern'
    });

    if (uri && uri[0]) {
      const content = await vscode.workspace.fs.readFile(uri[0]);
      const code = Buffer.from(content).toString('utf-8');
      
      // Open panel if not already open
      StrudelBoxPanel.createOrShow(context.extensionUri);
      
      // Wait a bit for panel to initialize, then load code
      setTimeout(() => {
        if (StrudelBoxPanel.currentPanel) {
          StrudelBoxPanel.currentPanel.loadCode(code);
        }
      }, 500);
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
    // Get URI from context menu or active editor
    const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
    
    if (!fileUri) {
      vscode.window.showWarningMessage('No file selected');
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(fileUri);
      const code = Buffer.from(content).toString('utf-8');
      
      // Open panel
      StrudelBoxPanel.createOrShow(context.extensionUri);
      
      // Wait for panel to initialize, then load code
      setTimeout(() => {
        if (StrudelBoxPanel.currentPanel) {
          StrudelBoxPanel.currentPanel.loadCode(code);
        }
      }, 500);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open file: ${err}`);
    }
  });

  context.subscriptions.push(
    openCommand,
    hushCommand,
    loadFileCommand,
    setThemeCommand,
    saveCommand,
    openInReplCommand
  );
}

export function deactivate() {
  // Cleanup handled by panel disposal
}
