# UI Store Test Plan

## Description

Lightweight Pinia store for transient UI state: theme panel visibility, create-task trigger counter, and theme transition coordinates.

## Unit Tests

- [ ] **`toggleThemePanel`**: Verify toggles `isThemePanelOpen`.
- [ ] **`closeThemePanel`**: Verify sets `isThemePanelOpen = false`.
- [ ] **`triggerCreateTask`**: Verify increments `createTaskTrigger` counter.
- [ ] **`startThemeTransition`**: Verify sets `themeTransitionState` with `isActive: true`, `x`, `y`, `targetTheme`.
- [ ] **Default State**: Verify `isThemePanelOpen = false`, `createTaskTrigger = 0`, `themeTransitionState.isActive = false`.
