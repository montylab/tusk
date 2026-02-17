# Test Scenarios: CategoriesManager

## Happy Path

1. [ ] **Render List**
   - **Inputs**: Store has categories `[{ id: '1', name: 'Work', order: 0 }]`.
   - **Expected Output**: Renders 1 category item with name "Work".

2. [ ] **Add Category**
   - **Inputs**:
     - Name input: "New Cat".
     - Click "Add Category".
   - **Expected Output**:
     - Calls `categoriesStore.addCategory('New Cat', ...)`
     - Clear name input.
     - Resets color/deep work inputs.

3. [ ] **Update Name**
   - **Inputs**:
     - Existing category "Work".
     - Edit input to "Work Hard".
     - Blur input.
   - **Expected Output**: calls `categoriesStore.updateCategory(id, { name: 'Work Hard' })`.

4. [ ] **Update Color**
   - **Inputs**: Change color picker value.
   - **Expected Output**: calls `categoriesStore.updateCategory(id, { color: ... })`.

5. [ ] **Update Deep Work**
   - **Inputs**: Toggle Deep Work checkbox.
   - **Expected Output**: calls `categoriesStore.updateCategory(id, { isDeepWork: ... })`.

6. [ ] **Delete Category**
   - **Inputs**: Click delete button + Confirm.
   - **Expected Output**: calls `categoriesStore.deleteCategory(id)`.

7. [ ] **Reorder Categories**
   - **Inputs**: Drag item from index 0 to 1.
   - **Expected Output**:
     - `localCategories` updates.
     - calls `categoriesStore.updateCategory` with new `order` values.

## Edge Cases

1. [ ] **Empty State**
   - **Inputs**: Store has empty categories array.
   - **Expected Output**: Displays "No categories found".

2. [ ] **Loading State**
   - **Inputs**: `categoriesStore.loading = true`.
   - **Expected Output**: Displays "Loading categories...".

3. [ ] **Add Empty Name**
   - **Inputs**: Name input is empty. Click Add.
   - **Expected Output**: Button disabled or no action.
