# Test Scenarios: ColorPickerInput

## Happy Path

1. [ ] Renders preset color swatches from settings store
2. [ ] Selecting a preset swatch emits update:modelValue and closes custom picker
3. [ ] Active swatch shows checkmark (✓)
4. [ ] Toggling custom picker button shows/hides the popup
5. [ ] Custom color update emits with # prefix

## Edge Cases

1. [ ] Empty modelValue auto-assigns random color on mount
2. [ ] Disabled state prevents color selection and picker toggle
3. [ ] Prop change updates internal localColor ref
4. [ ] handleCustomUpdate adds # prefix when missing
5. [ ] Click outside closes custom picker popup
