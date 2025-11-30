# Tech Stack

## Extension (Host)
- TypeScript with strict mode
- VS Code Extension API (^1.74.0)
- esbuild for bundling (CommonJS output)
- ESLint with @typescript-eslint

## Webview UI
- TypeScript (ES2020 target)
- Vite for bundling (ESM)
- CodeMirror 6 for code editing
- @strudel/web loaded from CDN (unpkg)
- CSS variables for theming

## Build Commands
```bash
# Extension
npm run compile        # Type check + lint + build
npm run watch          # Watch mode (esbuild + tsc)
npm run package        # Production build
npm run lint           # ESLint
npm run check-types    # TypeScript type checking
npm run test           # Run tests

# Webview UI (run from webview-ui/)
npm run build          # Production build
npm run dev            # Watch mode
```

## Key Dependencies
- codemirror, @codemirror/lang-javascript, @codemirror/state
- @vscode/test-cli, @vscode/test-electron (testing)
