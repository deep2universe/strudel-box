# Requirements Document

## Introduction

This feature implements live visualization of currently playing music notes in the Strudel Box REPL editor. When a pattern is playing, the code sections that are currently producing active sounds shall be visually highlighted. This is an essential feature for live-coding environments as it allows users to see the connection between code and sound in real-time.

## Glossary

- **Strudel Box**: The VS Code extension that provides a live-coding environment for music patterns
- **Pattern**: A Strudel code expression that describes a temporal sequence of musical events
- **Event**: A single musical occurrence (note, sample, etc.) that triggers at a specific point in time
- **Highlighting**: Visual emphasis of a code section in the editor
- **REPL**: Read-Eval-Print-Loop - the interactive environment for executing Strudel code
- **CodeMirror**: The code editor (version 6) used in the webview
- **Decoration**: CodeMirror mechanism for visually marking text ranges
- **Scheduler**: Strudel's internal timing system that triggers events at the correct time
- **Mini-Notation**: Strudel's compact syntax for pattern description (e.g., `"bd sd hh*4"`)

## Requirements

### Requirement 1

**User Story:** As a live-coder, I want to see which part of my code is currently producing sounds, so that I can understand the connection between code and music.

#### Acceptance Criteria

1. WHEN a Strudel event triggers during playback THEN the Note Highlighting System SHALL visually highlight the corresponding code region in the editor
2. WHEN an event finishes playing THEN the Note Highlighting System SHALL remove the highlight from that code region
3. WHEN multiple events trigger simultaneously THEN the Note Highlighting System SHALL highlight all corresponding code regions concurrently
4. WHEN playback stops THEN the Note Highlighting System SHALL remove all active highlights immediately

### Requirement 2

**User Story:** As a user, I want the highlighting to be performant and not affect audio playback, so that my live performance remains smooth.

#### Acceptance Criteria

1. WHILE patterns are playing THEN the Note Highlighting System SHALL maintain smooth audio playback without audible glitches
2. WHILE highlighting is active THEN the Note Highlighting System SHALL render at a minimum of 30 frames per second
3. WHEN processing highlight updates THEN the Note Highlighting System SHALL batch DOM updates to minimize reflows
4. WHEN the editor contains more than 100 lines of code THEN the Note Highlighting System SHALL maintain responsive highlighting performance

### Requirement 3

**User Story:** As a user, I want the highlighting to match the current theme, so that the visual presentation is consistent.

#### Acceptance Criteria

1. WHEN the Cyberpunk theme is active THEN the Note Highlighting System SHALL use cyan/magenta glow effects for highlights
2. WHEN the Halloween theme is active THEN the Note Highlighting System SHALL use orange/purple glow effects for highlights
3. WHEN the 8-Bit theme is active THEN the Note Highlighting System SHALL use green/red pixelated effects for highlights
4. WHEN the user switches themes during playback THEN the Note Highlighting System SHALL update highlight colors immediately without interrupting audio

### Requirement 4

**User Story:** As a user, I want to continue using the existing keyboard shortcuts, so that my workflow is not interrupted.

#### Acceptance Criteria

1. WHEN the user presses Ctrl+Enter or Cmd+Enter THEN the system SHALL evaluate the pattern and start playback with highlighting enabled
2. WHEN the user presses Ctrl+. or Cmd+. THEN the system SHALL stop playback and clear all highlights
3. WHEN highlighting is active THEN the editor SHALL remain fully editable with all standard keyboard shortcuts functional

### Requirement 5

**User Story:** As a developer, I want the highlighting system to handle various pattern types robustly, so that all Strudel features are supported.

#### Acceptance Criteria

1. WHEN a pattern uses mini-notation syntax THEN the Note Highlighting System SHALL highlight the mini-notation string that triggered the event
2. WHEN a pattern uses chained function calls THEN the Note Highlighting System SHALL highlight the relevant function in the chain
3. WHEN a pattern contains nested expressions THEN the Note Highlighting System SHALL highlight the innermost triggering expression
4. WHEN Strudel provides no source location for an event THEN the Note Highlighting System SHALL gracefully skip highlighting for that event without errors

### Requirement 6

**User Story:** As a user, I want to see different highlight styles for different sound types, so that I can better understand the structure of my patterns.

#### Acceptance Criteria

1. WHEN a drum/percussion event triggers THEN the Note Highlighting System SHALL use a distinct highlight style for percussion
2. WHEN a melodic/note event triggers THEN the Note Highlighting System SHALL use a distinct highlight style for melodic content
3. WHEN an effect or modifier triggers THEN the Note Highlighting System SHALL optionally highlight the effect chain

