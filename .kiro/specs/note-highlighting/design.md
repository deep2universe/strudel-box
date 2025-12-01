# Design Document: Note Highlighting

## Overview

The Note Highlighting feature provides real-time visual feedback in the Strudel Box editor by highlighting code regions that correspond to currently playing musical events. This creates an intuitive connection between the written code and the produced sound, essential for live-coding workflows.

The implementation leverages Strudel's `onTrigger` callback system to receive event notifications, maps source locations to editor positions, and uses CodeMirror 6's decoration system for efficient visual updates.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Webview (Browser)                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Strudel Audio Engine                      │   │
│  │                                                             │   │
│  │   repl.evaluate(code)                                       │   │
│  │        │                                                    │   │
│  │        ▼                                                    │   │
│  │   ┌─────────────┐    onTrigger(event)    ┌──────────────┐  │   │
│  │   │  Scheduler  │ ───────────────────────▶│ Highlight    │  │   │
│  │   │             │                         │ Manager      │  │   │
│  │   └─────────────┘                         └──────┬───────┘  │   │
│  └──────────────────────────────────────────────────│──────────┘   │
│                                                     │               │
│  ┌──────────────────────────────────────────────────▼──────────┐   │
│  │                    CodeMirror 6 Editor                       │   │
│  │                                                             │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │              Decoration StateField                   │   │   │
│  │   │                                                     │   │   │
│  │   │   • Active highlights (Map<id, DecorationRange>)    │   │   │
│  │   │   • Theme-aware CSS classes                         │   │   │
│  │   │   • Automatic cleanup on timeout                    │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │              Highlight Styles (CSS)                  │   │   │
│  │   │                                                     │   │   │
│  │   │   .highlight-active    { background, animation }    │   │   │
│  │   │   .highlight-drum      { orange/red tones }         │   │   │
│  │   │   .highlight-melodic   { cyan/blue tones }          │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. HighlightManager

Central coordinator for all highlighting operations.

```typescript
interface HighlightManager {
  // Initialize with editor reference
  init(editor: EditorView): void;
  
  // Handle incoming Strudel events
  onTrigger(event: StrudelEvent): void;
  
  // Clear all active highlights
  clearAll(): void;
  
  // Update theme (called on theme switch)
  setTheme(theme: ThemeType): void;
  
  // Cleanup resources
  dispose(): void;
}
```

### 2. StrudelEvent Interface

Event data received from Strudel's scheduler.

```typescript
interface StrudelEvent {
  // Unique identifier for this event instance
  id: string;
  
  // Source location in the code
  source?: {
    start: number;  // Character offset from start
    end: number;    // Character offset end
  };
  
  // Event duration in seconds
  duration: number;
  
  // Sound type classification
  type: 'drum' | 'melodic' | 'effect' | 'unknown';
  
  // Additional event data (note, sample name, etc.)
  value?: unknown;
}
```

### 3. HighlightDecoration

CodeMirror decoration configuration.

```typescript
interface HighlightDecoration {
  // Character range in document
  from: number;
  to: number;
  
  // CSS class based on event type
  class: string;
  
  // Timeout ID for auto-removal
  timeoutId: number;
  
  // Event ID for tracking
  eventId: string;
}
```

### 4. CodeMirror Extension

StateField and ViewPlugin for managing decorations.

```typescript
// StateField to track active decorations
const highlightField: StateField<DecorationSet>;

// Effect to add/remove highlights
const addHighlight: StateEffectType<HighlightDecoration>;
const removeHighlight: StateEffectType<string>;
const clearHighlights: StateEffectType<null>;
```

## Data Models

### Active Highlights State

```typescript
interface HighlightState {
  // Map of event ID to decoration data
  activeHighlights: Map<string, {
    decoration: Decoration;
    from: number;
    to: number;
    timeoutId: number;
  }>;
  
  // Current theme for styling
  currentTheme: ThemeType;
  
  // Performance: batch pending updates
  pendingUpdates: HighlightUpdate[];
  
  // Animation frame request ID
  rafId: number | null;
}

interface HighlightUpdate {
  type: 'add' | 'remove';
  eventId: string;
  data?: HighlightDecoration;
}
```

### Theme Configuration

