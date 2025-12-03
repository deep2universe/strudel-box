# Requirements Document

## Introduction

The Sample Browser is a new webview panel for Strudel Box that enables users to browse, preview, and integrate the extensive collection of Strudel sample packs into their patterns. The panel provides a categorized overview of all available sample sources, audio preview functionality, and easy copying of `samples()` URLs. The design follows the existing theme system with animated particle backgrounds.

## Glossary

- **Sample Pack**: A collection of audio samples that can be loaded via a URL
- **Sample Browser**: The new webview panel for sample discovery
- **Sample URL**: The string passed to `samples()` (e.g., `'github:tidalcycles/Dirt-Samples'`)
- **Category**: Grouping of sample packs by type (Built-in, GitHub, External URLs)
- **Preview**: Audio playback of a single sample from a pack
- **Theme System**: The existing theming with Tech/Halloween/8-Bit variants
- **Particle System**: The animated background effect system

## Requirements

### Requirement 1

**User Story:** As a Strudel user, I want to see all available sample packs in an organized list, so that I can discover new sounds.

#### Acceptance Criteria

1. WHEN the Sample Browser panel opens THEN the System SHALL display a categorized list of all available sample packs
2. WHEN sample packs are displayed THEN the System SHALL group them by category (Built-in, GitHub Collections, External URLs, Community Packs)
3. WHEN a category header is clicked THEN the System SHALL toggle the expanded/collapsed state of that category
4. WHEN a sample pack entry is displayed THEN the System SHALL show the pack name, source URL, and sample count (if known)

### Requirement 2

**User Story:** As a Strudel user, I want to easily copy the sample URL, so that I can use it in my pattern code.

#### Acceptance Criteria

1. WHEN a user clicks the copy button on a sample pack THEN the System SHALL copy the complete `samples('...')` code snippet to the clipboard
2. WHEN the URL is successfully copied THEN the System SHALL display a brief visual confirmation
3. WHEN a sample pack entry is displayed THEN the System SHALL show a clearly visible copy button

### Requirement 3

**User Story:** As a Strudel user, I want to preview samples, so that I know what sounds a pack contains.

#### Acceptance Criteria

1. WHEN a user clicks the preview button on a sample pack THEN the System SHALL load the sample pack and play a representative sample
2. WHEN preview playback starts THEN the System SHALL display a visual indicator that audio is playing
3. WHEN a user clicks the preview button while audio is playing THEN the System SHALL stop the current playback
4. IF the sample pack fails to load THEN the System SHALL display an error message without crashing

### Requirement 4

**User Story:** As a Strudel user, I want to search sample packs by name, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. WHEN a user types in the search field THEN the System SHALL filter the displayed sample packs in real-time
2. WHEN filtering is active THEN the System SHALL match against pack name, category, and source URL
3. WHEN the search field is cleared THEN the System SHALL restore the full categorized list
4. WHEN no results match the search THEN the System SHALL display a "No results found" message

### Requirement 5

**User Story:** As a Strudel user, I want to switch the Sample Browser theme, so that it matches my workflow.

#### Acceptance Criteria

1. WHEN the Sample Browser panel loads THEN the System SHALL display the three theme buttons (Tech, Halloween, 8-Bit)
2. WHEN a user clicks a theme button THEN the System SHALL apply the selected theme to the panel
3. WHEN a theme is applied THEN the System SHALL update colors, animations, and particle effects accordingly
4. WHEN the panel is reopened THEN the System SHALL restore the previously selected theme

### Requirement 6

**User Story:** As a Strudel user, I want to see an animated background, so that the panel is visually appealing.

#### Acceptance Criteria

1. WHEN the Sample Browser panel is visible THEN the System SHALL render theme-specific particle animations
2. WHEN the theme changes THEN the System SHALL update the particle animation style accordingly
3. WHEN the panel is hidden or closed THEN the System SHALL stop the animation to conserve resources

### Requirement 7

**User Story:** As a Strudel user, I want to load sample packs directly from the browser, so that they are immediately available in my patterns.

#### Acceptance Criteria

1. WHEN a user clicks the "Load" button on a sample pack THEN the System SHALL load the samples into the Strudel audio engine
2. WHEN samples are successfully loaded THEN the System SHALL display a visual indicator showing the pack is loaded
3. WHEN a pack is already loaded THEN the System SHALL display a "Loaded" badge instead of the load button
4. IF loading fails THEN the System SHALL display an error message with the failure reason

### Requirement 8

**User Story:** As a developer, I want to easily extend the sample pack list, so that new packs can be added.

#### Acceptance Criteria

1. WHEN sample packs are defined THEN the System SHALL store them in a structured data format (TypeScript interface)
2. WHEN a new pack is added to the data THEN the System SHALL display it without code changes to the UI
3. WHEN pack metadata is defined THEN the System SHALL support name, url, category, sampleCount, and description fields
