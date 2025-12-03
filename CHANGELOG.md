# Changelog

All notable changes to Strudel Box will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-03

### Added
- Live coding REPL with CodeMirror 6 editor
- Real-time audio playback with Strudel engine
- Strudel Explorer sidebar for browsing `.strudel` files
- Playlist controls (Previous, Next, Shuffle)
- Sample Browser for exploring available sounds
- Three visual themes: Cyberpunk, Halloween, 8-Bit
- Animated particle backgrounds
- Custom editor for `.strudel` files
- Syntax highlighting for Strudel patterns
- Custom file icons for `.strudel` files
- Pre-loaded sample libraries (TR-808, TR-909, Piano, Dirt-Samples, etc.)
- Log panel with real-time feedback
- Keyboard shortcuts: `Ctrl+Enter` (play), `Ctrl+.` (stop)
- Context menu integration for `.strudel` files
- Share to Strudel.cc functionality

### Technical
- Webview-based architecture with VS Code Extension API
- Audio engine loaded from CDN (`@strudel/web`)
- State persistence across VS Code sessions