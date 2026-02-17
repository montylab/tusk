# Test Scenarios: AppHeader

## Happy Path

1. [ ] **Navigation Links (Active State)**
   - **Inputs**: Current route name is 'day'.
   - **Expected Output**:
     - 'Day' link has `.active` class.
     - 'Week' and 'Month' links do not have `.active` class.

2. [ ] **Create Task Trigger**
   - **Inputs**: User clicks "Create Task" button.
   - **Expected Output**: Calls `uiStore.triggerCreateTask()`.

3. [ ] **Theme Toggle**
   - **Inputs**: User clicks Theme button.
   - **Expected Output**: Calls `uiStore.toggleThemePanel()`.

4. [ ] **User Profile (Photo)**
   - **Inputs**: `userStore.user` has `photoURL`.
   - **Expected Output**: Renders `img.user-avatar` with correct src.

5. [ ] **User Profile (Placeholder)**
   - **Inputs**: `userStore.user` has no `photoURL`, but has `displayName="John"`.
   - **Expected Output**: Renders placeholder with initial "J".

## Edge Cases

1. [ ] **No User**
   - **Inputs**: `userStore.user` is null.
   - **Expected Output**: `.header-right` (Create Task, Profile, etc.) is NOT rendered.

2. [ ] **Unknown Route**
   - **Inputs**: Current route name is 'settings'.
   - **Expected Output**: No navigation link is active.
