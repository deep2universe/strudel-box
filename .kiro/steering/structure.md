---
inclusion: always
---

# Project Structure

## Directory Layout
- `src/` - Extension host code (Node.js/TypeScript)
  - `extension.ts` - Entry point, command registration
  - `StrudelBoxPanel.ts` - Webview panel lifecycle, HTML generation
  - `test/` - Extension tests
- `webview-ui/` - Webview frontend (browser context, separate build)
  - `src/main.ts` - Entry point, Strudel runtime integration
  - `src/editor.ts` - CodeMirror 6 setup and keybindings
  - `src/styles.css` - Theme definitions and layout
  - `src/vscode.ts` - VS Code API bridge utilities
  - `dist/` - Built webview assets (served to webview)
- `dist/` - Built extension output (CommonJS)
- `esbuild.js` - Extension build script
- `package.json` - Extension manifest, commands, contributions

## Architecture

### Two-Process Model
1. Extension Host (Node.js) - Manages webview lifecycle, file I/O, VS Code integration
2. Webview (Browser) - Runs Strudel audio engine, CodeMirror editor, UI rendering

### Communication Pattern
- Extension → Webview: `webview.postMessage({ type, payload })`
- Webview → Extension: `vscode.postMessage({ type, payload })`
- Always use typed message objects with `type` discriminator

### Key Constraints
- Webview has CSP restrictions; external scripts loaded only from CDN allowlist
- Strudel (`@strudel/web`) loaded dynamically from unpkg CDN
- Webview state must be serializable for panel restore
- Audio context requires user gesture to start (browser security)
