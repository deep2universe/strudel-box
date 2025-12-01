# Note Highlighting Analysis for Strudel Box

## Date: December 1, 2025

---

## 1. Overview

This document analyzes how to implement note highlighting (showing currently playing notes) in Strudel Box, similar to how strudel.cc displays active notes in the editor.

### Goal
When a pattern plays, highlight the corresponding code segments in the CodeMirror editor in real-time, showing which notes/sounds are currently being triggered.

### Constraint
No iframe embedding of strudel.cc - we maintain our existing architecture and implement highlighting natively.

---

## 2. Current Architecture Summary

### REPL Flow
```
User Code → evaluate() → Strudel Pattern → Scheduler → Audio Events
                                              ↓
                                    Web Audio API (sound output)
```

### Key Components
| Component | File | Role |
|-----------|------|------|
| Strudel REPL | `@strudel/web` (CDN) | Pattern evaluation, audio scheduling |
| CodeMirror Editor | `webview-ui/src/editor.ts` | Code editing, syntax highlighting |
| Main Controller | `webview-ui/src/main.ts` | Orchestrates REPL + Editor |
| Visualizer | `webview-ui/src/visualizer.ts` | Audio frequency visualization |

### Sample Loading
Samples are loaded via the `samples()` function from `@strudel/web`:
```typescript
// In main.ts
if (window.samples) {
  await window.samples('github:tidalcycles/Dirt-Samples/master');
  samplesLoaded = true;
}
```
This fetches sample metadata from GitHub and registers them with the audio engine.

---

## 3. How strudel.cc Implements Note Highlighting

### The Strudel Highlighting System
Strudel uses a **hap-based highlighting system**. A "hap" is a scheduled event in Strudel's pattern system that contains:
- `whole`: The time span of the complete event
- `part`: The time span of the active portion
- `value`: The actual value (note, sound, etc.)
- `context`: Source location in the code (line, column)

### Key Mechanism: `onTrigger` Callback
The `@strudel/web` REPL provides callbacks that fire when events are triggered:

```javascript
const repl = await initStrudel({
  onTrigger: (hap, deadline, duration) => {
    // hap.context contains source location
    // Can be used to highlight code
  }
});
```

### Source Location Tracking
Strudel's mini-notation parser tracks source locations:
```javascript
// When parsing: note("c3 e3 g3")
// Each note gets a context with:
{
  start: { line: 1, column: 6 },  // "c3" starts here
  end: { line: 1, column: 8 }     // "c3" ends here
}
```

---

## 4. Implementation Strategy for Strudel Box

### 4.1 Approach: Use `onTrigger` Callback

The `initStrudel()` function from `@strudel/web` accepts configuration options including event callbacks.

```typescript
// Modified initialization in main.ts
repl = await window.initStrudel({
  onTrigger: (hap, deadline, duration) => {
    highlightHap(hap, duration);
  }
});
```

### 4.2 CodeMirror Decoration API

CodeMirror 6 provides a decoration system for highlighting:

```typescript
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

// Define an effect to add/remove highlights
const addHighlight = StateEffect.define<{from: number, to: number}>();
const removeHighlight = StateEffect.define<{from: number, to: number}>();

// State field to track active highlights
const highlightField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(highlights, tr) {
    // Handle add/remove effects
  }
});
```

### 4.3 Mapping Hap Context to Editor Positions

The challenge is converting Strudel's source locations to CodeMirror positions:

```typescript
function hapToEditorRange(hap: Hap, editor: EditorView): {from: number, to: number} | null {
  const context = hap.context;
  if (!context?.start || !context?.end) return null;
  
  const doc = editor.state.doc;
  const startLine = doc.line(context.start.line);
  const endLine = doc.line(context.end.line);
  
  return {
    from: startLine.from + context.start.column,
    to: endLine.from + context.end.column
  };
}
```

---

## 5. Technical Considerations

### 5.1 Does `@strudel/web` Support `onTrigger`?

Based on Strudel's architecture, `initStrudel()` should support configuration options. We need to verify:

1. **Check if `onTrigger` is available** in the CDN version
2. **Check if haps include context** (source location data)

Test code:
```javascript
const repl = await initStrudel({
  onTrigger: (hap, deadline, duration) => {
    console.log('HAP:', hap);
    console.log('Context:', hap.context);
  }
});
```

### 5.2 Timing Synchronization

Highlights must be synchronized with audio:
- `deadline`: When the sound will play (in AudioContext time)
- `duration`: How long the sound lasts

