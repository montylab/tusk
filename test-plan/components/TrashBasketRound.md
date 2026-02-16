# TrashBasketRound Component Test Plan

## Description

`TrashBasketRound.vue` is a floating circular trash bin fixed at bottom-right corner. It registers the same `'trash'` zone and features a "swallow" animation when a task is deleted.

## Unit Tests

### Zone Registration

- [ ] **Register on Mount**: Verify `registerZone('trash', bounds)`.
- [ ] **Bounds on Mouseover**: Verify `updateBounds` called on `@mouseover`.
- [ ] **ResizeObserver**: Verify observer attached and updates bounds.
- [ ] **Unregister**: Verify cleanup on unmount.

### Computed States

- [ ] **`isOver`**: Verify `currentZone === 'trash'`.
- [ ] **`isDestroying`**: Verify from `useDragOperator()`.

### Visual States

- [ ] **Default**: Verify `--basket-size: 8rem`, partially off-screen (bottom/right -30%).
- [ ] **Hover**: Verify `scale(1.1)`.
- [ ] **Is Over**: Verify `scale(1.8) translate(-10%, -10%)` with glow shadow.
- [ ] **Is Destroying**: Verify `swallow` keyframe animation (scale 1.8 → 2.3 → 1.0).

### Icon

- [ ] **Render**: Verify `AppIcon name="trash"` with 3rem size.
- [ ] **Position Offset**: Verify icon offset by -15% on each axis.
- [ ] **Over Rotation**: Verify `scale(1.2) rotate(-15deg)` when `isOver`.
- [ ] **Hover Rotation**: Verify `scale(1.1) rotate(-5deg)` on hover.
