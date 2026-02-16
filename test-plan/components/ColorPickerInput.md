# ColorPickerInput Component Test Plan

## Description

`ColorPickerInput.vue` provides preset color swatches from `settings.categoryColors` plus a custom color picker popup. Implements `v-model` via `modelValue`/`update:modelValue`.

## Props: `modelValue: string`, `disabled?: boolean`

## Events: `update:modelValue`

## Unit Tests

### Presets

- [ ] **Render Swatches**: Verify preset colors from `settingsStore.settings.categoryColors`.
- [ ] **Select Preset**: Verify clicking swatch emits color and hides custom picker.
- [ ] **Active Indicator**: Verify `.active` class + checkmark on selected swatch.

### Custom Picker

- [ ] **Toggle**: Verify clicking rainbow swatch toggles `showCustomPicker`.
- [ ] **Hash Prefix**: Verify `handleCustomUpdate` ensures `#` prefix.
- [ ] **Click Outside**: Verify picker closes when clicking outside `pickerRef`.

### Initial State

- [ ] **No Color**: Verify random color emitted from `getRandomCategoryColor()` on mount if no modelValue.
- [ ] **With Color**: Verify `localColor` matches `modelValue`.

### Disabled State

- [ ] **No Interactions**: Verify `selectColor` and `toggleCustomPicker` are no-ops.
- [ ] **Visual**: Verify `.disabled` class applies opacity 0.6.

### Lifecycle

- [ ] **Click Listener**: Verify `handleClickOutside` added on mount, removed on unmount.
