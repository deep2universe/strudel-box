---
inclusion: fileMatch
fileMatchPattern: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.json', 'esbuild.js', 'vite.config.ts']
---

# Tech Stack

## Extension Host (Node.js)
- TypeScript strict mode, ES2022 target, Node16 module resolution
- VS Code Extension API ^1.74.0
- esbuild bundler → CommonJS output to `dist/`
- Entry: `src/extension.ts` → `dist/extension.js`

## Webview UI (Browser)
- TypeScript strict mode, ES2020 target, ESNext modules
- Vite bundler → ESM output to `webview-ui/dist/`
- CodeMirror 6 for editor (`codemirror`, `@codemirror/lang-javascript`, `@codemirror/state`)
- `@strudel/web` loaded from unpkg CDN at runtime (not bundled)
- Entry: `webview-ui/src/main.ts`

## Code Conventions
- Use strict TypeScript; avoid `any` types
- Extension code uses CommonJS imports (`require`-style resolution)
- Webview code uses ESM imports
- Typed message objects with `type` discriminator for extension↔webview communication
- CSS variables for theming; no inline styles

## Build Commands
```bash
# Extension (from root)
npm run compile        # Type check + lint + esbuild
npm run watch          # Watch mode
npm run package        # Production build
npm run lint           # ESLint
npm run check-types    # TypeScript only
npm run test           # VS Code extension tests

# Webview (from webview-ui/)
npm run build          # Production build
npm run dev            # Watch mode
```

## Testing
- `@vscode/test-cli` and `@vscode/test-electron` for extension tests
- Test files in `src/test/`
- Run `npm run pretest` before `npm run test`

## Key Constraints
- Webview has CSP restrictions; only unpkg CDN allowed for external scripts
- Audio context requires user gesture to initialize (browser security)
- Webview state must be JSON-serializable for panel restore
