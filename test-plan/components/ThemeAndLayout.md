# Theme & Layout Orchestration Test Plan

## Description

Covers `ThemePanel.vue`, `TaskPageLayout.vue`, `ResizablePanel.vue`, and `InterfaceManager.vue`. These components manage the overall look, feel, and structural constraints of the application.

## Unit Tests

### ThemePanel

- [ ] **Visibility**: Verify the panel transitions in/out based on `uiStore.isThemePanelOpen`.
- [ ] **Theme Switching**: Verify that clicking a theme button triggers the circular transition animation (`uiStore.startThemeTransition`).
- [ ] **Scale Control**: Verify scaling buttons update `appearanceStore.interfaceScale`.

### ResizablePanel

- [ ] **Drag to Resize**: Verify that dragging the handle updates the width/height CSS and saves to `localStorage`.
- [ ] **Boundaries**: Verify `min-size` and `max-size` constraints are enforced during dragging.

### InterfaceManager

- [ ] **CSS Variables**: Verify it injects variables like `--ui-scale`, `--hour-height`, and `--theme-accent` into the document root.

## Integration

- [ ] **Layout Reflow**: Verify that resizing a sidebar causes the main calendar grid to correctly recalculate task widths (via `useTaskLayout` triggers).
- [ ] **Persistence**: Verify that closing and reopening the app restores the last used sidebar widths.
