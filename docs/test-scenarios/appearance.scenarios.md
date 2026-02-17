# Test Scenarios: Appearance Store

## Happy Path

1. [ ] **Default Initialization**
   - **Inputs**: `localStorage` is empty.
   - **Expected Output**:
     - `theme` is 'dark'.
     - `colorScheme` is 'glass'.
     - `interfaceScale` is 100.
     - `hourHeightBase` is 80.
     - `uiScale` is 1.

2. [ ] **Load from LocalStorage**
   - **Inputs**: `localStorage` contains valid settings (e.g., `{ "theme": "light", "interfaceScale": 150 }`).
   - **Expected Output**: Store initializes with these values.

3. [ ] **Update Theme**
   - **Inputs**: Change `theme` to 'light'.
   - **Expected Output**: `theme` state updates, `localStorage` is updated with new theme.

4. [ ] **Update Interface Scale**
   - **Inputs**: Change `interfaceScale` to 150.
   - **Expected Output**:
     - `uiScale` becomes 1.5.
     - `hourHeight` updates (base \* 1.5).
     - `localStorage` is updated.

## Edge Cases

1. [ ] **Corrupt LocalStorage**
   - **Inputs**: `localStorage` has invalid JSON string.
   - **Expected Output**: Should handle gracefully (or fail if not handled, currently might crash main app). _Note: Current implementation assumes valid JSON or empty._

2. [ ] **Missing LocalStorage Keys**
   - **Inputs**: Partial object in `localStorage` (e.g. `{ "theme": "pinky" }` only).
   - **Expected Output**: Missing keys use defaults (e.g. `interfaceScale` 100).
