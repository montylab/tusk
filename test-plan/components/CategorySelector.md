# CategorySelector Component Test Plan

## Description

`CategorySelector.vue` provides autocomplete category selection with v-model bindings for `name`, `color`, and `isDeepWork`. Supports inline creation of new categories with color picker.

## Props: `name: string`, `color: string`, `isDeepWork: boolean`

## Events: `update:name`, `update:color`, `update:isDeepWork`

## Unit Tests

### Autocomplete Search

- [ ] **Filter**: Verify `searchCategory` filters `categoriesArray` by query (case-insensitive).
- [ ] **New Category Suggestion**: Verify "Create new" option appended when no exact match.
- [ ] **Suggested Color**: Verify new category gets `getRandomCategoryColor()`.

### Selection

- [ ] **Existing Category**: Verify selecting emits `update:name`, `update:color`, `update:isDeepWork` from store.
- [ ] **New Category**: Verify selecting a new suggestion emits `isDeepWork: false`.

### Name Watch

- [ ] **Found Category**: Verify typing existing category name auto-fills color + isDeepWork from store.
- [ ] **Unknown Name**: Verify `isDeepWork` reset to false, color unchanged.
- [ ] **Empty Name**: Verify color and isDeepWork both cleared.

### Color Watch

- [ ] **Hash Prefix**: Verify color emitted with `#` prefix.
- [ ] **Empty Color Fallback**: Verify existing category color or random color assigned.

### `isNewCategory` Computed

- [ ] **New**: Verify true when name not in store.
- [ ] **Existing**: Verify false when name matches a store category.

### Conditional Rendering

- [ ] **Deep Work Toggle**: Verify shown only when `isNewCategory`.
- [ ] **Color Picker Row**: Verify shown only when `isNewCategory`.
- [ ] **Option Color Preview**: Verify shown only for existing categories.
