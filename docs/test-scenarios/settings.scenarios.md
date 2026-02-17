# Test Scenarios: Settings Store

## Happy Path

1. [ ] **Default Initialization (No User)**
   - **Inputs**: `userStore.user` is null.
   - **Expected Output**:
     - `settings` matches `DEFAULT_SETTINGS` (e.g. notifications enabled, snapMinutes 15).
     - `loading` is false.

2. [ ] **User Sync (Login)**
   - **Inputs**: `userStore.user` becomes set.
   - **Expected Output**:
     - `firebaseService.subscribeToSettings` is called.
     - `settings` updates with data from firebase (merged with defaults).
     - `loading` toggles.

3. [ ] **User Sync (Logout)**
   - **Inputs**: `userStore.user` becomes null after being set.
   - **Expected Output**:
     - `settings` resets to `DEFAULT_SETTINGS`.
     - Subscription unsubscribes.

4. [ ] **Update Settings**
   - **Inputs**: Call `updateSettings({ snapMinutes: 30 })`.
   - **Expected Output**: Calls `firebaseService.updateSettings`.

5. [ ] **Get Random Category Color**
   - **Inputs**: Call `getRandomCategoryColor()`.
   - **Expected Output**: Returns a string from `settings.categoryColors`.

## Edge Cases

1. [ ] **Partial Settings from Firebase**
   - **Inputs**: Firebase returns only `{ snapMinutes: 60 }`.
   - **Expected Output**:
     - `settings` has `snapMinutes: 60`.
     - Other fields (e.g. `notifications`) retain default values.

2. [ ] **Empty Settings from Firebase**
   - **Inputs**: Firebase returns null/undefined.
   - **Expected Output**: `settings` matches `DEFAULT_SETTINGS` exactly.
