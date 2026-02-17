# Test Scenarios: TaskPile

## Happy Path

1. [ ] **Renders pile title**
   - Inputs: title='Shortcuts'
   - Expected: h3.pile-title shows 'Shortcuts'

2. [ ] **Renders TaskItem for each task**
   - Inputs: tasks=[task1, task2]
   - Expected: Two TaskItem components rendered

3. [ ] **Shows badge text for first 9 shortcuts**
   - Inputs: listType='shortcut', tasks with 10 items
   - Expected: First 9 have badgeText 'Ctrl + N', 10th has none

4. [ ] **Emits edit when TaskItem edits**
   - Inputs: TaskItem emits 'edit'
   - Expected: 'edit' re-emitted with task

5. [ ] **Applies is-shortcuts class for shortcut type**
   - Inputs: listType='shortcut'
   - Expected: .task-pile has class 'is-shortcuts'

6. [ ] **Applies shortcut-pile / todo-pile class**
   - Inputs: listType='todo' / 'shortcut'
   - Expected: Corresponding class applied

## Edge Cases

1. [ ] **Shows empty state for todo when tasks empty**
   - Inputs: listType='todo', tasks=[]
   - Expected: 'No tasks to do' shown

2. [ ] **Shows empty state for shortcuts when tasks empty**
   - Inputs: listType='shortcut', tasks=[]
   - Expected: 'No shortcuts yet' shown

3. [ ] **Passes isCompact to all TaskItems**
   - Inputs: tasks with items
   - Expected: Each TaskItem receives isCompact=true
