# AppCheckbox Component Test Plan

## Description

Wrapper around PrimeVue `Checkbox` with label, description, and themed styling.

## Props: `modelValue: boolean`, `label?: string`, `description?: string`, `inputId?: string`, `binary?: boolean (default: true)`, `disabled?: boolean`

## Events: `update:modelValue`

## Unit Tests

- [ ] **Checked State**: Verify checkbox reflects `modelValue`.
- [ ] **Toggle**: Verify `handleUpdate` emits `!!value`.
- [ ] **Label**: Verify label rendered with `for` attribute matching `internalId`.
- [ ] **Description**: Verify italic description rendered below label.
- [ ] **Internal ID**: Verify uses `inputId` prop or auto-generates random ID.
- [ ] **Disabled**: Verify `.is-disabled` class with opacity and pointer-events none.
- [ ] **Hover**: Verify label color changes to accent.
