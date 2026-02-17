# Test Scenarios: Categories Store

## Happy Path

1. [ ] **User Sync (Login)**
   - **Inputs**: `userStore.user` becomes set.
   - **Expected Output**:
     - `firebaseService.subscribeToCategories` is called.
     - `categoriesMap` is populated with data from firebase.
     - `loading` state toggles true -> false.

2. [ ] **User Sync (Logout)**
   - **Inputs**: `userStore.user` becomes null.
   - **Expected Output**:
     - `categoriesMap` is cleared.
     - Firebase subscription is unsubscribed.

3. [ ] **Add Category**
   - **Inputs**: Call `addCategory('Work', '#ff0000', true)`.
   - **Expected Output**:
     - Calls `firebaseService.createCategory`.
     - Returns the new ID.
     - (Note: Local state update relies on the subscription callback, but we can verify the service call).

4. [ ] **Update Category**
   - **Inputs**: Call `updateCategory('cat1', { name: 'New Name' })`.
   - **Expected Output**: Calls `firebaseService.updateCategory` with correct args.

5. [ ] **Delete Category**
   - **Inputs**: Call `deleteCategory('cat1')`.
   - **Expected Output**: Calls `firebaseService.deleteCategory`.

6. [ ] **Ensure Category Exists (Existing)**
   - **Inputs**: Call `ensureCategoryExists('Work', ...)`, 'Work' already in store.
   - **Expected Output**: Returns existing category object, no API call.

7. [ ] **Ensure Category Exists (New)**
   - **Inputs**: Call `ensureCategoryExists('Fun', ...)`, 'Fun' not in store.
   - **Expected Output**: Calls `addCategory`, returns new category object.

8. [ ] **Remap Palette**
   - **Inputs**: Call `remapCategoriesToPalette(['#111', '#222'])`.
   - **Expected Output**: Calls `updateCategory` for each category with cycled colors.

## Edge Cases

1. [ ] **Service Errors**
   - **Inputs**: `firebaseService.createCategory` throws error.
   - **Expected Output**:
     - `error` state is updated with message.
     - App does not crash.

2. [ ] **Empty State**
   - **Inputs**: Firebase returns empty list.
   - **Expected Output**: `categoriesArray` is empty array.
