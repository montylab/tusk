# TaskDateTimePicker Component Test Plan

## Description

Dual date+time picker using PrimeVue `DatePicker`, converting between string dates / decimal hours and internal Date objects. Supports mouse wheel time adjustment.

## Props: `date?: string | null`, `time?: number | null`, `view?: 'date-only' | 'time-only'`

## Events: `update:date`, `update:time`

## Unit Tests

### Date Conversion

- [ ] **`stringToDate`**: Verify `"2024-01-15"` → `Date(2024, 0, 15)`.
- [ ] **`stringToDate` null**: Verify null input → null output.
- [ ] **`dateToString`**: Verify Date → `"YYYY-MM-DD"` with zero-padding.

### Time Conversion

- [ ] **`numberToTimeDate`**: Verify `9.5` → Date with hours=9, minutes=30.
- [ ] **`timeDateToNumber`**: Verify Date(10:45) → `10.75`.
- [ ] **Null handling**: Verify null → null for both directions.

### Two-Way Sync

- [ ] **Internal → Parent**: Verify `internalDate` change emits `update:date` as string.
- [ ] **Parent → Internal**: Verify `props.date` change syncs to `internalDate`.
- [ ] **Time Sync**: Verify same bidirectional sync for time.

### View Modes

- [ ] **Default**: Verify both date and time pickers shown.
- [ ] **Date Only**: Verify only date picker shown.
- [ ] **Time Only**: Verify only time picker shown.

### Mouse Wheel

- [ ] **Shift+Wheel Up**: Verify time increases by 15 minutes.
- [ ] **Shift+Wheel Down**: Verify time decreases by 15 minutes.
- [ ] **No Shift**: Verify no-op without Shift key.
- [ ] **Default Time**: Verify unset time defaults to 9:00 on first wheel.
