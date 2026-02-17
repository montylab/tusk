# Test Scenarios: TimeHoverTracker

## Happy Path

1. [ ] **Slot Interaction (Mouse Enter)**
   - **Inputs**:
     - Props: `start=540` (9:00), `duration=60`.
     - User Action: Trigger `events.mouseenter` from slot.
   - **Expected Output**:
     - `timeStore.setHoveredTimeRange` called with `{ start: 540, duration: 60 }`.

2. [ ] **Slot Interaction (Mouse Leave)**
   - **Inputs**:
     - User Action: Trigger `events.mouseleave` from slot.
   - **Expected Output**:
     - `timeStore.setHoveredTimeRange` called with `null`.

## UI/Interaction

1. [ ] **Renderless Behavior**
   - **Inputs**: Component rendered.
   - **Expected Output**: Renders slot content without extra DOM wrapper (unless slot content adds one).
