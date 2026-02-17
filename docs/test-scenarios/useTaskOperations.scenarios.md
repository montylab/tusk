# Test Scenarios: useTaskOperations

## Happy Path

1. [ ] **Start and Complete Internal Drag**
   - **Inputs**:
     - Initial tasks list with one task.
     - Call `startOperation` with valid `taskId` and `opMode='drag'`.
     - Simulate `mousemove` beyond threshold.
     - Simulate `mousemove` to a new time/date.
     - Simulate `mouseup`.
   - **Expected Output**:
     - `config.onTaskDropped` is called with updated `startTime` and `date`.
     - `mode` resets to `'none'`.

2. [ ] **Resize Task Duration (Bottom)**
   - **Inputs**:
     - Call `startOperation` with `opMode='resize-bottom'`.
     - Simulate `mousemove` downwards to increase duration.
     - Simulate `mouseup`.
   - **Expected Output**:
     - `config.onTaskDropped` is called with new `duration`.
     - Start time remains unchanged.

3. [ ] **Resize Task Start (Top)**
   - **Inputs**:
     - Call `startOperation` with `opMode='resize-top'`.
     - Simulate `mousemove` upwards to decrease start time (earlier).
     - Simulate `mouseup`.
   - **Expected Output**:
     - `config.onTaskDropped` is called with new `startTime` and `duration`.
     - End time remains roughly the same (duration adjusts).

4. [ ] **External Drag Start and Drop**
   - **Inputs**:
     - Call `startExternalDrag` with a task object.
     - Simulate `mousemove` onto the calendar area.
     - Simulate `mouseup`.
   - **Expected Output**:
     - `config.onExternalTaskDropped` is called with new `taskId`, `startTime`, `date`.

5. [ ] **Create Task via Slot Click**
   - **Inputs**:
     - Call `handleSlotClick` with hour, quarter, date.
   - **Expected Output**:
     - `emit('create-task')` is triggered with correct `startTime` and `date`.

## Edge Cases

1. [ ] **Drag Threshold Not Met**
   - **Inputs**:
     - Call `startOperation`.
     - Simulate `mousemove` with very small distance (< 5px).
     - Simulate `mouseup`.
   - **Expected Output**:
     - parameters remain unchanged.
     - No drop/resize callbacks are triggered.
     - `mode` resets.

2. [ ] **Drag to Trash**
   - **Inputs**:
     - Start internal drag.
     - Simulate `mousemove` over trash zone (`isOverTrash` becomes true).
     - Simulate `mouseup`.
   - **Expected Output**:
     - `config.onDeleteTask` is called.
     - `onTaskDropped` is NOT called.

3. [ ] **Drag to Sidebar (Todo/Shortcut)**
   - **Inputs**:
     - Start internal drag.
     - Simulate `mousemove` over todo/shortcut zone.
     - Simulate `mouseup`.
   - **Expected Output**:
     - `emit('task-dropped-on-sidebar')` is triggered.

4. [ ] **Resize Beyond Boundaries (Start < startHour)**
   - **Inputs**:
     - Resize top.
     - Move mouse way up.
   - **Expected Output**:
     - `currentSnapTime` is clamped to `config.startHour`.

5. [ ] **Resize Beyond Boundaries (End > endHour)**
   - **Inputs**:
     - Resize bottom.
     - Move mouse way down.
   - **Expected Output**:
     - `currentDuration` stops increasing when end exceeds `config.endHour`.

6. [ ] **Wheel Resize During Drag**
   - **Inputs**:
     - Start drag.
     - Trigger `wheel` event.
   - **Expected Output**:
     - `currentDuration` changes by increments of 15m.
     - `preventDefault` is called on the event.

7. [ ] **Task Not Found on Start**
   - **Inputs**:
     - Call `startOperation` with non-existent ID.
   - **Expected Output**:
     - Function returns early, no listeners attached.

8. [ ] **Component Unmount**
   - **Inputs**:
     - Mount component using composable.
     - Unmount.
   - **Expected Output**:
     - Window event listeners (`mousemove`, `mouseup`, `wheel`) are removed.

## UI/Interaction

1. [ ] **Visual Feedback During Drag**
   - **Inputs**:
     - Internal drag active.
   - **Expected Output**:
     - `activeTaskId`, `currentSnapTime`, `currentSnapDate` reactive refs are updated during move for UI binding.
