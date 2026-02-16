# Interactive Form Controls Test Plan

## Description

Covers `TaskDateTimePicker.vue` and `TaskResizer.vue`. These components provide the specialized UI for time and duration manipulation.

## Unit Tests

### TaskDateTimePicker

- [ ] **Time Selection**: Verify that changing hours/minutes updates the `startTime` property correctly.
- [ ] **Date Selection**: Verify that picking a date from the calendar updates the `date` property.

### TaskResizer

- [ ] **Handle Dragging**: Verify that dragging the bottom handle increases/decreases the `duration` value.
- [ ] **Snapping**: Verify resizing snaps to the grid interval (e.g., 5 or 15 minutes).
- [ ] **Constraints**: Verify that a task cannot be resized to a negative or zero duration.

## Integration

- [ ] **Real-time Feedback**: Verify that as the user resizes a task in `DayView`, the `TaskItem` height updates immediately to match the mouse position.
