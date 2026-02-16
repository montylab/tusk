# Special Zones Test Plan

## Description

Covers `TrashBasket.vue`, `TrashBasketRound.vue`, and `AddDayZone.vue`. These are specialized drop zones registered in the `useDragOperator`.

## Unit Tests

### TrashBasket / TrashBasketRound

- [ ] **Registration**: Verify they register themselves as the `'trash'` zone on mount.
- [ ] **Active Highlighting**: Verify they receive the `.active` class when a task is hovered over them during a drag.
- [ ] **Scale on Hover**: Verify visual feedback (scale up, rotate icon) when active.

### AddDayZone

- [ ] **Registration**: Verify it registers as the `'add-day-zone'`.
- [ ] **Auto-Label**: Verify the label updates dynamically to the "Next Date" (e.g., "Monday (Oct 27)").
- [ ] **Click Trigger**: Verify clicking (or dropping) triggers the `add-day` event.

## Integration

- [ ] **Relocation Flow**: Verify that dropping a task on any trash component calls `tasksStore.deleteTask` on the correct path.
