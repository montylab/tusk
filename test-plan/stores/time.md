# Time Store Test Plan

## Description

Pinia store managing real-time clock ticking (aligned to minute boundaries) and hovered time range state.

## Unit Tests

### Ticking

- [ ] **`startTicking`**: Verify `currentTime` updated immediately.
- [ ] **Kickstart Timer**: Verify setTimeout aligns to next minute boundary.
- [ ] **Minute Interval**: Verify 60s setInterval started after kickstart.
- [ ] **Nerve Emission**: Verify `MINUTE_TICK` event emitted on each tick.
- [ ] **Idempotent Start**: Verify second `startTicking` call is no-op.
- [ ] **`stopTicking`**: Verify both timer and kickstart cleared.

### Hover State

- [ ] **`setHoveredTimeRange`**: Verify sets `{ start, duration }`.
- [ ] **Clear Hover**: Verify `setHoveredTimeRange(null)` clears.

### Cleanup

- [ ] **`onUnmounted`**: Verify `stopTicking` called.
