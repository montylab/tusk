# Test Scenarios: MonthCalendar

## Happy Path

1. [ ] Renders header with correct month and year
2. [ ] Renders navigation buttons (prev/next)
3. [ ] Renders day names header (Mon-Sun)
4. [ ] Renders calendar grid with correct number of days (MonthDayCell)
5. [ ] Passes correct props to MonthDayCell (date, tasks, current-month)
6. [ ] Emits 'prev-month' event on button click
7. [ ] Emits 'next-month' event on button click
8. [ ] Emits 'create-task' when MonthDayCell emits create
9. [ ] Opens popover when MonthDayCell emits task-click
10. [ ] Emits 'edit-task' when MonthDayCell emits task-dblclick

## Task Popover Interactions

1. [ ] Closes popover on close event
2. [ ] Emits 'edit-task' and closes popover on edit event
3. [ ] Calls store.deleteScheduledTask and closes popover on delete event

## Drag and Drop

1. [ ] Sets drag state on task-dragstart
2. [ ] Calls store.moveScheduledTask on drop (different date)
3. [ ] Does NOT call store move on drop (same date)
4. [ ] Resets drag state after drop
