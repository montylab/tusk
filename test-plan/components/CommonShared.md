# Common & Shared Components Test Plan

## Description

Covers reusable UI primitives found in `src/components/common` and `src/components/icons`.

## Unit Tests

### AppIcon

- [ ] **Masking**: Verify it uses `webkit-mask-image` with the correct SVG path from `assets/icons/`.
- [ ] **Sizing**: Verify `size` prop sets both height and width correctly.

### AppCheckbox

- [ ] **Interactive**: Verify that clicking the label or the checkbox toggles the `v-model` value.
- [ ] **Styling**: Verify it uses the primary theme color when checked.

### AppLogo

- [ ] **SVG Specs**: Verify it renders the custom Tusk icon with correct stroke/fill variables.

### TimeHoverTracker

- [ ] **Precision**: Verify it tracks mouse position over the grid and emits the corresponding "Decimal Time" (e.g., 9.25 for 09:15).

## Visual Regression

- [ ] **Icon Consistency**: Verify that all core icons (trash, check, brain, settings) render clearly across different themes (Light/Dark/Glass).
