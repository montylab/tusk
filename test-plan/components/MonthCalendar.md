# MonthCalendar Component Test Plan

## Description

`MonthCalendar.vue` renders the full monthly grid with navigation, day names, week rows, task popovers, and native HTML5 drag-and-drop for moving tasks between dates.

## Props

| Prop          | Type                     |
| :------------ | :----------------------- |
| `year`        | `number`                 |
| `month`       | `number`                 |
| `tasksByDate` | `Record<string, Task[]>` |

## Events: `create-task`, `edit-task`, `prev-month`, `next-month`

## Unit Tests

### Grid Rendering

- [ ] **Calendar Grid**: Verify `getMonthCalendarGrid(year, month)` produces correct week rows.
- [ ] **Day Names**: Verify 7 short day names via `getShortDayName`.
- [ ] **Month Title**: Verify `getMonthName(month) + year` in header.
- [ ] **Navigation**: Verify prev/next buttons emit `prev-month` / `next-month`.

### Popover

- [ ] **Task Click**: Verify clicking a task stores `popoverTask`, `popoverAnchor`, `popoverVisible`.
- [ ] **Task DblClick**: Verify double-click closes popover and emits `edit-task`.
- [ ] **Popover Close**: Verify `handlePopoverClose` resets state.
- [ ] **Popover Edit**: Verify emits `edit-task` and hides popover.
- [ ] **Popover Delete**: Verify calls `tasksStore.deleteScheduledTask` when task has a date.

### Drag-and-Drop

- [ ] **Drag Start**: Verify `draggedTask` and `dragSourceDate` are set, `dataTransfer.effectAllowed = 'move'`.
- [ ] **Drop Same Day**: Verify no-op if source === target.
- [ ] **Drop Different Day**: Verify `tasksStore.moveScheduledTask` called with correct args.
- [ ] **Drag Reset**: Verify `draggedTask` and `dragSourceDate` cleared after drop.

### Task Helpers

- [ ] **`getTasksForDate`**: Verify returns correct tasks or empty array for unknown dates.

## Integration

- [ ] **MonthDayCell Binding**: Verify all events (`create`, `task-click`, `task-dblclick`, `task-dragstart`, `drop`) are forwarded.
- [ ] **MonthTaskPopover Binding**: Verify `task`, `visible`, `anchorEl`, and all events are bound correctly.
