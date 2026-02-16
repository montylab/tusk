# DragOperator Component Test Plan

## Description

`DragOperator.vue` is the visual ghost element that follows the cursor during drag operations. It renders a `TaskItem` inside a fixed-position container teleported to `<body>`.

## Unit Tests

### Visibility

- [ ] **Visible During Drag**: Verify shown when `isDragging || isDestroying`.
- [ ] **Hidden Otherwise**: Verify `v-if` hides ghost when not dragging.

### Ghost Styling (`ghostStyle`)

- [ ] **Default Position**: Verify `top/left` from `ghostPosition.x/y`, centered via `translate(-50%, -50%)`.
- [ ] **Default Size**: Verify `width = 220 * uiScale`, `height = hourHeight`.
- [ ] **Over Calendar (Snapped)**: Verify snapped rect from `dropData.snappedRect` overrides position/size.
- [ ] **Over Calendar (Fallback)**: Verify duration-based height when snap data is missing.
- [ ] **Destroying Animation**: Verify shrinks to 0px at 100%/100% with scale(0) + rotate(20deg).
- [ ] **No Transition**: Verify `transition: 'none'` during normal drag (no lag).

### Ghost Task (`ghostTask`)

- [ ] **Over Calendar Overrides**: Verify `startTime`, `duration`, `date` from `dropData`.
- [ ] **Status Computation**: Verify `getTaskStatus` is called on calendar overrides.
- [ ] **Off Calendar**: Verify `duration` forced to 60 (compact mode).

### Visual

- [ ] **Teleport**: Verify teleported to `<body>`.
- [ ] **Z-Index**: Verify `z-index: 9999`.
- [ ] **Shadow**: Verify elevated box-shadow.
- [ ] **Destroying**: Verify `.is-destroying` removes box-shadow.
