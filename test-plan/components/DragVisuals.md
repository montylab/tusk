# Drag & Drop Visuals Test Plan

## Description

Covers `DragOperator.vue` and `DragResizer.vue`. These components provide the visual "ghost" and resize handles during interactions.

## Unit Tests

### DragOperator (Ghost)

- [ ] **Visibility**: Verify the ghost only appears when `isDragging` is true.
- [ ] **Snapping**: Verify the ghost snaps to the calendar grid when over a `DayColumn`.
- [ ] **Transformation**: Verify the ghost transitions to a "destroying" state (shrinking etc.) when over the trash.

## Integration

- [ ] **State Sync**: Verify the ghost task properties (time, duration) update in real-time as the user drags over different time slots.
