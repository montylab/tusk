# Debug Tools Test Plan

## Description

`ColorSchemeDebug.vue` visualizes task colors across themes/states. `DebugFAB.vue` provides a dev-only floating action button with links to debug pages.

## Unit Tests

### DebugFAB

- [ ] **Dev Only**: Verify component only renders in development mode.
- [ ] **Toggle**: Verify click toggles popover visibility.
- [ ] **Links**: Verify links to debug pages (e.g., color scheme debug).

### ColorSchemeDebug

- [ ] **Randomized Schedule**: Verify generates realistic task schedules with varied categories and durations.
- [ ] **State Visualization**: Verify renders past, active (on-air), and future task states.
- [ ] **Category Colors**: Verify each category displays its assigned color.
