---
inclusion: always
---

# Project Structure

## Directory Layout

| Path | Purpose |
|------|---------|
| `src/` | Extension host (Node.js/CommonJS) |
| `src/extension.ts` | Entry point, command registration, custom editor provider |
| `src/StrudelBoxPanel.ts` | Webview panel lifecycle, HTML generation, message handling |
| `webview-ui/` | Webview frontend (browser/ESM, separate Vite build) |
| `webview-ui/src/main.ts` | Entry point, Strudel REPL integration, state management |
| `webview-ui/src/editor.ts` | CodeMirror 6 setup and keybindings |
| `webview-ui/src/vscode.ts` | VS Code API bridge (`postMessage`, `setState`, `getState`) |
| `webview-ui/src/visualizer.ts` | Audio visualizer canvas rendering |
| `webview-ui/src/particles.ts` | Theme-aware particle background effects |
| `dist/` | Built extension output (CommonJS) |
| `webview-ui/dist/` | Built webview assets (served to webview) |

## Two-Process Architecture

Extension Host (Node.js) and Webview (Browser) run in separate contexts with different module systems.

### Extension Host Responsibilities
- Webview panel lifecycle (`StrudelBoxPanel.createOrShow`)
- File I/O via `vscode.workspace.fs`
- Command registration in `package.json` contributions
- Custom editor provider for `.strudel` files

### Webview Responsibilities
- Strudel audio engine (`@strudel/web` from CDN)
- CodeMirror 6 editor instance
- Audio visualizer and particle effects
- Theme switching and state persistence

## Message Protocol

Use `{ command, payload }` objects for all communication:

```typescript
// Extension → Webview
this._panel.webview.postMessage({ command: 'loadCode', payload: code });

// Webview → Extension  
postMessage('saveCode', getCode(editor));
```

Supported commands:
- `loadCode` / `getCode` / `codeResponse` - Editor content
- `evaluate` / `stop` / `hush` - Audio control
- `setTheme` - Theme switching
- `requestSave` / `saveCode` - File persistence
- `ready` / `error` / `log` - Lifecycle events

## Key Patterns

### Singleton Panel
`StrudelBoxPanel.currentPanel` ensures only one panel instance exists. Use `createOrShow()` to reveal existing or create new.

### State Persistence
Webview state survives VS Code reload via `saveState()`/`getState()` in `vscode.ts`. State must be JSON-serializable.

### Audio Initialization
AudioContext requires user gesture. Pattern: initialize Strudel lazily on first play action, not on panel load.

### CSP Allowlist
External scripts limited to unpkg CDN. Never bundle `@strudel/web`—it breaks audio worklet registration.
