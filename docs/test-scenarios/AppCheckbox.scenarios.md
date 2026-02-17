# Test Scenarios: AppCheckbox

## Happy Path

1. [ ] **Basic Rendering**
   - Inputs: `modelValue: false`
   - Expected Output: Renders a checkbox in unchecked state.
2. [ ] **Label and Description**
   - Inputs: `label: "Accept Terms"`, `description: "Read carefully"`
   - Expected Output: Renders label text "Accept Terms" and description "Read carefully".
3. [ ] **State Toggle**
   - Actions: User clicks the checkbox.
   - Expected Output: Emits `update:modelValue` with `true` (if starting false).

## Edge Cases

1. [ ] **Disabled State**
   - Inputs: `disabled: true`
   - Expected Output: Wrapper has class `is-disabled`, inner checkbox is disabled, clicking does not emit event.
2. [ ] **Custom Input ID**
   - Inputs: `inputId: "my-check"`
   - Expected Output: Checkbox input has ID "my-check", Label `for` attribute matches "my-check".
3. [ ] **Auto ID Generation**
   - Inputs: No `inputId`.
   - Expected Output: Checkbox has a generated ID starting with `app-checkbox-`.

## UI/Interaction

1. [ ] **Hover Effect**
   - Actions: Hover over wrapper.
   - Expected Output: Label color changes to accent color.
