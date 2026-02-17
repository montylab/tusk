# Test Scenarios: getTaskStatus

## Happy Path

1. [ ] **Missing Data**
   - **Inputs**: Task with no `startTime` or no `date`.
   - **Expected Output**: `null`.

2. [ ] **Past Task (Previous Day)**
   - **Inputs**:
     - Task Date: "2024-01-01"
     - Now: "2024-01-02 10:00"
   - **Expected Output**: `'past'`.

3. [ ] **Past Task (Same Day)**
   - **Inputs**:
     - Task Date: "2024-01-02"
     - Task Time: 09:00 - 10:00 (Duration 60)
     - Now: "2024-01-02 10:01"
   - **Expected Output**: `'past'`.

4. [ ] **On-Air Task**
   - **Inputs**:
     - Task Date: "2024-01-02"
     - Task Time: 10:00 - 11:00
     - Now: "2024-01-02 10:30"
   - **Expected Output**: `'on-air'`.

5. [ ] **On-Air Task (Just Started)**
   - **Inputs**:
     - Task Date: "2024-01-02"
     - Task Time: 10:00 - 11:00
     - Now: "2024-01-02 10:00"
   - **Expected Output**: `'on-air'`.

6. [ ] **Future Task (Same Day)**
   - **Inputs**:
     - Task Date: "2024-01-02"
     - Task Time: 12:00 - 13:00
     - Now: "2024-01-02 10:00"
   - **Expected Output**: `'future'`.

7. [ ] **Future Task (Next Day)**
   - **Inputs**:
     - Task Date: "2024-01-03"
     - Now: "2024-01-02 10:00"
   - **Expected Output**: `'future'`.

## Edge Cases

1. [ ] **Zero Duration**
   - **Inputs**:
     - Task Time: 10:00, Duration 0
     - Now: 10:01
   - **Expected Output**: `'past'` (EndTime = StartTime).
