# Categories Store Test Plan

## Description

Pinia store managing task categories with Firebase real-time sync. Supports CRUD, reorder, and palette remapping.

## Unit Tests

### State & Getters

- [ ] **`categoriesArray`**: Verify sorted by `order` ascending.
- [ ] **`getCategoryById`**: Verify returns category from `categoriesMap`.
- [ ] **Loading/Error**: Verify flags update during sync.

### Sync Logic

- [ ] **User Login**: Verify `setupSync` subscribes to Firebase categories.
- [ ] **User Logout**: Verify `clearState` empties map and unsubscribes.
- [ ] **Snapshot Update**: Verify `categoriesMap` rebuilt from callback data.

### Actions

- [ ] **`addCategory`**: Verify `firebaseService.createCategory` with auto-order (`maxOrder + 10`).
- [ ] **`updateCategory`**: Verify `firebaseService.updateCategory(id, updates)`.
- [ ] **`deleteCategory`**: Verify `firebaseService.deleteCategory(id)`.
- [ ] **`ensureCategoryExists`**: Verify returns existing by name (case-insensitive) or creates new.
- [ ] **`remapCategoriesToPalette`**: Verify all categories recolored using palette with modular index.

### Error Handling

- [ ] **Add Failure**: Verify `error.value` set on exception.
- [ ] **Update Failure**: Verify `error.value` set.
- [ ] **Delete Failure**: Verify `error.value` set.
