# taskApi Service Test Plan

## Description

Legacy localStorage-based task API with simulated network delays. Used before Firebase migration; retained for offline/demo mode.

## Unit Tests

- [ ] **`initializeStorage`**: Verify `INITIAL_TASKS` seeded to localStorage when empty.
- [ ] **`getTasks`**: Verify returns parsed tasks from localStorage after 300ms delay.
- [ ] **`createTask`**: Verify task defaults merged, new task appended, saved to localStorage.
- [ ] **`updateTask`**: Verify task found by ID, updated in place, saved.
- [ ] **`updateTask` Not Found**: Verify throws `Error('Task with id X not found')`.
- [ ] **`deleteTask`**: Verify task removed by ID from localStorage.
- [ ] **Seed Data**: Verify `INITIAL_TASKS` includes scheduled, shortcut, and todo tasks.
