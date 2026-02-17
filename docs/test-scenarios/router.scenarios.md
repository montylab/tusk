# Test Scenarios: Router

## Happy Path

1. [ ] **Route Definitions**
   - **Inputs**: Initialize router.
   - **Expected Output**:
     - Routes for `home` (/), `week`, `month`, `settings`, `signin` exist.
     - `day` route accepts `:date` param.

2. [ ] **Public Access (Signin)**
   - **Inputs**: Navigate to `/signin` while unauthenticated.
   - **Expected Output**: Navigation allowed.

3. [ ] **Protected Access (Authenticated)**
   - **Inputs**:
     - Mock `userStore.user` to be present.
     - Navigate to `/settings`.
   - **Expected Output**: Navigation allowed.

4. [ ] **Redirect to Home (Already Authenticated)**
   - **Inputs**:
     - Mock `userStore.user` to be present.
     - Navigate to `/signin`.
   - **Expected Output**: Redirected to `/`.

5. [ ] **Deep Linking (Day View)**
   - **Inputs**:
     - Authenticated.
     - Navigate to `/day/2024-01-01`.
   - **Expected Output**: Component `DayViewPage` rendered, route param `date` is `2024-01-01`.

## Edge Cases

1. [ ] **Unauthenticated Access to Protected Route**
   - **Inputs**:
     - Mock `userStore.user` as null.
     - Navigate to `/settings`.
   - **Expected Output**: Redirected to `/signin`.

2. [ ] **Auth Loading State**
   - **Inputs**:
     - `userStore.loading` is true initially.
     - Navigate to `/settings`.
     - Simulate `loading` becoming false after delay (with user=null).
   - **Expected Output**:
     - Navigation pauses while loading.
     - Redirects to `/signin` after loading finishes (and user is null).

3. [ ] **Auth Loading State (Success)**
   - **Inputs**:
     - `userStore.loading` is true initially.
     - Navigate to `/settings`.
     - Simulate `loading` becoming false (with user=present).
   - **Expected Output**: Navigation proceeds to `/settings`.
