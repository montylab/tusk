# Appearance Store Test Plan

## Description

Device-local Pinia store managing theme, color scheme, interface scale, hour height, and header height. Persists to `localStorage`.

## Unit Tests

### State

- [ ] **Load from localStorage**: Verify saved values restored on init.
- [ ] **Defaults**: Verify `theme='dark'`, `colorScheme='glass'`, `interfaceScale=100`, `hourHeightBase=80`, `headerHeightBase=70`.

### Computed Values

- [ ] **`uiScale`**: Verify `interfaceScale / 100`.
- [ ] **`hourHeight`**: Verify `hourHeightBase * uiScale`.
- [ ] **`headerHeight`**: Verify `headerHeightBase * uiScale`.

### Persistence

- [ ] **Save on Change**: Verify `localStorage.setItem('appearance-settings', ...)` on any property change.
- [ ] **All Properties Saved**: Verify JSON includes theme, colorScheme, interfaceScale, hourHeight, headerHeight.

### Constants

- [ ] **THEMES**: Verify `['dark', 'light', 'pinky']`.
- [ ] **SCALES**: Verify `[50, 75, 100, 150]`.
- [ ] **SCHEMES**: Verify `['solid', 'glass', 'ink', 'neo']`.
