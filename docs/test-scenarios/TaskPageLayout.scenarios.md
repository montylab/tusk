# Test Scenarios: TaskPageLayout

## Happy Path

1. [ ] **Renders main content area with slots**
   - Inputs: Provide default, header, popups slots
   - Expected: All slot content rendered inside .main-content

2. [ ] **Renders sidebar with TaskPile for shortcuts**
   - Inputs: shortcutTasks in store
   - Expected: TaskPile with title="Shortcuts" receives shortcutTasks

3. [ ] **Renders sidebar with TaskPile for todos**
   - Inputs: todoTasks in store
   - Expected: TaskPile with title="To Do" receives todoTasks

4. [ ] **Emits 'edit' when TaskPile emits edit**
   - Inputs: TaskPile @edit fires with task
   - Expected: 'edit' event re-emitted with same task

## Edge Cases

1. [ ] **Empty tasks arrays render empty piles**
   - Inputs: todoTasks=[], shortcutTasks=[]
   - Expected: TaskPiles render without errors
