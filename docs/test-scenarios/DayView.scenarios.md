# Test Scenarios: DayView

## Happy Path

1. [ ] Renders the correct number of DayColumns based on dates prop
2. [ ] Renders time labels from startHour to endHour
3. [ ] Renders "current time" label if within range
4. [ ] Renders task boundary lines and labels
5. [ ] Calculates and displays day stats (tasks count, deep work)
6. [ ] "Add Day" button emits 'add-day' event
7. [ ] Scroll to current time on mount (after settings load)
8. [ ] Emits 'create-task' when clicking a time slot (via DayColumn or slot interaction)
   - Note: DayView delegates slot clicks to DayColumn? No, DayColumn emits `slot-click`, DayView handles it.
   - DayView template: `@slot-click="handleSlotClick($event.startTime, 0, date)"`
9. [ ] Emits 'edit' when DayColumn emits 'edit'

## Edge Cases

1. [ ] Empty tasksByDate renders empty columns but correct dates
2. [ ] Dates prop empty handles gracefully (though unlikely in usage)
3. [ ] Current time outside startHour/endHour hides current time label
4. [ ] Resize updates header offset (via UpdateHeaderOffset)
5. [ ] Scroll synchronization (scroll area scroll updates `scrollTop`/`scrollLeft` refs passed to DayColumns)

## UI Interaction

1. [ ] Click on "Add Day" triggers add-day emit and scrolls to right
2. [ ] Scrolling the main area updates shared scroll state
3. [ ] Dragging state (isDragging returns true) prevents slot clicks
