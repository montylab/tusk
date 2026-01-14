# Drag and Drop Refactoring Plan

This document outlines the strategy to refactor the current drag-and-drop implementation to improve maintainability, extendability, and readability.

## 1. Problem Statement

- **Scattered Logic:** Drag logic is split across `DayView.vue`, `DayViewPage.vue`, `useTaskOperations.ts`, `useExternalDrag.ts`, and `TaskPile.vue`.
- **High Coupling:** Components like `DayView` act as mediators for external drags, knowing too much about their implementation details.
- **Complex State:** Drag state (`isOverX`, bounds, ghost styling) is managed locally in multiple places or implicitly passed via refs.
- **Visual Logic:** Ghost element positioning and styling are tightly coupled to the `DayView` template.

## 2. Goals

- **Centralize Control:** A single source of truth (`useDragAndDrop`) for all drag operations.
- **Decouple Visuals:** A global `<DragOverlay>` component to handle ghost rendering, removing `Teleport` logic from specific views.
- **Strategy Pattern:** Encapsulate behavior for different drag types (Calendar Move, Sidebar Creation, Reordering) into distinct strategy classes or composables.
- **Simplify Components:** UI components (`DayView`, `TaskPile`) should only emit events or register valid drop zones, without handling the mechanics of the drag.

## 3. High-Level Architecture

### A. The "Drag Context" (Global State)

A lightweight Pinia store or global composable to track:

- `isDragging`: Boolean.
- `dragPayload`: `{ type: 'task' | 'list-item', data: any, source: string }`.
- `dragPosition`: `{ x, y }` (Screen coordinates).
- `dropTarget`: `{ zone: 'calendar' | 'todo' | 'trash', data?: any }` (Detected via collision).

### B. Drag Strategies

Strategy objects that define the behavior for a lifecycle: `onStart`, `onMove`, `onEnd`.

- **`InternalMoveStrategy`**: Handles moving/resizing tasks within the Calendar. Calculates snapping and delta.
- **`ExternalCreateStrategy`**: Handles dragging from Sidebar to Calendar. Calculates ghost position relative to mouse and final drop time.
- **`ListReorderStrategy`**: Handles reordering within Sidebar piles.

### C. Visual Layer (`DragOverlay`)

A single component at the App root (or Page root) that:

- Listens to `dragPayload`.
- Renders the appropriate ghost element (e.g., `<TaskGhost>` or `<ListGhost>`) following the mouse.
- Handles "Snap" visuals (teleporting the ghost to the grid slot).

### D. Input Layer

- **`useDraggable`**: A helper to attach to elements (like Helper/Directive) to initiate drags.

## 4. Refactoring Steps

### Phase 1: Foundation

1.  **Extract `useDragContext`**: Create the global state manager.
2.  **Create `<DragOverlay>`**: Implement the global ghost renderer.
3.  **Refactor `useDragState`**: Ensure it strictly handles "Zone Detection" and feeds into `DragContext`.

### Phase 2: Strategies

4.  **Extract `InternalMoveStrategy`**: Move logic from `useTaskOperations.ts` (keeping the math, but decoupling the loop).
5.  **Extract `ExternalCreateStrategy`**: Merge logic from `useExternalDrag.ts` and `DayView.vue` (external handler) into one cohesive unit.

### Phase 3: Integration

6.  **Update `DayView.vue`**: Remove local listeners (`onMouseMove`, `handleExternalDrag`). Replace with `useDraggable` or `DragContext` updates.
7.  **Update `TaskPile.vue`**: Use the new draggable system.
8.  **Clean up `DayViewPage.vue`**: Remove the manual event wiring. The Strategies should perform the Store actions directly (or emit simple "Commit" events).

## 5. Directory Structure Propsal

```
src/
  composables/
    dnd/
      useDragAndDrop.ts    (Main Entry)
      useDragContext.ts    (State)
      useZoneDetection.ts  (Collision)
      strategies/
        index.ts
        calendarStrategy.ts
        sidebarStrategy.ts
```
