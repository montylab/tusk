# AddDayZone Component Test Plan

## Description

`AddDayZone.vue` is a fixed-position edge zone that registers as `'add-day-zone'` drop target. When a task hovers over it, a 3-second countdown starts; reaching 0 emits `add-day`.

## Props: `label: string`

## Events: `add-day`

## Unit Tests

### Zone Registration

- [ ] **Register on Mount**: Verify `registerZone('add-day-zone', bounds)`.
- [ ] **Unregister on Unmount**: Verify zone cleanup + ResizeObserver disconnect + timer cleared.

### Countdown Logic

- [ ] **Start Condition**: Verify countdown starts only when `isHovered && isDragging`.
- [ ] **Tick Speed**: Verify interval at `1000 / speed` (speed = 1.2).
- [ ] **Emit on Zero**: Verify `add-day` emitted when countdown < 0.
- [ ] **Stop on Leave**: Verify countdown resets to `totalCountdownSeconds` when hover ends.
- [ ] **Stop on Drag End**: Verify countdown stops when `isDragging` becomes false.

### Rendering

- [ ] **Default State**: Verify plus icon "+" and "Add {label}" hover label.
- [ ] **Countdown State**: Verify countdown number + "Hold to add" label when dragging + hovering.
- [ ] **Progress Overlay**: Verify height grows proportionally to elapsed countdown.
- [ ] **Click**: Verify click directly emits `add-day`.

### Visual States

- [ ] **Hover Width**: Verify zone expands from 2rem to 10rem.
- [ ] **Counting Class**: Verify `.is-counting` class with accent background.
- [ ] **Pulse Animation**: Verify countdown number pulses.
