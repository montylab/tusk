# TimeHoverTracker Component Test Plan

## Description

Renderless component that sets `timeStore.hoveredTimeRange` on mouseenter/mouseleave, passed to children via scoped slot.

## Props: `start: number`, `duration: number`

## Unit Tests

- [ ] **Mouseenter**: Verify `setHoveredTimeRange({ start, duration })` called.
- [ ] **Mouseleave**: Verify `setHoveredTimeRange(null)` called.
- [ ] **Slot Events**: Verify events object passed via `#default="{ events }"`.
