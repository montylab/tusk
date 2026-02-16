# TaskResizer Component Test Plan

## Description

`TaskResizer.vue` wraps a task with top and bottom resize handles. Dragging a handle changes the task's start time or duration with 15-min snap, using local state that persists to the store on release.

## Props: `task: Task`, `layoutStyle: Record<string, any>`, `startHour: number`

## Events: `start-resize`, `end-resize`

## Slot: `#default="{ resizedTask, isResizing }"`

## Unit Tests

### Display Task

- [ ] **No Resize**: Verify slot receives original `props.task`.
- [ ] **During Resize**: Verify slot receives modified task with `localStartTime`/`localDuration`.

### Top Handle Resize

- [ ] **Start Time Change**: Verify dragging top handle adjusts `localStartTime`.
- [ ] **Duration Compensation**: Verify end time remains fixed (duration decreases as start increases).
- [ ] **Snap**: Verify start time snaps to `settings.snapMinutes` (default 15).
- [ ] **Min Duration**: Verify duration can't go below `snapMinutes`.

### Bottom Handle Resize

- [ ] **Duration Change**: Verify dragging bottom handle changes `localDuration`.
- [ ] **Snap**: Verify duration snaps to nearest `snapMinutes` increment.
- [ ] **Min Duration**: Verify `Math.max(snap, newDuration)`.

### Event Handling

- [ ] **Mouse**: Verify `mousedown` → `mousemove` → `mouseup` lifecycle.
- [ ] **Touch**: Verify `touchstart` → `touchmove` (passive: false) → `touchend` lifecycle.
- [ ] **Stop Propagation**: Verify `onStart` calls `e.stopPropagation()`.
- [ ] **Prevent Default**: Verify `e.preventDefault()` when cancelable.

### Persistence (`onEnd`)

- [ ] **Store Update**: Verify `tasksStore.updateScheduledTask` called with final start time + duration.
- [ ] **No-Op**: Verify no update if values unchanged.
- [ ] **Cleanup**: Verify all window listeners removed.

### Layout Override

- [ ] **During Resize**: Verify inline style overrides `top` and `height` based on local values.
- [ ] **Z-Index**: Verify `zIndex: 20` during resize.

### Task Watch

- [ ] **Sync**: Verify local state syncs from `props.task` when NOT resizing.
