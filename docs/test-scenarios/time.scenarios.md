# Test Scenarios: time (Store)

## Happy Path

1. [ ] **Initializes with current time**
   - Inputs: useTimeStore()
   - Expected: currentTime is close to Date.now(), hoveredTimeRange is null

2. [ ] **Sets hovered time range**
   - Inputs: setHoveredTimeRange({ start: 100, duration: 60 })
   - Expected: hoveredTimeRange updates to match input

3. [ ] **Starts ticking (immediate update)**
   - Inputs: startTicking()
   - Expected: currentTime updates, nerve emits MINUTE_TICK

4. [ ] **Schedules next tick at start of next minute**
   - Inputs: Current time 10:00:30, startTicking(), advance time by 30s
   - Expected: nerve emits MINUTE_TICK at 10:01:00

5. [ ] **Continues ticking every minute**
   - Inputs: advance time by 60s after kickstart
   - Expected: nerve emits MINUTE_TICK at 10:02:00

6. [ ] **Stops ticking**
   - Inputs: stopTicking(), advance time
   - Expected: No further nerve emissions

## Edge Cases

1. [ ] **Ignores startTicking if already ticking**
   - Inputs: call startTicking() twice
   - Expected: Timers only set once (verify call counts if possible)

2. [ ] **Auto-stops on unmount**
   - Inputs: Unmount store (dispose)
   - Expected: timers cleared
