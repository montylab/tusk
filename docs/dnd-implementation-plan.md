# Implementation Plan: New Drag & Drop System

## Overview

Complete rewrite of the drag-and-drop system with a clean, singleton-based architecture. The system separates concerns between rendering (DragOperator), state management (useDragOperator), and zone-specific logic.

## Architecture

### Core Components

1. **DragOperator.vue** - Singleton component that renders the ghost task
2. **useDragOperator.ts** - Composable that manages drag state and communication
3. **Zone Components** - Self-registering drop targets with their own logic

### Data Flow

```
Zone Component → startDrag() → useDragOperator → DragOperator (renders ghost)
                                       ↓
                              Mouse/Touch Events
                                       ↓
                              Zone Detection (priority-based)
                                       ↓
                              dragEnded() → Store.manageTaskRelocation()
```

---

## Proposed Changes

### Core Composable

#### [NEW] [src/composables/useDragOperator.ts](file:///d:/projects/TaskTracker/src/composables/useDragOperator.ts)

**Purpose**: Central state management for drag operations

**Exports**:

- **State** (reactive):
  - `isDragging: Ref<boolean>` - Whether a drag is in progress
  - `draggedTask: Ref<Task | null>` - The task being dragged
  - `activeDraggedTaskId: Ref<string | number | null>` - ID for styling original task
  - `ghostPosition: Ref<{ x: number, y: number }>` - Ghost task screen position
  - `currentZone: Ref<string | null>` - Current zone under cursor
  - `dropData: Ref<any>` - Zone-specific drop data (e.g., snapped time for calendar)
- **Methods**:
  - `registerZone(name: string, bounds: DOMRect, config?: ZoneConfig)` - Zone auto-registration
  - `unregisterZone(name: string)` - Cleanup on unmount
  - `updateZoneBounds(name: string, bounds: DOMRect, scrollOffset?: { x: number, y: number })` - Handle resize/scroll
  - `startDrag(task: Task, sourceZone: string, event: MouseEvent | TouchEvent)` - Initiate drag
  - `cancelDrag()` - ESC or invalid drop

**Internal Logic**:

- Maintains a `Map<string, ZoneInfo>` of registered zones with bounds and metadata
- On mouse/touch move:
  - Calculate cursor position
  - Check collision with zones (priority order: trash → todo → shortcut → add-day → calendar-day-\*)
  - Update `currentZone` and call zone-specific `calculateDropData()` if provided
- On mouse/touch up:
  - Call `dragEnded(draggedTask, sourceZone, currentZone, dropData)`
  - Call `tasksStore.manageTaskRelocation(sourceZone, currentZone, draggedTask, dropData)`
  - Reset state
- Global event listeners (attached during drag, removed after):
  - `mousemove` / `touchmove`
  - `mouseup` / `touchend`
  - `keydown` (ESC to cancel)

**Types**:

```typescript
interface ZoneConfig {
  priority?: number // For collision detection
  gridConfig?: { snapWidth: number; snapHeight: number; startHour: number }
  calculateDropData?: (cursorX: number, cursorY: number, task: Task) => any
  scrollOffset?: { x: number; y: number }
}

interface ZoneInfo {
  bounds: DOMRect
  config: ZoneConfig
}
```

---

### Singleton Renderer

#### [NEW] [src/components/DragOperator.vue](file:///d:/projects/TaskTracker/src/components/DragOperator.vue)

**Purpose**: Renders the ghost task during drag

**Template**:

- Teleport to `body` for z-index control
- Conditionally render based on `isDragging`
- Position: fixed at `ghostPosition`
- Render different styles based on `currentZone`:
  - **Calendar zones**: Full task card (with computed height from duration, category badge, text)
  - **Other zones**: Compact pile-style task card

**Script**:

- Uses `useDragOperator()` to access state
- Computes ghost style based on:
  - `currentZone` (determines if full or compact)
  - `draggedTask` (color, text, category, duration)
  - `dropData` (for calendar: snapped time determines height/position)

**Styling**:

- Semi-opaque but visible (`opacity: 0.85`)
- Pointer events: none
- Drop shadow for depth
- Smooth transitions (if any)

---

### Store Updates

#### [MODIFY] [src/stores/tasks.ts](file:///d:/projects/TaskTracker/src/stores/tasks.ts)

