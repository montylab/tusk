# useTaskOperations Composable Test Plan

## Description

Multi-mode operation handler managing drag, resize, and mouse interactions within the calendar grid. Supports mouse and external drag sources.

## Unit Tests

### Operation Modes

- [ ] **Drag Mode**: Verify task repositioning via cursor offset calculations.
- [ ] **Resize Mode**: Verify task duration changes with snap grid.
- [ ] **Click vs Drag**: Verify small mouse movement detected as click, not drag.

### Start Operation

- [ ] **Internal Start**: Verify `startOperation(e, taskId, mode)` initializes state from task.
- [ ] **External Drag Start**: Verify `startExternalDrag` initializes from sidebar task with optional Y offset.

### Mouse Move

- [ ] **Snap to Grid**: Verify time snaps to 15-min increments.
- [ ] **Column Detection**: Verify task moves between date columns based on X position.
- [ ] **Zone Detection**: Verify `useDragState.updateCollision` called.

### Mouse Wheel

- [ ] **Duration Adjust**: Verify scroll adjusts active task duration by snap increment.
- [ ] **Min Duration**: Verify duration can't go below snap minutes.

### Mouse Up / Drop

- [ ] **Calendar Drop**: Verify emit `task-dropped` or `external-task-dropped` with computed data.
- [ ] **Trash Drop**: Verify emit `task-deleted` or `external-task-deleted`.
- [ ] **Sidebar Drop**: Verify `onExternalTaskDroppedOnSidebar` callback.
- [ ] **No-Op Drop**: Verify no update if position unchanged.

### Slot Click

- [ ] **Emit**: Verify `handleSlotClick(hour, quarter, date)` emits `create-task`.

### Cleanup

- [ ] **Listener Removal**: Verify `onUnmounted` removes all window listeners.
