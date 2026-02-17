# Test Scenarios: Task API

## Happy Path

1. [ ] **Initialization (Seeding)**
   - **Inputs**: Clean `localStorage`. Call `getTasks()`.
   - **Expected Output**:
     - `localStorage` populated with `INITIAL_TASKS`.
     - Returns `INITIAL_TASKS`.

2. [ ] **Get Tasks**
   - **Inputs**: `localStorage` has task data. Call `getTasks()`.
   - **Expected Output**: Returns parsed task array.

3. [ ] **Create Task**
   - **Inputs**: `createTask({ text: 'New Item' })`.
   - **Expected Output**:
     - Returns task with generated `id`.
     - `localStorage` contains new task.

4. [ ] **Update Task**
   - **Inputs**:
     - Existing task ID 1.
     - `updateTask(1, { completed: true })`.
   - **Expected Output**:
     - Returns updated task.
     - `localStorage` reflects change.

5. [ ] **Delete Task**
   - **Inputs**:
     - Existing task ID 1.
     - `deleteTask(1)`.
   - **Expected Output**:
     - `localStorage` no longer contains task 1.

## Edge Cases

1. [ ] **Update Non-Existent Task**
   - **Inputs**: `updateTask(9999, {})`.
   - **Expected Output**: Throws Error "Task with id 9999 not found".

2. [ ] **Delete Non-Existent Task**
   - **Inputs**: `deleteTask(9999)`.
   - **Expected Output**: No error, list remains unchanged (or filtered same).
