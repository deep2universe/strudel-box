---
inclusion: fileMatch
fileMatchPattern: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.json', 'esbuild.js', 'vite.config.ts']
---

# Tech Stack & Conventions

## Extension Host (Node.js Context)
- TypeScript strict mode, ES2022 target, Node16 module resolution
- VS Code Extension API ^1.74.0
- esbuild bundler → CommonJS output to `dist/`
- Entry: `src/extension.ts` → `dist/extension.js`

## Webview UI (Browser Context)
- TypeScript strict mode, ES2020 target, ESNext modules
- Vite bundler → ESM output to `webview-ui/dist/`
- CodeMirror 6: `codemirror`, `@codemirror/lang-javascript`, `@codemirror/state`
- `@strudel/web` loaded from unpkg CDN at runtime (never bundle it)
- Entry: `webview-ui/src/main.ts`

## Code Style Rules
- Use strict TypeScript; avoid `any` types—prefer `unknown` with type guards
- Extension code: CommonJS module resolution
- Webview code: ESM imports only
- Message passing: always use typed objects with `type` discriminator field
- Theming: CSS custom properties only; no inline styles
- Prefer `const` over `let`; avoid `var`

## Build Commands
```bash
# Extension (run from project root)
npm run compile        # Type check + lint + esbuild
npm run watch          # Watch mode for development
npm run package        # Production build
npm run lint           # ESLint check
npm run check-types    # TypeScript type check only
npm run test           # Run extension tests (requires pretest)

# Webview (run from webview-ui/ directory)
npm run build          # Production build
npm run dev            # Watch mode for development
```

## Testing
- Framework: `@vscode/test-cli` + `@vscode/test-electron`
- Test location: `src/test/`
- Always run `npm run pretest` before `npm run test`

## Critical Constraints
- CSP: Webview only allows scripts from unpkg CDN—do not add other external sources
- Audio: `AudioContext` requires user gesture before initialization (browser policy)
- State: All webview state must be JSON-serializable for panel restore functionality
- Two builds: Extension and webview are separate build targets—changes to one may require rebuilding both
