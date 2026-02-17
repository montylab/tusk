# Test Scenarios: useTimeBoundaries

## Happy Path

1. [ ] **Initial State**
   - **Inputs**: Call `useTimeBoundaries()`.
   - **Expected Output**: `currentDate` reflects today's date (formatted).

2. [ ] **Day Change Detection**
   - **Inputs**:
     - Register `onDayChange` callback.
     - Mock system time to move from "Today 23:59" to "Tomorrow 00:01".
     - Advance timers (setTimeout/setInterval) or trigger `checkDateChange` manually.
   - **Expected Output**:
     - Callback is invoked with new date string.
     - `currentDate` updates.

3. [ ] **Week Change Detection**
   - **Inputs**:
     - Register `onWeekChange` callback.
     - Mock system time to cross a week boundary (e.g. Sunday to Monday).
     - Trigger detecting detection.
   - **Expected Output**:
     - `onWeekChange` callback is invoked.
     - `onDayChange` is also invoked.

4. [ ] **Month Change Detection**
   - **Inputs**:
     - Register `onMonthChange` callback.
     - Mock system time to cross a month boundary (e.g. Jan 31 to Feb 1).
   - **Expected Output**:
     - `onMonthChange` callback is invoked.

5. [ ] **Window Focus Trigger**
   - **Inputs**:
     - Mock system time change while window was "blurred" (simulated).
     - Trigger `window` 'focus' event.
   - **Expected Output**:
     - Date change is detected and callbacks fire immediately.

6. [ ] **Cleanup on Unmount**
   - **Inputs**:
     - Mount component using composable.
     - Unmount component.
   - **Expected Output**:
     - `setTimeout` and `setInterval` are cleared.
     - `window` 'focus' listener is removed.
     - Callbacks are cleared (implicitly, though sets are local to closure so they die with it).

## Edge Cases

1. [ ] **Mid-day Check**
   - **Inputs**:
     - Trigger `checkDateChange` when date hasn't changed.
   - **Expected Output**:
     - Callbacks are NOT fired.
     - `currentDate` remains same.

2. [ ] **System Sleep/Hibernation (Long Gap)**
   - **Inputs**:
     - Advance time by several days instantly (simulating sleep).
     - Trigger interval check.
   - **Expected Output**:
     - Date update is detected.
     - All relevant callbacks (day/week/month) fire if boundaries were crossed.
