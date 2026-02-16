# ResizablePanel Component Test Plan

## Description

`ResizablePanel.vue` wraps any content and adds a draggable edge handle for resizing. Persists size to `localStorage` via `storageKey`.

## Props

| Prop          | Type                                     | Default |
| :------------ | :--------------------------------------- | :------ |
| `side`        | `'left' \| 'right' \| 'top' \| 'bottom'` | —       |
| `minSize`     | `number`                                 | `0`     |
| `maxSize`     | `number`                                 | `9999`  |
| `defaultSize` | `number`                                 | `300`   |
| `storageKey`  | `string?`                                | —       |

## Events: `resize(size: number)`

## Unit Tests

### Dimension

- [ ] **Width**: Verify `dimension === 'width'` for `side` left/right.
- [ ] **Height**: Verify `dimension === 'height'` for `side` top/bottom.
- [ ] **Panel Style**: Verify inline style `{ [dimension]: size + 'px' }`.

### Persistence

- [ ] **Load from Storage**: Verify on mount, `localStorage.getItem(storageKey)` parsed and clamped.
- [ ] **Save on End**: Verify `localStorage.setItem(storageKey, size)` after drag ends.
- [ ] **No Key**: Verify no localStorage operations when `storageKey` is absent.

### Resize Logic

- [ ] **Mouse Drag**: Verify `mousedown → mousemove → mouseup` cycle resizes panel.
- [ ] **Touch Drag**: Verify `touchstart → touchmove → touchend` cycle.
- [ ] **Delta Direction**: Verify `right`/`bottom` adds delta, `left`/`top` subtracts delta.
- [ ] **Clamp**: Verify `Math.max(minSize, Math.min(maxSize, newSize))`.
- [ ] **Emit**: Verify `resize` emitted on each move.

### Handle

- [ ] **Position**: Verify handle positioned at `{ [side]: '-4px' }`.
- [ ] **Cursor**: Verify `col-resize` for width, `row-resize` for height.
- [ ] **Dragging Class**: Verify `.dragging` class during drag.
- [ ] **Indicator**: Verify accent color on hover/drag.

### Cleanup

- [ ] **Listener Removal**: Verify all window listeners removed on `handleEnd`.
