# useTimeBoundaries Composable Test Plan

## Description

Watches for day/week/month boundary crossings and fires registered callbacks. Handles system sleep/hibernation via watchdog interval.

## Unit Tests

### Date Detection

- [ ] **Day Change**: Verify `currentDate` ref updates and `dayChangeCallbacks` fired.
- [ ] **Week Change**: Verify `weekChangeCallbacks` fired when week number differs.
- [ ] **Month Change**: Verify `monthChangeCallbacks` fired when month or year differs.
- [ ] **No Change**: Verify no callbacks when date hasn't changed.

### Week Number

- [ ] **`getWeekNumber`**: Verify ISO-like week calculation based on day-of-year.

### Scheduling

- [ ] **Midnight Timeout**: Verify `scheduleNextCheck` sets timeout for ms until next midnight + 1s buffer.
- [ ] **Watchdog Interval**: Verify 60s interval checks for missed date changes (sleep recovery).
- [ ] **Window Focus**: Verify `checkDateChange` on window focus event.

### Callbacks

- [ ] **Register Day/Week/Month**: Verify callbacks added to respective Sets.
- [ ] **Unregister**: Verify returned function removes callback from Set.

### Cleanup

- [ ] **On Unmount**: Verify timeout, interval, and focus listener cleared. Callback Sets emptied.