**New Method**: `manageTaskRelocation(source: string, dest: string, task: Task, dropData: any): Promise<void>`

**Logic** (based on [tasks-dnd.md](file:///d:/projects/TaskTracker/docs/tasks-dnd.md)):

```typescript
// Destination: Calendar
if (dest.startsWith('calendar-day-')) {
  const date = dest.replace('calendar-day-', '')
  const { time, duration } = dropData

  if (source.startsWith('calendar-day-')) {
    // Scheduled → Calendar: Move/Update
    if (task.id.toString().startsWith('temp-')) {
      // Ctrl+Click duplicate: Create new
      await createScheduledTask({ ...task, date, startTime: time, duration })
    } else {
      const oldDate = source.replace('calendar-day-', '')
      if (oldDate === date) {
        await updateScheduledTask(task.id, date, { startTime: time, duration })
      } else {
        await moveScheduledTask(task.id, oldDate, date, { startTime: time, duration })
      }
    }
  } else if (source === 'todo') {
    // Todo → Calendar: Move (schedule)
    await moveTodoToCalendar(task.id, date, time, duration)
  } else if (source === 'shortcut') {
    // Shortcut → Calendar: Copy (instantiate)
    await copyShortcutToCalendar(task.id, date, time, duration)
  }
}

// Destination: Todo
else if (dest === 'todo') {
  if (source.startsWith('calendar-day-')) {
    // Calendar → Todo: Move (unschedule)
    const date = source.replace('calendar-day-', '')
    await moveCalendarToTodo(task.id, date, dropData.order)
  } else if (source === 'todo') {
    // Todo → Todo: Reorder
    await reorderTodo(task.id, dropData.index)
  } else if (source === 'shortcut') {
    // Shortcut → Todo: Copy
    await copyShortcutToTodo(task.id, dropData.order)
  }
}

// Destination: Shortcut (similar logic)
// Destination: Trash (delete from source)
// Destination: null (cancel)
```

**Helper**: Generate temp IDs for Ctrl+Click duplicates

```typescript
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

---

### Zone Components Updates

#### [MODIFY] [src/components/TrashBasket.vue](file:///d:/projects/TaskTracker/src/components/TrashBasket.vue)

**Changes**:

- Import `useDragOperator()` in setup
- Call `registerZone('trash', bounds)` on mount
- Call `updateZoneBounds('trash', bounds)` on resize/scroll
- Call `unregisterZone('trash')` on unmount
- Use `currentZone === 'trash'` for highlighting (replace old prop)
- Remove old DND event handlers

---

#### [MODIFY] [src/components/TaskPile.vue](file:///d:/projects/TaskTracker/src/components/TaskPile.vue)

**Changes**:

- Register zone with name `'todo'` or `'shortcut'` (based on prop)
- Update bounds on resize/scroll/item reorder
- On task mousedown/touchstart: call `startDrag(task, zoneName, event)`
- Provide `calculateDropData()` in config to determine insertion index from cursor Y
- Use `activeDraggedTaskId` to apply `.dragging` class (opacity: 0.25)
- Remove old DND handlers

**calculateDropData Example**:

```typescript
calculateDropData: (x, y, task) => {
  // Calculate which index in the pile based on Y position
  const items = pileRef.value.querySelectorAll('.task-item')
  let index = 0
  for (const item of items) {
    const rect = item.getBoundingClientRect()
    if (y > rect.bottom) index++
  }
  return { index, order: calculateNewOrder(list, index) }
}
```

---

#### [MODIFY] [src/components/DayColumn.vue](file:///d:/projects/TaskTracker/src/components/DayColumn.vue)

**Props**:

- Add `date: string` prop (to construct zone name)

**Changes**:

- Register zone with name `calendar-day-${date}`
- Provide `gridConfig` with snap segments (15min / 0.25 hours)
- Provide `calculateDropData()` to snap cursor to grid and calculate time
- On task mousedown (normal): call `startDrag(task, zoneName, event)`
- On task mousedown (Ctrl+Click):
  - Create duplicate task with temp ID
  - Call `startDrag(duplicateTask, zoneName, event)`
- Update bounds on scroll/resize of parent container
- Use `activeDraggedTaskId` to hide/dim original task

**calculateDropData Example**:

```typescript
calculateDropData: (x, y, task) => {
  const rect = columnRef.value.getBoundingClientRect()
  const relativeY = y - rect.top + scrollOffset.y
  const hourHeight = 80 // from config
  const hours = relativeY / hourHeight
  const snappedHours = Math.round(hours / 0.25) * 0.25 // 15min snap
  const time = config.startHour + snappedHours

  return {
    time: Math.max(config.startHour, Math.min(time, config.endHour)),
    duration: task.duration || 60,
    date: props.date
  }
}
```

---

#### [MODIFY] [src/components/AddDayZone.vue](file:///d:/projects/TaskTracker/src/components/AddDayZone.vue)

**Changes**:

- Register zone with name `'add-day-zone'`
- On `currentZone === 'add-day-zone'` && `isDragging`: trigger add day (mouseover behavior)
- Dropping on this zone cancels the drag (returns null from `calculateDropData`)
- Update bounds on resize

---

### Layout Integration

#### [MODIFY] [src/views/DayViewPage.vue](file:///d:/projects/TaskTracker/src/views/DayViewPage.vue) or [src/App.vue](file:///d:/projects/TaskTracker/src/App.vue)

**Changes**:

- Add `<DragOperator />` component (singleton, rendered once)
- Remove old drag state management code
- Zones handle their own registration

---

## Touch Event Handling

> [!NOTE]
> **Touch vs Mouse Inconsistencies**
>
> - **No hover state**: Touch events lack `mouseover`/`mouseout`, so add-day-zone trigger needs adjustment (trigger on touchmove proximity instead)
> - **No Ctrl key**: Touch devices don't support Ctrl+Click. Consider long-press for duplicate on touch devices
> - **Coordinate access**: TouchEvent uses `event.touches[0].clientX/Y` instead of `event.clientX/Y`

**Unified Handler** in `useDragOperator.ts`:

```typescript
function getEventCoordinates(event: MouseEvent | TouchEvent) {
  if ('touches' in event) {
    return {
      x: event.touches[0]?.clientX || 0,
      y: event.touches[0]?.clientY || 0
    }
  }
  return { x: event.clientX, y: event.clientY }
}
```

---

## Verification Plan

### Manual Testing

1. Drag scheduled task within same day → verify time updates
2. Drag scheduled task to different day → verify date + time update
3. Drag todo to calendar → verify task moves and schedules
4. Drag shortcut to calendar → verify task copies (shortcut remains)
5. Drag calendar task to todo → verify unschedule
6. Drag calendar task to trash → verify deletion
7. Ctrl+Click drag in calendar → verify duplication
8. ESC during drag → verify cancellation
9. Drop outside zones → verify cancellation
10. Resize window during drag → verify zones re-register correctly

### Automated Tests (Future)

- Update existing DND tests to use new system
- Test zone registration/unregistration
- Test collision detection priority

---

## Migration Notes

> [!WARNING]
> **Breaking Changes**
>
> This implementation completely replaces the existing DND system. Old files to remove:
>
> - `src/composables/dnd/useDragAndDrop.ts`
> - `src/composables/dnd/useDragContext.ts`
> - `src/composables/dnd/useZoneDetection.ts`
> - `src/composables/dnd/strategies/useCalendarDrag.ts`
> - `src/composables/dnd/strategies/useSidebarDrag.ts`
> - `src/components/DragOverlay.vue` (replaced by DragOperator)

---

## File Summary

| Action     | File                                 | Purpose                             |
| ---------- | ------------------------------------ | ----------------------------------- |
| **NEW**    | `src/composables/useDragOperator.ts` | Core drag state & coordination      |
| **NEW**    | `src/components/DragOperator.vue`    | Ghost task renderer                 |
| **MODIFY** | `src/stores/tasks.ts`                | Add `manageTaskRelocation()` method |
| **MODIFY** | `src/components/TrashBasket.vue`     | Register as zone                    |
| **MODIFY** | `src/components/TaskPile.vue`        | Register as zone, handle drag start |
| **MODIFY** | `src/components/DayColumn.vue`       | Register as zone, grid snapping     |
| **MODIFY** | `src/components/AddDayZone.vue`      | Register as zone, cancel behavior   |
| **MODIFY** | `src/App.vue` or `DayViewPage.vue`   | Add DragOperator singleton          |
| **DELETE** | Old DND files                        | Clean up legacy code                |
