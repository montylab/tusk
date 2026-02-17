# Test Scenarios: MonthDayCell

## Happy Path

1. [ ] Renders day number correctly from date
2. [ ] Renders tasks list sorted by startTime
3. [ ] Applies 'other-month' class when date month != currentMonth
4. [ ] Applies 'is-today' class when date is today
5. [ ] Emits 'create' when clicking on cell background (cell-content)
6. [ ] Emits 'create' when clicking on day header
7. [ ] Emits 'task-click' when MonthTaskItem emits click
8. [ ] Emits 'task-dblclick' when MonthTaskItem emits dblclick

## Drag and Drop

1. [ ] Emits 'task-dragstart' when MonthTaskItem emits dragstart
2. [ ] Sets 'drag-over' class and emits 'dragover' on dragover event
3. [ ] Removes 'drag-over' class on dragleave
4. [ ] Removes 'drag-over' class and emits 'drop' on drop event

## Edge Cases

1. [ ] Sorting handles tasks with missing startTime (treats as 0)
2. [ ] Does not emit 'create' when clicking on child elements not allowed (though logic is whitelist-based)
