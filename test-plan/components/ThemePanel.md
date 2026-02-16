# ThemePanel Component Test Plan

## Description

`ThemePanel.vue` is a fixed-position floating panel providing theme, scale, and color scheme selection. Shown/hidden via `isThemePanelOpen` from `uiStore`.

## Unit Tests

### Visibility

- [ ] **Open**: Verify panel shown when `isThemePanelOpen` is true.
- [ ] **Close**: Verify clicking close button calls `uiStore.closeThemePanel`.
- [ ] **Transition**: Verify `slide-fade` enter/leave animation.

### Theme Selection

- [ ] **Buttons**: Verify one button per `THEMES` constant.
- [ ] **Active Class**: Verify `.active` on current theme button.
- [ ] **Toggle**: Verify `toggleTheme(t, event)` calls `uiStore.startThemeTransition(x, y, t)`.
- [ ] **Label**: Verify first letter uppercased as button text.

### Scale Selection

- [ ] **Buttons**: Verify one button per `SCALES` constant.
- [ ] **Active Class**: Verify `.active` on current scale.
- [ ] **Set**: Verify `setScale` sets `appearanceStore.interfaceScale`.
- [ ] **Title**: Verify `${s}%` tooltip.

### Scheme Selection

- [ ] **Buttons**: Verify one button per `SCHEMES` constant.
- [ ] **Active Class**: Verify `.active` on current scheme.
- [ ] **Set**: Verify `setScheme` sets `appearanceStore.colorScheme`.
