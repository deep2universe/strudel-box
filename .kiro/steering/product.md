---
inclusion: always
---

# Strudel Box

VS Code extension embedding a Strudel live coding environment for music pattern creation.

## Product Context
- Strudel is a JavaScript-based live coding language for music/sound patterns
- Target users: musicians, creative coders, live performers
- Tagline: "Code your beats. Visualize your sound. Share your vibe."

## Core Features
- Webview-based REPL for writing and evaluating Strudel patterns
- CodeMirror 6 editor with JavaScript syntax highlighting
- Play/Stop controls (Ctrl/Cmd+Enter to play, Ctrl/Cmd+. to stop)
- Theme support: Default/Cyberpunk, Halloween, 8-Bit
- Load/save `.strudel` pattern files

## UX Guidelines
- Prioritize low-latency audio feedback for live coding experience
- Keep UI minimal to maximize pattern editing space
- Keyboard shortcuts must work reliably during live performance
- Theme changes should not interrupt audio playback
- Error messages should be non-blocking and clearly visible

## File Conventions
- Pattern files use `.strudel` extension
- Patterns are plain JavaScript using Strudel DSL functions
