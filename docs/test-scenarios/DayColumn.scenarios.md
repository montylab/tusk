# Test Scenarios: DayColumn

## Happy Path

1. [ ] **Renders hour grid**
   - Inputs: `startHour: 8`, `endHour: 12`, `date: "2026-01-01"`, `tasks: []`, `taskStatuses: {}`, `currentTime: new Date()`
   - Expected Output: Renders 4 `.hour-row` elements (hours 8–11), each with 4 `.quarter-slot` children.

2. [ ] **Renders tasks via layoutTasks**
   - Inputs: `tasks` array with one task `{ id: 1, startTime: 9, duration: 60 }`, matching `taskStatuses`
   - Expected Output: One `TaskItem` component rendered inside a `TaskResizer` and `TimeHoverTracker`.

3. [ ] **Emits slot-click on quarter click**
   - Actions: Click the `.quarter-slot` for hour 9, quarter 2 (index 1).
   - Expected Output: Emits `slot-click` with `{ startTime: 9.25 }`.

4. [ ] **Emits edit event from TaskItem**
   - Actions: TaskItem emits `edit` with a task object.
   - Expected Output: DayColumn re-emits `edit` with the same task object.

## Edge Cases

1. [ ] **Empty tasks array**
   - Inputs: `tasks: []`
   - Expected Output: Grid renders normally, `.tasks-container` has no children.

2. [ ] **Past time slots get is-past class**
   - Inputs: `date: "2026-01-01"`, `currentTime` set to Jan 1 2026 10:30. Hour 9, quarter 0.
   - Expected Output: That `.quarter-slot` has class `is-past`.

3. [ ] **Future time slots do NOT get is-past class**
   - Inputs: Same as above, hour 11, quarter 0.
   - Expected Output: That `.quarter-slot` does NOT have class `is-past`.

4. [ ] **Ctrl+Click triggers duplicate drag**
   - Actions: mousedown with `ctrlKey: true` on a task wrapper.
   - Expected Output: `startDrag` is called with a new task whose `id` differs from the original.

5. [ ] **Normal mousedown triggers standard drag**
   - Actions: mousedown without modifier keys on a task wrapper.
   - Expected Output: `startDrag` is called with the original task.

## UI/Interaction

1. [ ] **Dragged task gets dragged-origin class**
   - Inputs: `activeDraggedTaskId` matches a rendered task's id.
   - Expected Output: That task's wrapper has class `dragged-origin`.

2. [ ] **Grid snapping in calculateDropData**
   - Inputs: Simulated drop at y-coordinate corresponding to hour 10.25.
   - Expected Output: Returned `time` is snapped to nearest 0.25 increment, clamped within `[startHour, endHour]`.
