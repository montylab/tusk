# Test Scenarios: dateUtils

## Happy Path

1. [ ] **formatDate: formats correctly**
   - Inputs: new Date(2023, 0, 1)
   - Expected: '2023-01-01'

2. [ ] **isToday: checks against current date**
   - Inputs: '2023-01-01' (assuming today is same)
   - Expected: true/false based on system time

3. [ ] **getNextDay: increments day**
   - Inputs: '2023-01-31'
   - Expected: '2023-02-01'

4. [ ] **getMonday: returns previous Monday**
   - Inputs: Wednesday 2023-01-04
   - Expected: Monday 2023-01-02

5. [ ] **getWeekDays: returns 7 days**
   - Inputs: Monday 2023-01-02
   - Expected: Array of 7 strings starting 2023-01-02

6. [ ] **getMonthCalendarGrid: returns correct grid**
   - Inputs: 2023, 0 (January)
   - Expected: 6x7 grid, starting with correct padding days (Dec 2022)

7. [ ] **getTimeSnapped: snaps to interval**
   - Inputs: 10:07, interval 15
   - Expected: 10.25 (10:15) in decimal

8. [ ] **formatTime: decimal to HH:MM**
   - Inputs: 10.5
   - Expected: '10:30'

9. [ ] **formatDuration: minutes to string**
   - Inputs: 90
   - Expected: '1h 30m'

## Edge Cases

1. [ ] **formatDuration: handles < 60**
   - Inputs: 45
   - Expected: '45m'

2. [ ] **getMonthCalendarGrid: handles month change in week 5/6**
   - Inputs: Check logic for breaking loop
   - Expected: Returns valid grid
