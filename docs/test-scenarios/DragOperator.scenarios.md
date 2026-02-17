# Test Scenarios: DragOperator

## Happy Path

1. [ ] Hidden by default (isDragging = false)
2. [ ] Visible when isDragging = true
3. [ ] Follows mouse position when not over calendar (ghostPosition)
4. [ ] Snaps to calendar slot when dropData.snappedRect is present
5. [ ] Renders TaskItem with ghost task data
6. [ ] Ghost task inherits properties from draggedTask
7. [ ] Ghost task applies overrides from dropData (time, duration, date)

## Edge Cases

1. [ ] isDestroying = true triggers destroy animation styles (scale 0, rotate, opacity)
2. [ ] isOverCalendar = true but no snappedRect falls back to default logic
3. [ ] No ghostPosition hides the element (or empty style)
4. [ ] Dragged task null (should not render)

## UI Interaction

1. [ ] Update ghost position reactive to useDragOperator state changes
