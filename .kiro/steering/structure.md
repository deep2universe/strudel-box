# Project Structure

```
strudel-box/
├── src/                    # Extension source (TypeScript)
│   ├── extension.ts        # Entry point, command registration
│   ├── StrudelBoxPanel.ts  # Webview panel management, HTML generation
│   └── test/               # Extension tests
├── webview-ui/             # Webview frontend (separate build)
│   ├── src/
│   │   ├── main.ts         # Webview entry, Strudel integration
│   │   ├── editor.ts       # CodeMirror setup and keybindings
│   │   ├── styles.css      # Themes and layout
│   │   └── vscode.ts       # VS Code API bridge
│   ├── dist/               # Built webview assets
│   └── vite.config.ts      # Vite build config
├── dist/                   # Built extension output
├── esbuild.js              # Extension build script
└── package.json            # Extension manifest and commands
```

## Architecture
- Extension host runs in Node.js, manages webview lifecycle
- Webview runs in browser context, loads Strudel from CDN
- Communication via `postMessage` / `onDidReceiveMessage`
- Webview assets served from `webview-ui/dist/` with CSP restrictions