```typescript
interface ThemeHighlightConfig {
  // Base highlight class
  baseClass: string;
  
  // Type-specific classes
  drumClass: string;
  melodicClass: string;
  effectClass: string;
  
  // Animation duration in ms
  fadeOutDuration: number;
}

const THEME_CONFIGS: Record<ThemeType, ThemeHighlightConfig> = {
  default: {
    baseClass: 'highlight-cyberpunk',
    drumClass: 'highlight-drum-cyber',
    melodicClass: 'highlight-melodic-cyber',
    effectClass: 'highlight-effect-cyber',
    fadeOutDuration: 150
  },
  halloween: {
    baseClass: 'highlight-halloween',
    drumClass: 'highlight-drum-spooky',
    melodicClass: 'highlight-melodic-spooky',
    effectClass: 'highlight-effect-spooky',
    fadeOutDuration: 200
  },
  '8bit': {
    baseClass: 'highlight-8bit',
    drumClass: 'highlight-drum-retro',
    melodicClass: 'highlight-melodic-retro',
    effectClass: 'highlight-effect-retro',
    fadeOutDuration: 100
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties must be verified:

### Property 1: Event-to-Decoration Mapping

*For any* Strudel event with a valid source location (start, end), when the event triggers, the HighlightManager SHALL create a CodeMirror decoration at exactly the specified character range (from=start, to=end).

**Validates: Requirements 1.1**

### Property 2: Decoration Cleanup on Event End

*For any* active highlight with a known duration, after the duration elapses, the highlight SHALL be removed from the editor's decoration set.

**Validates: Requirements 1.2**

### Property 3: Concurrent Highlight Support

*For any* set of N events triggering at the same time with distinct source locations, the editor SHALL contain exactly N active decorations, one for each event's source range.

**Validates: Requirements 1.3**

### Property 4: Stop Clears All Highlights

*For any* state with K active highlights (K >= 0), calling clearAll() SHALL result in exactly 0 active highlights remaining.

**Validates: Requirements 1.4**

### Property 5: Theme Switch Preserves Highlights

*For any* active highlight set and any theme transition (from theme A to theme B), the number of active highlights SHALL remain unchanged, and each highlight's position (from, to) SHALL remain unchanged.

**Validates: Requirements 3.4**

### Property 6: Source Location Mapping Correctness

*For any* event with valid source location data (mini-notation, chained functions, or nested expressions), the HighlightManager SHALL map the source location to the correct editor character range without off-by-one errors.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Sound Type Classification

*For any* event with a classifiable sound type (drum or melodic), the resulting decoration SHALL have the correct CSS class corresponding to that sound type.

**Validates: Requirements 6.1, 6.2**

### Property 8: Graceful Handling of Missing Source Location

*For any* event where source location is undefined or null, the HighlightManager SHALL not throw an error and SHALL not create any decoration.

**Validates: Requirements 5.4**

## Error Handling

### Missing Source Location

When Strudel provides an event without source location data:
- Log a debug message (not error) for diagnostics
- Skip decoration creation silently
- Continue processing other events normally

### Invalid Source Range

When source location has invalid values (negative, out of bounds, start > end):
- Clamp values to valid document range
- Log warning for debugging
- Create decoration with clamped values or skip if uncorrectable

### Editor Not Ready

When events arrive before editor is initialized:
- Queue events in a buffer (max 100 events)
- Process queued events once editor is ready
- Discard oldest events if buffer overflows

### Performance Degradation

When too many highlights are active (> 50 simultaneous):
- Log performance warning
- Continue operating (no artificial limits)
- Consider implementing highlight pooling in future iterations

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties across all inputs

### Property-Based Testing Framework

Use **fast-check** for TypeScript property-based testing.

```typescript
import * as fc from 'fast-check';
```

### Test Configuration

- Minimum 100 iterations per property test
- Seed logging for reproducibility
- Shrinking enabled for minimal failing examples

### Property Test Annotations

Each property-based test MUST be tagged with:
```typescript
// **Feature: note-highlighting, Property {number}: {property_text}**
```

### Unit Test Coverage

Unit tests should cover:
- Theme-specific CSS class application (examples for each theme)
- Keyboard shortcut integration (Ctrl+Enter, Ctrl+.)
- Edge cases: empty document, single character highlight, full document highlight

### Test File Structure

```
webview-ui/src/
├── highlighting/
│   ├── highlightManager.ts
│   ├── highlightManager.test.ts      # Unit tests
│   └── highlightManager.property.ts  # Property-based tests
```

