# Test Scenarios: AddDayZone

## Happy Path

1. [ ] **Render & Click**
   - **Inputs**: Props: `label="Day"`.
   - **User Action**: Click the zone.
   - **Expected Output**: Emits `add-day`.

2. [ ] **Drag & Drop (Countdown Trigger)**
   - **Inputs**:
     - `useDragOperator` returns `isDragging=true`, `currentZone='add-day-zone'`.
   - **Expected Output**:
     - Countdown starts (3s).
     - After 3s, emits `add-day`.

3. [ ] **Cancel Drag/Leave**
   - **Inputs**:
     - `useDragOperator` returns `isDragging=true`, `currentZone='add-day-zone'`.
     - Wait 1s.
     - `currentZone` changes to `null` (leave).
   - **Expected Output**:
     - Countdown stops/resets.
     - `add-day` is NOT emitted.

4. [ ] **Drag End without Drop**
   - **Inputs**:
     - `useDragOperator` returns `isDragging=true`, `currentZone='add-day-zone'`.
     - `isDragging` becomes `false` (drop elsewhere or cancel).
   - **Expected Output**:
     - Countdown stops.

## Lifecycle & Integrations

1. [ ] **Registration**
   - **Inputs**: Component mounts.
   - **Expected Output**: Calls `registerZone('add-day-zone', ...)` with bounds.

2. [ ] **Cleanup**
   - **Inputs**: Component unmounts.
   - **Expected Output**:
     - Calls `unregisterZone('add-day-zone')`.
     - Clears any active countdown timer.
     - Disconnects ResizeObserver.

## UI/Interaction

1. [ ] **Visual States**
   - **Inputs**: `isDragging=true`, `isHovered=true`.
   - **Expected Output**: Shows countdown number and progress bar.