```typescript
function highlightHap(hap: Hap, duration: number) {
  const range = hapToEditorRange(hap, editor);
  if (!range) return;
  
  // Add highlight
  addHighlightDecoration(range);
  
  // Remove after duration (convert to ms)
  setTimeout(() => {
    removeHighlightDecoration(range);
  }, duration * 1000);
}
```

### 5.3 Performance Considerations

- **Batch updates**: Group multiple highlight changes into single transactions
- **Debounce**: Don't update faster than 60fps
- **Cleanup**: Ensure highlights are removed when pattern stops

### 5.4 Mini-Notation Context Preservation

For highlighting to work, the code must be evaluated in a way that preserves source locations. The `evaluate()` function should handle this automatically, but we need to verify.

---

## 6. Implementation Plan

### Phase 1: Verify API Availability
1. Test if `initStrudel({ onTrigger })` works with CDN version
2. Log hap objects to verify context data is present
3. Document available callback options

### Phase 2: CodeMirror Highlighting Extension
1. Create `highlighting.ts` module in `webview-ui/src/`
2. Implement StateField for tracking active highlights
3. Define CSS styles for highlight decorations
4. Export functions: `initHighlighting()`, `highlightRange()`, `clearHighlights()`

### Phase 3: Integration
1. Modify `main.ts` to pass `onTrigger` callback to `initStrudel()`
2. Connect hap events to CodeMirror highlighting
3. Handle timing synchronization
4. Add cleanup on stop/hush

### Phase 4: Polish
1. Theme-aware highlight colors
2. Smooth fade-in/fade-out animations
3. Performance optimization
4. Edge case handling (overlapping highlights, rapid patterns)

---

## 7. Alternative Approaches

### 7.1 Pattern Drawer (Visual Timeline)
Instead of editor highlighting, show a visual timeline of events:
```
[c3]----[e3]----[g3]----[c4]----
  ↑ current position
```
Pros: Doesn't require source location tracking
Cons: Less intuitive connection to code

### 7.2 Separate Highlight Layer
Overlay a canvas on top of the editor for highlighting:
Pros: Full control over rendering
Cons: Complex positioning, accessibility issues

### 7.3 Custom Mini-Notation Parser
Parse the code ourselves to track positions:
Pros: Full control
Cons: Duplicates Strudel's work, maintenance burden

**Recommendation**: Use the `onTrigger` callback approach (Section 4) as it leverages Strudel's built-in capabilities.

---

## 8. CSS Styling for Highlights

```css
/* Active note highlight */
.cm-strudel-highlight {
  background-color: var(--accent-primary-transparent);
  border-radius: 2px;
  animation: highlight-pulse 0.1s ease-out;
}

@keyframes highlight-pulse {
  0% { background-color: var(--accent-primary); }
  100% { background-color: var(--accent-primary-transparent); }
}

/* Theme variations */
[data-theme="halloween"] .cm-strudel-highlight {
  background-color: rgba(255, 165, 0, 0.4);
}

[data-theme="8bit"] .cm-strudel-highlight {
  background-color: rgba(0, 255, 0, 0.4);
}
```

---

## 9. Required Changes Summary

| File | Changes |
|------|---------|
| `webview-ui/src/main.ts` | Add `onTrigger` callback to `initStrudel()` |
| `webview-ui/src/editor.ts` | Add highlighting StateField and decorations |
| `webview-ui/src/highlighting.ts` | New file: highlighting logic |
| `webview-ui/src/styles.css` | Add highlight CSS classes |

---

## 10. Open Questions

1. **Does `@strudel/web` CDN version expose `onTrigger`?**
   - Need to test with actual CDN script
   - May need to check Strudel source code

2. **Is source location context preserved in evaluated patterns?**
   - Mini-notation should preserve it
   - Plain JavaScript patterns may not have context

3. **How to handle patterns without source locations?**
   - Fallback: No highlighting for those events
   - Alternative: Highlight entire pattern expression

4. **Performance with complex patterns?**
   - Fast patterns (e.g., `hh*16`) generate many events
   - May need throttling or batching

---

## 11. Next Steps

1. **Immediate**: Test `initStrudel({ onTrigger })` in current setup
2. **If works**: Proceed with Phase 2 (CodeMirror extension)
3. **If not**: Investigate alternative APIs or Strudel source code

---

## 12. References

- [Strudel Pattern Documentation](https://strudel.cc/learn/pattern)
- [CodeMirror 6 Decorations](https://codemirror.net/docs/ref/#view.Decoration)
- [Web Audio API Timing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Strudel GitHub - Core Package](https://github.com/tidalcycles/strudel/tree/main/packages/core)
