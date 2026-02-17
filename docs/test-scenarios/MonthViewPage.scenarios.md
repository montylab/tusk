# Test Scenarios: MonthViewPage

## Happy Path

1. [ ] **Renders MonthCalendar**
   - Inputs: Mount
   - Expected: MonthCalendar rendered

2. [ ] **Parses year/month from route**
   - Inputs: route params { year: '2023', month: '01' }
   - Expected: viewYear=2023, viewMonth=0 (Jan)

3. [ ] **Updates store currentDates with grid**
   - Inputs: viewYear=2023, viewMonth=0
   - Expected: tasksStore.currentDates contains all days in the month grid

4. [ ] **Navigates to previous month**
   - Inputs: MonthCalendar emits 'prev-month'
   - Expected: router replaces with previous month params

5. [ ] **Navigates to next month**
   - Inputs: MonthCalendar emits 'next-month'
   - Expected: router replaces with next month params

6. [ ] **Opens create popup on create-task**
   - Inputs: MonthCalendar emits 'create-task'
   - Expected: TaskEditorPopup shown

## Edge Cases

1. [ ] **Defaults to current month if no params**
   - Inputs: route params {}
   - Expected: viewYear/viewMonth match current date

2. [ ] **Handles year rollover (Dec -> Jan)**
   - Inputs: Next month from Dec
   - Expected: Year increments, month becomes 0
