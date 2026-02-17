# Test Scenarios: ToDoPile

## Happy Path

1. [ ] **Renders title**
   - Inputs: Mount
   - Expected: h3 shows 'To Do 1'

2. [ ] **Renders tasks from store**
   - Inputs: tasksStore.todoTasks = [task1, task2]
   - Expected: Two .pile-task elements rendered

3. [ ] **Shows empty state**
   - Inputs: todoTasks = []
   - Expected: 'No tasks to do' message shown

4. [ ] **Emits drag-start on task mousedown**
   - Inputs: Mousedown on task
   - Expected: 'drag-start' emitted with event and task

5. [ ] **Highlights when isHighlighted=true**
   - Inputs: prop isHighlighted=true
   - Expected: .todo-pile has class 'is-highlighted'

6. [ ] **Updates insertion index on mousemove**
   - Inputs: Mousemove over pile top/bottom halves
   - Expected: 'update:insertion-index' emitted with correct index

## Edge Cases

1. [ ] **Insertion index null if not highlighted**
   - Inputs: Mousemove while isHighlighted=false
   - Expected: insertionIndex set to null

2. [ ] **Chaotic style applied to tasks**
   - Inputs: Render task
   - Expected: transform style present (rotate/translate)
