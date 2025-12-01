---
inclusion: fileMatch
fileMatchPattern: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.json', 'esbuild.js', 'vite.config.ts']
---

# Tech Stack & Conventions

## TypeScript Configuration

### Extension Host (`src/`)
- Target: ES2022, Module: Node16, strict mode enabled
- Output: CommonJS to `dist/` via esbuild
- VS Code Extension API ^1.74.0

### Webview (`webview-ui/src/`)
- Target: ES2020, Module: ESNext, strict mode enabled
- Output: ESM to `webview-ui/dist/` via Vite
- Dependencies: CodeMirror 6 (`codemirror`, `@codemirror/lang-javascript`, `@codemirror/state`)

## Code Style Requirements

### Type Safety
- NEVER use `any`—use `unknown` with type guards instead
- All message objects MUST have a `type` discriminator field
- Webview state MUST be JSON-serializable (no functions, circular refs, or class instances)

### Module System
- Extension code: CommonJS (`require`/`module.exports` patterns)
- Webview code: ESM (`import`/`export` only)
- DO NOT mix module systems within a context

### Variables & Styling
- Prefer `const`; use `let` only when reassignment is needed; NEVER use `var`
- CSS: Use custom properties only (`--var-name`); no inline styles
- Theme values must reference CSS variables for theme switching support

## Strudel Integration

### CDN Loading (Critical)
- `@strudel/web` MUST be loaded from unpkg CDN at runtime
- NEVER bundle Strudel—it breaks audio worklet registration
- CDN URL pattern: `https://unpkg.com/@strudel/web@latest`

### Audio Context Rules
- AudioContext MUST be created after user gesture (click/keypress)
- Never auto-play audio on panel load
- Handle `AudioContext.state === 'suspended'` gracefully

## Build & Test Commands

```bash
# Extension (project root)
npm run compile        # Full build: types + lint + bundle
npm run watch          # Dev mode with rebuild on change
npm run check-types    # TypeScript only (fast validation)
npm run lint           # ESLint check
npm run test           # Requires: npm run pretest first

# Webview (from webview-ui/)
npm run build          # Production bundle
npm run dev            # Dev server with HMR
```

## Security Constraints

### Content Security Policy
- Webview scripts: unpkg CDN ONLY—do not add other external sources
- No `eval()`, `new Function()`, or inline scripts
- All resources must use nonces or be from allowed sources

### State Persistence
- Panel state must survive VS Code reload
- Use `webview.setState()` / `getState()` for persistence
- Serialize only primitive data and plain objects
