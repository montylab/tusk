# TrashBasket Component Test Plan

## Description

`TrashBasket.vue` is a sidebar trash zone that registers as a `'trash'` drop zone. It highlights when a dragged task hovers over it.

## Unit Tests

### Zone Registration

- [ ] **Register on Mount**: Verify `registerZone('trash', bounds)`.
- [ ] **Unregister on Unmount**: Verify `unregisterZone('trash')`.
- [ ] **Bounds Update**: Verify ResizeObserver + window resize listener update bounds.
- [ ] **Cleanup**: Verify ResizeObserver disconnected and listener removed on unmount.

### Active State

- [ ] **`isActive` Computed**: Verify `true` when `currentZone === 'trash'`.
- [ ] **CSS `.active`**: Verify class applied when `isActive`.
- [ ] **Active Visual**: Verify `transform: scale(1.1)`, white color, and intense gradient.
- [ ] **Icon Animation**: Verify `scale(1.2) rotate(5deg)` on icon when active.

### Rendering

- [ ] **Icon**: Verify trash icon rendered via `AppIcon`.
- [ ] **Label**: Verify "Delete" text shown.
- [ ] **Label Opacity**: Verify 0.7 default, 1.0 when active.
