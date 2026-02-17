# Test Scenarios: TaskDateTimePicker

## Happy Path

1. [ ] **Renders date picker when view is unset**
   - Inputs: No `view` prop
   - Expected: Both date and time pickers are visible

2. [ ] **Renders only date picker when view is 'date-only'**
   - Inputs: `view="date-only"`
   - Expected: Date picker visible, time picker hidden

3. [ ] **Renders only time picker when view is 'time-only'**
   - Inputs: `view="time-only"`
   - Expected: Time picker visible, date picker hidden

4. [ ] **Initializes internal date from string prop**
   - Inputs: `date="2026-03-15"`
   - Expected: `internalDate` is a `Date` for March 15, 2026

5. [ ] **Initializes internal time from numeric prop**
   - Inputs: `time=14.5`
   - Expected: `internalTime` is a `Date` with hours=14, minutes=30

6. [ ] **Emits `update:date` when internal date changes**
   - Action: `internalDate` is set to a new Date
   - Expected: `update:date` emitted with `"YYYY-MM-DD"` string

7. [ ] **Emits `update:time` when internal time changes**
   - Action: `internalTime` is set to a new Date (hours=10, minutes=45)
   - Expected: `update:time` emitted with `10.75`

8. [ ] **Syncs parent date prop changes to internal state**
   - Action: Parent changes `date` prop from `"2026-01-01"` to `"2026-06-15"`
   - Expected: `internalDate` updates to June 15, 2026

9. [ ] **Syncs parent time prop changes to internal state**
   - Action: Parent changes `time` prop from `9` to `13.25`
   - Expected: `internalTime` updates to 13:15

## Edge Cases

1. [ ] **Handles null date prop**
   - Inputs: `date=null`
   - Expected: `internalDate` is `null`, emits `null` for `update:date`

2. [ ] **Handles undefined date prop**
   - Inputs: No `date` prop provided
   - Expected: `internalDate` is `null`

3. [ ] **Handles null time prop**
   - Inputs: `time=null`
   - Expected: `internalTime` is `null`, emits `null` for `update:time`

4. [ ] **Handles undefined time prop**
   - Inputs: No `time` prop provided
   - Expected: `internalTime` is `null`

5. [ ] **Does not re-set internalDate when prop value is equivalent**
   - Action: Parent sets same date string that is already current
   - Expected: `internalDate` ref is not reassigned (avoids infinite loop)

6. [ ] **Does not re-set internalTime when prop value is equivalent**
   - Action: Parent sets same numeric time that is already current
   - Expected: `internalTime` ref is not reassigned (avoids infinite loop)

7. [ ] **stringToDate handles empty string**
   - Inputs: `date=""`
   - Expected: `internalDate` is `null`

8. [ ] **numberToTimeDate handles 0 (midnight)**
   - Inputs: `time=0`
   - Expected: `internalTime` is a Date with hours=0, minutes=0

9. [ ] **numberToTimeDate handles 23.75 (23:45)**
   - Inputs: `time=23.75`
   - Expected: `internalTime` is a Date with hours=23, minutes=45

10. [ ] **dateToString pads single-digit month and day** - Input: Date for January 5 (month=0, day=5) - Expected: Returns `"YYYY-01-05"`

## UI/Interaction

1. [ ] **Wheel scroll increases time by 15 min when Shift held and scrolling up**
   - Action: Shift+WheelUp on time picker group
   - Expected: `internalTime` increases by 15 minutes, `update:time` emitted

2. [ ] **Wheel scroll decreases time by 15 min when Shift held and scrolling down**
   - Action: Shift+WheelDown on time picker group
   - Expected: `internalTime` decreases by 15 minutes, `update:time` emitted

3. [ ] **Wheel scroll is ignored without Shift key**
   - Action: WheelUp/Down on time picker group (no Shift)
   - Expected: No change to `internalTime`

4. [ ] **Wheel scroll initializes time to 9:00 when internalTime is null**
   - Precondition: `internalTime` is `null`
   - Action: Shift+WheelUp on time picker group
   - Expected: Time starts at 9:00, then adjusts by 15 min in scroll direction

5. [ ] **Time picker uses AppIcon clock for input icon**
   - Expected: Custom clock icon rendered via `#inputicon` slot

6. [ ] **Time picker step is 15 minutes**
   - Expected: DatePicker rendered with `:stepMinute="15"`
