# Test Scenarios: TaskItem

## Happy Path

1. [ ] **Renders task title**
   - Inputs: task with text='My Task'
   - Expected: h4.title displays 'My Task'

2. [ ] **Renders time badge with start and end time**
   - Inputs: task with startTime=10, duration=90
   - Expected: time-badge shows "10:00 - 11:30"

3. [ ] **Renders duration badge**
   - Inputs: task with duration=90
   - Expected: duration-badge shows "1h 30m"

4. [ ] **Renders category badge**
   - Inputs: task with category='Work'
   - Expected: category-badge shows 'Work'

5. [ ] **Renders deep work badge when isDeepWork=true**
   - Inputs: task.isDeepWork=true
   - Expected: deep-work-badge visible with brain icon

6. [ ] **Emits 'edit' on dblclick**
   - Inputs: dblclick on .task-item
   - Expected: 'edit' emitted with task object

7. [ ] **Emits 'edit' on edit button click**
   - Inputs: click .edit-btn
   - Expected: 'edit' emitted with task object, event propagation stopped

8. [ ] **Shows ON AIR tag when status='on-air'**
   - Inputs: status='on-air'
   - Expected: .on-air-tag visible with text 'ON AIR'

9. [ ] **Applies category color via itemStyle**
   - Inputs: task with color='#ff0000'
   - Expected: --category-color CSS var set to '#ff0000'

10. [ ] **Shows description when not compact** - Inputs: task.description='Details', isCompact=false - Expected: .description-text rendered

## Edge Cases

1. [ ] **Hides time badge when startTime is null**
   - Inputs: task.startTime=null
   - Expected: .time-badge not rendered

2. [ ] **Shows 'Uncategorized' when category is empty**
   - Inputs: task.category=''
   - Expected: category-badge shows 'Uncategorized'

3. [ ] **Hides deep work badge when isDeepWork=false/undefined**
   - Inputs: task.isDeepWork=false
   - Expected: .deep-work-badge not rendered

4. [ ] **Falls back to category store color when task.color is null**
   - Inputs: task.color=null, category in store with color '#00ff00'
   - Expected: --category-color = '#00ff00'

5. [ ] **Falls back to default color when no task or category color**
   - Inputs: task.color=null, no matching category
   - Expected: --category-color = 'var(--color-default)'

6. [ ] **isAutoCompact is true when duration <= 30**
   - Inputs: task.duration=30
   - Expected: .is-auto-compact class applied

7. [ ] **Description hidden when isCompact=true**
   - Inputs: isCompact=true, task.description='text'
   - Expected: .description-text not rendered

8. [ ] **Description hidden when isAutoCompact (duration<=30)**
   - Inputs: task.duration=15, task.description='text'
   - Expected: .description-text not rendered

## UI/Interaction

1. [ ] **Applies 'dragging' class**
   - Inputs: isDragging=true
   - Expected: .task-item has class 'dragging'

2. [ ] **Applies 'shaking' class**
   - Inputs: isShaking=true
   - Expected: .task-item has class 'shaking'

3. [ ] **Applies status classes (on-air, in-past, in-future)**
   - Inputs: status='past'
   - Expected: .task-item has class 'in-past'

4. [ ] **Applies time-size class based on duration**
   - Inputs: task.duration=60
   - Expected: .task-item has class 'time-size-60'

5. [ ] **Renders shortcut badge when badgeText provided**
   - Inputs: badgeText='⌘1'
   - Expected: .shortcut-badge visible with '⌘1'

6. [ ] **Hides shortcut badge when badgeText not provided**
   - Inputs: no badgeText
   - Expected: .shortcut-badge not rendered
