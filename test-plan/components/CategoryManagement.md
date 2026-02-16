# Category Management Test Plan

## Description

Covers `CategoriesManager.vue` and related components like `ColorPickerInput` and `CategorySelector`. These components allow users to create, edit, reorder, and delete task categories.

## Unit Tests

### CategoriesManager

- [ ] **Local State**: Verify `localCategories` reflects the `categoriesStore.categoriesArray`.
- [ ] **Add Category**:
  - [ ] Verify validation (name required).
  - [ ] Verify random color assignment on mount/success.
- [ ] **Reordering**: Verify that `vuedraggable` updates the index and calls `updateCategory` on the store with new `order` values.
- [ ] **Inline Edits**: Verify that blurring the name input or changing the color picker triggers store updates.

### ColorPickerInput

- [ ] **Value Sync**: Verify it displays the current hex code and updates the parent via `v-model`.

## Integration

- [ ] **Real-time Sync**: Verify that if a category is added on another device, the manager list updates automatically via the store subscription.
