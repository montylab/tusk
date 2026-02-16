# ThemeTransitionOverlay Component Test Plan

## Description

`ThemeTransitionOverlay.vue` teleports a circular overlay that scales up from the click point, pauses to apply the new theme, then scales back down. Driven by `uiStore.themeTransitionState`.

## Unit Tests

### Animation Phases

- [ ] **Phase 1 – Expand**: Verify `isExpanded = true` after `nextTick + rAF`, circle scales to 50.
- [ ] **Theme Apply**: Verify `appearanceStore.theme = targetTheme` at ~100ms.
- [ ] **Phase 2 – Shrink**: Verify `isExpanded = false` at ~200ms.
- [ ] **Cleanup**: Verify `overlayVisible = false` and `isActive = false` at ~800ms.

### Circle Positioning

- [ ] **Style**: Verify `left = x` and `top = y` from `themeTransitionState`.

### Guard

- [ ] **No Target**: Verify no-op when `targetTheme` is falsy.

### Visual

- [ ] **Teleport**: Verify teleported to `<body>`.
- [ ] **Z-Index**: Verify `z-index: 99999`.
- [ ] **Pointer Events**: Verify `pointer-events: none` (non-blocking).
- [ ] **Scale Transition**: Verify `scale(0)` → `scale(50)` → `scale(0)`.
