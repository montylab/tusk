# useTaskLayout Composable Test Plan

## Description

Computes CSS layout positions for overlapping tasks using a greedy column-packing algorithm. Handles active task overrides for live drag/resize preview.

## Unit Tests

### Display Tasks

- [ ] **Sort Order**: Verify tasks sorted by `layoutStart` ascending.
- [ ] **Active Task Override**: Verify `displayStart`/`displayDuration` use `currentSnapTime`/`currentDuration` for active task.
- [ ] **Other Tasks**: Verify non-active tasks use original `startTime`/`duration`.

### Cluster Detection

- [ ] **No Overlap**: Verify each task gets its own cluster (width 100%).
- [ ] **Two Overlapping**: Verify both tasks in same cluster, each gets 50% width.
- [ ] **Three Tasks (2 overlap)**: Verify correct cluster boundary.
- [ ] **Chain Overlap**: Verify A overlaps B, B overlaps C → all in one cluster.

### Column Packing

- [ ] **Sequential**: Verify sequential tasks reuse column 0.
- [ ] **Parallel**: Verify parallel tasks get different columns.
- [ ] **Left/Width**: Verify `left = colIndex * (100/numCols)%`, `width = 100/numCols%`.

### Position Calculation

- [ ] **Top**: Verify `(displayStart - startHour) * hourHeight`.
- [ ] **Height**: Verify `(displayDuration / 60) * hourHeight - 1` (1px gap).

### Z-Index

- [ ] **Active Task**: Verify `zIndex: 100` for dragged task.
- [ ] **Other Tasks**: Verify `zIndex: 10`.

### Overlap Flag

- [ ] **Is Overlapping**: Verify true for non-dragged tasks in multi-task clusters.
- [ ] **Self Not Overlapping**: Verify false for the actively dragged task.
