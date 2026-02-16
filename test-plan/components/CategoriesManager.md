# CategoriesManager Component Test Plan

## Description

`CategoriesManager.vue` is a settings panel for managing task categories. Supports CRUD operations with drag-to-reorder via `vuedraggable`.

## Unit Tests

### Add Category

- [ ] **Valid Add**: Verify `categoriesStore.addCategory` called with name, color, isDeepWork.
- [ ] **Disabled Button**: Verify add button disabled when `newCategoryName.trim()` is empty.
- [ ] **Form Reset**: Verify name cleared and color randomized after add.

### Edit Category

- [ ] **Rename**: Verify `handleUpdateName` calls `categoriesStore.updateCategory(id, {name})`.
- [ ] **Recolor**: Verify `handleUpdateColor` calls `categoriesStore.updateCategory(id, {color})`.
- [ ] **Deep Work Toggle**: Verify `handleUpdateDeepWork` updates `isDeepWork`.

### Delete Category

- [ ] **Confirm Delete**: Verify `categoriesStore.removeCategory(id)` called.

### Drag Reorder

- [ ] **Draggable List**: Verify `vuedraggable` with `handle=".drag-handle"`.
- [ ] **Order Persistence**: Verify `localCategories` setter calls `categoriesStore.reorderCategories`.
- [ ] **Ghost Class**: Verify `.ghost` CSS class during drag.

### Rendering

- [ ] **Loading State**: Verify "Loading categories..." when `categoriesStore.loading`.
- [ ] **Empty State**: Verify "No categories found" message.
- [ ] **Color Stripe**: Verify `.color-stripe` bg uses `newCategoryColor`.
- [ ] **Category Card**: Verify each card shows drag handle, color indicator, name input, deep work checkbox, delete button.
