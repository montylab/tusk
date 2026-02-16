# useDragOperator Composable Test Plan

## Description

Core drag-and-drop controller managing global drag state, zone registration, priority-based collision detection, and task relocation.

## Unit Tests

### Zone Management

- [ ] **Register Zone**: Verify `registerZone(name, bounds, config)` adds to internal map.
- [ ] **Unregister Zone**: Verify zone removed from map.
- [ ] **Update Bounds**: Verify `updateZoneBounds` modifies bounds and scroll offset.

### Zone Priority

- [ ] **Trash Priority (100)**: Verify trash has highest priority.
- [ ] **Todo/Shortcut Priority (80)**: Verify sidebar piles.
- [ ] **Add Day Zone Priority (60)**: Verify edge zone.
- [ ] **Calendar Default (40)**: Verify `calendar-day-*` zones default to 40.

### Collision Detection (`getZoneAtPoint`)

- [ ] **Point In Bounds**: Verify `isPointInBounds` rectangle check.
- [ ] **Highest Priority Wins**: Verify zone with highest priority is selected when overlapping.
- [ ] **No Zone**: Verify null returned when no zone contains cursor.

### Drag Lifecycle (`startDrag`)

- [ ] **Delay Timer**: Verify drag doesn't start until small delay (prevents accidental drags).
- [ ] **Cancel Before Start**: Verify mouseup before delay cancels pending drag.
- [ ] **Ghost Position**: Verify `ghostPosition` tracks mouse/touch coordinates.
- [ ] **Current Zone Updates**: Verify `currentZone` reactive ref updates on move.
- [ ] **Drop Data**: Verify `dropData` populated from zone's `calculateDropData`.

### Event Handling

- [ ] **Mouse Events**: Verify `mousemove`, `mouseup` listeners.
- [ ] **Touch Events**: Verify `touchmove`, `touchend` listeners.
- [ ] **Escape Key**: Verify `handleKeyDown` cancels drag.
- [ ] **Ctrl+Click Duplication**: Verify `ctrlKey` triggers task copy.

### Drop (`handleEnd`)

- [ ] **Relocation**: Verify `manageTaskRelocation` called with source, target zone, task, and data.
- [ ] **Destroy Animation**: Verify `isDestroying` set during trash drop.
- [ ] **Cleanup**: Verify all listeners removed and state reset.

### Cancel (`cancelDrag`)

- [ ] **State Reset**: Verify all reactive state cleared.
