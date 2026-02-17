# Test Scenarios: firebaseService

## Happy Path

1. [ ] **Get User Root**
   - **Inputs**: Call any service method when `auth.currentUser` is set.
   - **Expected Output**: Operation proceeds using `users/{uid}` as root.

2. [ ] **Subscribe to Date (Calendar)**
   - **Inputs**: `subscribeToDate('2024-01-01', callback)`
   - **Expected Output**:
     - Calls `onValue` on `users/{uid}/calendar/2024-01-01`.
     - Callback receives array of tasks with `id` and `date` properties.

3. [ ] **Subscribe to List (Todo/Shortcuts)**
   - **Inputs**: `subscribeToList('todo', callback)`
   - **Expected Output**:
     - Calls `onValue` on `users/{uid}/todo`.
     - Callback receives array of tasks with `id`.

4. [ ] **Create Task**
   - **Inputs**: `createTaskInPath('todo', taskData)`
   - **Expected Output**:
     - Calls `push` to generate ID.
     - Calls `set` with task data.
     - Returns task with new ID.

5. [ ] **Update Task**
   - **Inputs**: `updateTaskInPath('todo', 'task1', { completed: true })`
   - **Expected Output**:
     - Calls `update` on `users/{uid}/todo/task1`.

6. [ ] **Delete Task**
   - **Inputs**: `deleteTaskFromPath('todo', 'task1')`
   - **Expected Output**:
     - Calls `remove` on `users/{uid}/todo/task1`.

7. [ ] **Move Task (Atomic)**
   - **Inputs**: `moveTask('todo', 'calendar/2024-01-01', task, updates)`
   - **Expected Output**:
     - Constructs atomic update object.
     - `users/{uid}/todo/{taskId}` = null.
     - `users/{uid}/calendar/2024-01-01/{taskId}` = { ...task, ...updates }.
     - Calls `update` on `users/{uid}`.

8. [ ] **Categories CRUD**
   - **Inputs**: Create/Update/Delete category.
   - **Expected Output**: Corresponding Firebase refs and methods called.

## Edge Cases

1. [ ] **No Authenticated User**
   - **Inputs**: Call `getUserRoot()` (indirectly via other methods) when `auth.currentUser` is null.
   - **Expected Output**: Throws Error "User must be logged in".

2. [ ] **Empty Data in Subscription**
   - **Inputs**: Database returns null snapshot val.
   - **Expected Output**: Callback receives empty array `[]` (not null/undefined).
