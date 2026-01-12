# Task Drag and Drop Logic

This document outlines the business rules and technical implementation details for the drag-and-drop interactions within the Tusk application. It covers interactions between the Calendar (Day View), Sidebar Piles (To-Do / Shortcuts), and the Trash Basket.

## Business Logic

### 1. Draggable Entities
*   **Scheduled Tasks:** Tasks that exist on the calendar grid (have a date, start time, and duration).
*   **To-Do Items:** Tasks in the "To Do" sidebar pile (have no fixed schedule, just order).
*   **Shortcuts:** Reusable task templates in the "Shortcuts" sidebar pile.

### 2. Interactions & Outcomes

The behavior depends on the **Source** of the drag and the **Target** drop zone.

#### Target: Calendar (Day View)
*   **Source: Scheduled Task (Internal Move)**
    *   **Action:** Move.
    *   **Result:** Updates the task's start time and/or date. Vertical dragging adjusts time; horizontal dragging can move between days (if enabled). Snap is 15 minutes.
*   **Source: To-Do Item**
    *   **Action:** Move (Schedule).
    *   **Result:** The item is **removed** from the To-Do list and **created** as a scheduled task on the calendar at the dropped time. Default duration is 60m (or preserved if set).
*   **Source: Shortcut**
    *   **Action:** Copy (Instantiate).
    *   **Result:** The Shortcut remains in the sidebar. A **new** scheduled task is created on the calendar at the dropped time, copying the shortcut's properties (title, color, emoji, default duration).

#### Target: Sidebar - To-Do Pile
*   **Source: Scheduled Task**
    *   **Action:** Move (Unschedule).
    *   **Result:** The task is **removed** from the calendar and **added** to the To-Do list.
*   **Source: To-Do Item**
    *   **Action:** Reorder.
    *   **Result:** Changes the item's position within the list.
*   **Source: Shortcut**
    *   **Action:** Copy.
    *   **Result:** The Shortcut remains. A **new** To-Do item is created based on the shortcut.

#### Target: Sidebar - Shortcuts Pile
*   **Source: Scheduled Task**
    *   **Action:** Move (Templatize).
    *   **Result:** The task is **removed** from the calendar and **added** to the Shortcuts list.
*   **Source: To-Do Item**
    *   **Action:** Move (Promote to Shortcut).
    *   **Result:** The item is **removed** from the To-Do list and **added** as a Shortcut.
*   **Source: Shortcut**
    *   **Action:** Reorder.
    *   **Result:** Changes the shortcut's position within the list.

#### Target: Trash Basket
*   **Source: Any (Scheduled, To-Do, Shortcut)**
    *   **Action:** Delete.
    *   **Result:** The item is permanently removed from the system. (Note: For Shortcuts, this deletes the template).

---

## Technical Implementation

### State Management
*   **`useDragState`**: Centralizes the state of drop zones (`isOverTrash`, `isOverCalendar`, etc.) and collision detection logic.
*   **`useTaskOperations`**: Handles the core drag arithmetic (snapping, delta calculation) for both internal and external drags.
*   **`useExternalDrag`**: Specific handler for initiating drags from the sidebar and handling their drop events (proxied through the page component).

### Coordinate System & Snapping
*   **Grid:** Tasks snap to a 15-minute grid (0.25 hours).
*   **Y-Axis:** Corresponds to Time. `1 hour = 80px` (Configurable `hourHeight`).
*   **Scroll Handling:** Calculations account for the scroll position of the `days-wrapper`. The formula `clientY - containerRect.top` inherently captures the scroll offset because the container moves with the scroll. Explicit addition of `scrollTop` is **not** performed to avoid double-counting.
*   **External Drag Start:** When dragging from sidebar to calendar, the specific start properties (`startY`, `startX`, `startScrollTop`) are reset upon entering the calendar logic to prevent "jumps" caused by the distance traveled from the sidebar.

### Collision Detection Priority
When dragging, multiple zones might overlap (e.g., dragging over a button that floats over the calendar). The priority order for detecting the active zone is:
1.  **Trash** (Highest)
2.  **Sidebar Piles** (To-Do / Shortcut)
3.  **Add/Create Button**
4.  **Calendar** (Lowest)

### Data Flow
All persistence operations are delegated to the `tasksStore` (Pinia), which communicates with the backend (Firebase). The components (DayView, TaskPile) emit events (`task-dropped`, `delete-task`) which are orchestrated by the parent view (`DayViewPage.vue`) or handled directly via store actions in composables.
