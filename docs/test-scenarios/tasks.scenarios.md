# Test Scenarios: Tasks Store

## Happy Path

1. [ ] **Initialization & Sync**
   - **Inputs**: User logs in (`userStore.user` becomes defined).
   - **Expected Output**:
     - `setupSync` is called.
     - Subscribes to `currentDates`.
     - Subscribes to `todo` and `shortcuts`.
     - `tasks` state is populated from mock firebase data.

2. [ ] **Date Management**
   - **Inputs**: `addDate('2023-01-01')`.
   - **Expected Output**:
     - Date added to `currentDates`.
     - Subscribes to `calendar/2023-01-01`.
   - **Inputs**: `removeDate('2023-01-01')`.
   - **Expected Output**:
     - Date removed from `currentDates`.
     - Unsubscribes from `calendar/2023-01-01`.
     - Tasks for that date removed from state.

3. [ ] **Create Operations**
   - **Inputs**: `createTodo({ text: 'New Todo' })`.
   - **Expected Output**: Calls `firebaseService.createTaskInPath`, emits `TASK_CREATED`.
   - **Inputs**: `createShortcut(...)`.
   - **Expected Output**: Calls `firebaseService.createTaskInPath`.
   - **Inputs**: `createScheduledTask({ date: '2023-01-01' })`.
   - **Expected Output**: Calls `firebaseService.createTaskInPath` at correct path, emits `TASK_CREATED`.

4. [ ] **Update Operations**
   - **Inputs**: `updateTodo(id, { completed: true })`.
   - **Expected Output**: Calls `firebaseService.updateTaskInPath`.
   - **Inputs**: `updateScheduledTask(id, date, { completed: true })`.
   - **Expected Output**: Calls `firebaseService.updateTaskInPath`, emits `TASK_COMPLETED`.

5. [ ] **Delete Operations**
   - **Inputs**: `deleteTodo(id)`.
   - **Expected Output**: Calls `firebaseService.deleteTaskFromPath`, emits `TASK_DELETED`.

6. [ ] **Move Operations**
   - **Inputs**: `moveTodoToCalendar(id, date, start, duration)`.
   - **Expected Output**: Calls `firebaseService.moveTask` with correct paths and updates. Emits `TASK_MOVED`.
   - **Inputs**: `moveCalendarToTodo(id, date)`.
   - **Expected Output**: Calls `firebaseService.moveTask`.

7. [ ] **Copy Operations**
   - **Inputs**: `copyShortcutToTodo(id)`.
   - **Expected Output**: Creates new todo from shortcut data.

8. [ ] **Getters**
   - **Inputs**: State has tasks in various lists. Call `getTaskById(id)`.
   - **Expected Output**: Returns correct task object.

## Edge Cases

1. [ ] **Sync without User**
   - **Inputs**: `userStore.user` is null.
   - **Expected Output**: State is cleared, no subscriptions active.

2. [ ] **Invalid Moves**
   - **Inputs**: `moveTodoToCalendar` with non-existent ID.
   - **Expected Output**: Console error, no firebase call.

3. [ ] **Update Safety Checks**
   - **Inputs**: `updateTodo` with `startTime` change.
   - **Expected Output**: Warns to use move action, no firebase call.
