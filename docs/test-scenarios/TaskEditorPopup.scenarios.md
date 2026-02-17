# Test Scenarios: TaskEditorPopup

## Happy Path

1. [ ] **Renders in create mode when no task prop provided**
   - Inputs: `show=true`, no `task` prop
   - Expected: Header shows "Create New Task", submit button shows "Create Task"

2. [ ] **Renders in edit mode when task prop provided**
   - Inputs: `show=true`, `task={ id: '1', text: 'Test', category: 'Work', ... }`
   - Expected: Header shows "Edit Task", submit button shows "Save Changes"

3. [ ] **Form populates from task prop in edit mode**
   - Inputs: `task` with text, description, category, color, duration, startTime, date, isDeepWork
   - Expected: All form fields pre-filled with task values; duration converted from minutes to hours

4. [ ] **Form resets to defaults in create mode**
   - Inputs: `show=true`, no `task`
   - Expected: All fields empty/default; duration=1.0, isDeepWork=false

5. [ ] **Emits 'create' with correct payload on submit (create mode)**
   - Inputs: Fill taskText='New Task', category='Work', submit form
   - Expected: `create` emitted with `{ text, description, category, isDeepWork, startTime, duration, date }`; duration in minutes; category defaults to 'Default' if empty

6. [ ] **Emits 'update' with correct payload on submit (edit mode)**
   - Inputs: Task prop provided, modify text, submit
   - Expected: `update` emitted with `{ id, updates: { text, description, category, startTime, duration, date, isDeepWork } }`

7. [ ] **Emits 'close' when Cancel button clicked**
   - Inputs: Click cancel button
   - Expected: `close` event emitted

8. [ ] **Emits 'close' when overlay mousedown.self**
   - Inputs: Mousedown on `.popup-overlay` (not on container)
   - Expected: `close` event emitted

9. [ ] **Emits 'close' on Escape key**
   - Inputs: Press Escape while `show=true`
   - Expected: `close` event emitted

10. [ ] **Calls categoriesStore.ensureCategoryExists on submit** - Inputs: Submit form with category='Work', color='#ff0000', isDeepWork=true - Expected: `ensureCategoryExists('Work', '#ff0000', true)` called

11. [ ] **Closes popup after successful submit** - Inputs: Submit valid form - Expected: `close` event emitted after create/update

## Edge Cases

1. [ ] **Does not submit if taskText is empty/whitespace**
   - Inputs: taskText=' ', submit
   - Expected: No emit fired

2. [ ] **Defaults category to 'Default' when empty**
   - Inputs: taskText='Task', categoryInput='', submit
   - Expected: Payload category = 'Default'

3. [ ] **Defaults color to '#3b82f6' when empty**
   - Inputs: No color selected, submit
   - Expected: `ensureCategoryExists` called with '#3b82f6'

4. [ ] **Uses initialStartTime when provided in create mode**
   - Inputs: `initialStartTime=14`
   - Expected: `startTime` ref initialized to 14

5. [ ] **Defaults startTime to 9 for scheduled tasks without initialStartTime**
   - Inputs: `taskType='scheduled'`, no `initialStartTime`
   - Expected: `startTime` set to 9 in resetForm; payload startTime=9

6. [ ] **startTime is null for non-scheduled (todo) tasks**
   - Inputs: `taskType='todo'`, no initialStartTime
   - Expected: `startTime` null in create payload

7. [ ] **Duration converts between hours (internal) and minutes (payload)**
   - Inputs: duration ref = 1.5
   - Expected: Payload duration = 90

8. [ ] **Uses initialDate when provided**
   - Inputs: `initialDate='2026-03-15'`
   - Expected: taskDate = '2026-03-15'

9. [ ] **Defaults date to today string when no initialDate**
   - Inputs: No initialDate
   - Expected: taskDate = today formatted YYYY-MM-DD

10. [ ] **Escape key does nothing when show=false** - Inputs: `show=false`, press Escape - Expected: `close` not emitted

11. [ ] **Watcher resets form when show changes to true** - Inputs: show: false→true - Expected: resetForm called, focus set on input

## UI/Interaction

1. [ ] **Compact view shown when startCompact=true and not editing**
   - Inputs: `startCompact=true`, no `task`
   - Expected: `.compact` class on container; compact layout elements visible

2. [ ] **Compact view hidden in edit mode even if startCompact=true**
   - Inputs: `startCompact=true`, `task` provided
   - Expected: isCompactView=false, full form shown

3. [ ] **"Show more options" button expands compact view**
   - Inputs: Compact view active, click expand button
   - Expected: isExpanded=true, full form shown (description, deep work, etc.)

4. [ ] **projectedEndTime computed correctly**
   - Inputs: startTime=10, duration=1.5
   - Expected: projectedEndTime = 11.5

5. [ ] **projectedEndTime is null when startTime is null**
   - Inputs: startTime=null
   - Expected: projectedEndTime = null

6. [ ] **formatTime formats decimal hours correctly**
   - Inputs: time=14.5
   - Expected: "14:30"

7. [ ] **displayDate formats date for display**
   - Inputs: taskDate='2026-03-15'
   - Expected: Formatted string like "Mar 15"

8. [ ] **Duration field hidden for todo taskType in create mode**
   - Inputs: `taskType='todo'`, not editing
   - Expected: Duration form-group not rendered

9. [ ] **Date & Time section shown only for scheduled tasks or editMode with startTime**
   - Inputs: `taskType='scheduled'`
   - Expected: Date/Time picker visible

10. [ ] **Focus set to taskText input when popup opens** - Inputs: show: false→true - Expected: taskTextInput receives focus (via setTimeout)
