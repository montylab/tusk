# Month View Details Test Plan

## Description

Covers the sub-components used within the `MonthCalendar`: `MonthDayCell.vue`, `MonthTaskItem.vue`, and `MonthTaskPopover.vue`.

## Unit Tests

### MonthDayCell

- [ ] **Month Context**: Verify that days from adjacent months receive the `.other-month` class (reduced opacity).
- [ ] **Today Highlight**: Verify the current date receives the `.is-today` class and a primary-colored circle.
- [ ] **Task Sorting**: Verify tasks in the cell are sorted by `startTime` (even if displayed simply).

### MonthTaskItem

- [ ] **Coloration**: Verify the bullet point color matches the task's category.
- [ ] **Time Display**: Verify the time is formatted as `H:MM`.

### MonthTaskPopover (Floating Details)

- [ ] **Positioning**: Verify `calculatePosition` keeps the popover within the viewport bounds.
- [ ] **Teleportation**: Verify the popover is teleported to `body` to avoid parent container clipping.
- [ ] **Interactions**: Verify "Edit" and "Delete" buttons emit the correct events to the calendar.

## Integration

- [ ] **Click Flow**: Verify clicking a cell triggers "Create", while clicking an item triggers the popover.
