# Test Scenarios: ColorSchemeDebug

## Happy Path

1. [ ] **Initial Rendering**
   - **Inputs**:
     - Mount component.
     - Mock `useCategoriesStore` with some categories.
   - **Expected Output**:
     - Header with title "Color Scheme Debug" is visible.
     - 4 Remap buttons (Default, Tailwind, Radix, IBM Carbon) are visible.
     - Columns for "All Past", "All Active", "All Future" are visible.
     - Columns for each mock category are visible.
     - Mock schedule columns are visible.

2. [ ] **Remap Palette Interaction**
   - **Inputs**:
     - Click "Tailwind" button.
     - Click "Radix" button.
   - **Expected Output**:
     - `categoriesStore.remapCategoriesToPalette` is called with appropriate color arrays.

3. [ ] **Data Generation Verification**
   - **Inputs**:
     - Mock categories: "Work", "Personal".
   - **Expected Output**:
     - Computed `pastTasks` contains tasks for Work and Personal.
     - Computed `activeTasks` contains tasks for Work and Personal.
     - `DayColumn` components receive these tasks as props.

## Edge Cases

1. [ ] **Empty Categories**
   - **Inputs**:
     - Mock `useCategoriesStore` with empty categories list.
   - **Expected Output**:
     - Component renders without error.
     - Category-specific columns are not rendered.
     - "All Past/Active/Future" columns are empty (or exist but have no tasks).
