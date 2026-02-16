# useDragState Composable Test Plan

## Description

Legacy collision detection state (simpler version before `useDragOperator`). Manages zone bounds and cursor-over-zone detection.

## Unit Tests

- [ ] **Zone Types**: Verify `DragZone` type includes trash, todo, shortcut, calendar, add-button, null.
- [ ] **Bounds Storage**: Verify reactive state stores bounds for each zone.
- [ ] **`check` Function**: Verify point-in-rectangle check against `DOMRect`.
- [ ] **`updateCollision`**: Verify priority order: trash > todo > shortcut > add-button > calendar > null.
- [ ] **Computed Flags**: Verify `isOverTrash`, `isOverTodo`, `isOverShortcut`, `isOverCalendar`, `isOverAddButton`.
- [ ] **`resetCollisions`**: Verify `overZone` cleared to null.
