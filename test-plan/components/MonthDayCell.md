# MonthDayCell Component Test Plan

## Description

`MonthDayCell.vue` is a single day cell in the monthly grid. It shows the day number, sorted tasks, and handles click-to-create and HTML5 drag-and-drop.

## Props

| Prop           | Type     |
| :------------- | :------- |
| `date`         | `string` |
| `tasks`        | `Task[]` |
| `currentMonth` | `number` |

## Events: `create`, `task-click`, `task-dblclick`, `task-dragstart`, `dragover`, `drop`

## Unit Tests

### Computed Values

- [ ] **`isCurrentMonth`**: Verify `getMonthFromDate(date) === currentMonth`.
- [ ] **`isTodayDate`**: Verify `isToday(date)` returns correct boolean.
- [ ] **`dayNumber`**: Verify `new Date(date).getDate()` extraction.
- [ ] **`sortedTasks`**: Verify tasks sorted by `startTime` ascending (null → 0).

### Rendering

- [ ] **Day Number**: Verify `.day-number` shows correct date.
- [ ] **Today Highlight**: Verify `.is-today` class applies accent border + badge circle.
- [ ] **Other Month Dim**: Verify `.other-month` class applies `opacity: 0.4`.
- [ ] **Drag Over**: Verify `.drag-over` class applies accent background.
- [ ] **Task List**: Verify `MonthTaskItem` rendered for each sorted task.

### Interactions

- [ ] **Cell Click (Create)**: Verify click on `.cell-content`, `.day-header`, or `.day-number` emits `create`.
- [ ] **Cell Click (Ignore Task)**: Verify clicking on a task item does NOT emit `create`.
- [ ] **Drag Over**: Verify `preventDefault` and `isDragOver = true`.
- [ ] **Drag Leave**: Verify `isDragOver = false`.
- [ ] **Drop**: Verify `preventDefault`, `isDragOver = false`, emit `drop(date)`.
