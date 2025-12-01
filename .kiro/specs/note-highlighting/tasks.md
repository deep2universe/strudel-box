# Implementation Plan

- [ ] 1. Set up highlighting module structure
  - Create `webview-ui/src/highlighting/` directory
  - Create TypeScript interfaces for StrudelEvent, HighlightDecoration, HighlightState
  - Set up fast-check as dev dependency for property-based testing
  - _Requirements: 1.1, 5.4_

- [ ] 2. Implement CodeMirror decoration extension
  - [ ] 2.1 Create highlight StateField and StateEffects
    - Implement `highlightField` StateField to track active decorations
    - Implement `addHighlight`, `removeHighlight`, `clearHighlights` StateEffects
    - Export extension factory function for editor integration
    - _Requirements: 1.1, 1.2, 1.4_
  - [ ]* 2.2 Write property test for decoration state management
    - **Property 4: Stop Clears All Highlights**
    - **Validates: Requirements 1.4**
  - [ ]* 2.3 Write property test for concurrent highlights
    - **Property 3: Concurrent Highlight Support**
    - **Validates: Requirements 1.3**

- [ ] 3. Implement HighlightManager class
  - [ ] 3.1 Create HighlightManager with core methods
    - Implement `init(editor)` to store editor reference
    - Implement `onTrigger(event)` to process Strudel events
    - Implement `clearAll()` to remove all highlights
    - Implement `dispose()` for cleanup
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 3.2 Write property test for event-to-decoration mapping
    - **Property 1: Event-to-Decoration Mapping**
    - **Validates: Requirements 1.1**
  - [ ]* 3.3 Write property test for decoration cleanup
    - **Property 2: Decoration Cleanup on Event End**
    - **Validates: Requirements 1.2**

- [ ] 4. Implement source location mapping
  - [ ] 4.1 Create source location parser and validator
    - Parse Strudel event source locations to editor positions
    - Handle mini-notation, chained functions, nested expressions
    - Validate and clamp invalid ranges
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 4.2 Write property test for source location mapping
    - **Property 6: Source Location Mapping Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [ ]* 4.3 Write property test for graceful missing source handling
    - **Property 8: Graceful Handling of Missing Source Location**
    - **Validates: Requirements 5.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement sound type classification
  - [ ] 6.1 Create sound type classifier
    - Classify events as drum, melodic, effect, or unknown
    - Map sound types to CSS class names
    - _Requirements: 6.1, 6.2_
  - [ ]* 6.2 Write property test for sound type classification
    - **Property 7: Sound Type Classification**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 7. Implement theme-aware highlight styles
  - [ ] 7.1 Add highlight CSS classes to styles.css
    - Add Cyberpunk theme highlight styles (cyan/magenta glow)
    - Add Halloween theme highlight styles (orange/purple glow)
    - Add 8-Bit theme highlight styles (green/red pixelated)
    - Add fade-out animations for each theme
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 7.2 Implement theme switching in HighlightManager
    - Add `setTheme(theme)` method
    - Update active highlight classes on theme change
    - _Requirements: 3.4_
  - [ ]* 7.3 Write property test for theme switch preservation
    - **Property 5: Theme Switch Preserves Highlights**
    - **Validates: Requirements 3.4**
  - [ ]* 7.4 Write unit tests for theme-specific styling
    - Test Cyberpunk theme applies correct CSS classes
    - Test Halloween theme applies correct CSS classes
    - Test 8-Bit theme applies correct CSS classes
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Integrate with Strudel REPL
  - [ ] 8.1 Connect HighlightManager to Strudel's onTrigger callback
    - Modify `initStrudel()` in main.ts to register onTrigger handler
    - Pass events to HighlightManager.onTrigger()
    - _Requirements: 1.1_
  - [ ] 8.2 Connect clearAll to stop/hush functionality
    - Call HighlightManager.clearAll() when stopPattern() is called
    - Ensure Ctrl+. clears highlights
    - _Requirements: 1.4, 4.2_

- [ ] 9. Integrate with CodeMirror editor
  - [ ] 9.1 Add highlight extension to editor setup
    - Modify `createEditor()` in editor.ts to include highlight extension
    - Initialize HighlightManager after editor creation
    - _Requirements: 1.1, 4.1_
  - [ ]* 9.2 Write unit tests for keyboard shortcut integration
    - Test Ctrl+Enter starts playback with highlighting
    - Test Ctrl+. stops playback and clears highlights
    - _Requirements: 4.1, 4.2_

- [ ] 10. Implement performance optimizations
  - [ ] 10.1 Add batched update mechanism
    - Batch multiple highlight updates per animation frame
    - Use requestAnimationFrame for DOM updates
    - _Requirements: 2.3_
  - [ ] 10.2 Add highlight pooling for high-frequency events
    - Reuse decoration objects when possible
    - Limit maximum concurrent highlights if needed
    - _Requirements: 2.2, 2.4_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

