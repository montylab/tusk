# Test Scenarios: Nerve (Event Bus)

## Happy Path

1. [ ] **Event Constants**
   - **Inputs**: Access `NERVE_EVENTS`.
   - **Expected Output**: Contains keys like `TASK_CREATED`, `MINUTE_TICK`, etc.

2. [ ] **Emit and Listen (Task Event)**
   - **Inputs**:
     - Register handler for `NERVE_EVENTS.TASK_CREATED`.
     - Emit `NERVE_EVENTS.TASK_CREATED` with payload `{ taskId: '123' }`.
   - **Expected Output**: Handler receives payload `{ taskId: '123' }`.

3. [ ] **Emit and Listen (Void Event)**
   - **Inputs**:
     - Register handler for `NERVE_EVENTS.TASK_MOVED`.
     - Emit `NERVE_EVENTS.TASK_MOVED` (undefined payload).
   - **Expected Output**: Handler is called.

4. [ ] **Unsubscribe**
   - **Inputs**:
     - Register handler.
     - Call `nerve.off(event, handler)`.
     - Emit event.
   - **Expected Output**: Handler is NOT called.

5. [ ] **Clear All**
   - **Inputs**:
     - Register multiple handlers.
     - Call `nerve.all.clear()`.
     - Emit events.
   - **Expected Output**: No handlers called.

## Edge Cases

1. [ ] **Multiple Listeners**
   - **Inputs**: Register multiple handlers for same event.
   - **Expected Output**: All handlers called on emit.
