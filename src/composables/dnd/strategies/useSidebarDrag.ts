import { ref } from 'vue'
import { DragStrategy } from '../useDragAndDrop'
import { useDragContext } from '../useDragContext'
import { useTasksStore } from '../../../stores/tasks'
import { Task } from '../../../types'
import { useCalendarGrid, CalendarGridConfig } from '../useCalendarGrid'

interface SidebarDragPayload {
    task: Task
    source: 'todo' | 'shortcut'
    offsetHours?: number // vertical offset from mouse to task top in hours
}

export function useSidebarDrag(config: CalendarGridConfig): DragStrategy {
    const { startDrag, updateDragPosition, updateGhostPosition, updateDragDimensions, updateDragOffset, endDrag, setDropTarget, dropTarget } = useDragContext()
    const tasksStore = useTasksStore()
    const grid = useCalendarGrid(config)

    // Internal State
    let activeTask: Task | null = null
    let activeSource: 'todo' | 'shortcut' | null = null
    let yOffsetHours = 0
    let initialOffsetRatioY = 0.5

    // Snap State
    const currentSnapTime = ref<number | null>(null)
    const currentSnapDate = ref<string | null>(null)

    const onStart = (payload: SidebarDragPayload, event: MouseEvent) => {
        activeTask = payload.task
        activeSource = payload.source
        yOffsetHours = payload.offsetHours || 0

        currentSnapTime.value = null
        currentSnapDate.value = null

        // Pass dimensions if possible?
        // Ideally we know the height based on duration
        const duration = activeTask.duration || 60
        const height = (duration / 60) * config.hourHeight
        initialOffsetRatioY = yOffsetHours / (duration / 60)

        startDrag(
            { type: 'task', data: activeTask, source: 'calendar' },
            { x: event.clientX, y: event.clientY },
            { x: 110, y: yOffsetHours * config.hourHeight }, // Center horizontally (110 is half of 220)
            { width: 220, height }
        )
    }

    const onMove = (event: MouseEvent) => {
        updateDragPosition(event.clientX, event.clientY)

        if (activeTask) {
            const dragOffsetY = yOffsetHours * config.hourHeight
            const projection = grid.project(event.clientX, event.clientY, activeTask.duration / 60, dragOffsetY)

            if (projection) {
                currentSnapDate.value = projection.date
                currentSnapTime.value = projection.time

                updateGhostPosition(projection.ghostX, projection.ghostY)

                // Only setDropTarget to calendar if we are not over a higher priority zone
                if (dropTarget.value.zone === 'calendar' || dropTarget.value.zone === 'none') {
                    setDropTarget({ zone: 'calendar', data: { date: projection.date, time: projection.time } })
                }

                // Expand to column width
                const h = (activeTask.duration / 60) * config.hourHeight
                updateDragDimensions(projection.colWidth, h)
                updateDragOffset(projection.colWidth * 0.5, h * initialOffsetRatioY)
            } else {
                updateGhostPosition(null, null)
                // Shrink to card size when over sidebar/trash
                const h = activeTask ? (activeTask.duration / 60) * config.hourHeight : 60
                updateDragDimensions(220, 60)
                updateDragOffset(110, 30)
            }
        }
    }

    const onEnd = (_event: MouseEvent) => {
        if (activeTask && activeSource) {
            const target = dropTarget.value.zone
            const duration = activeTask.duration || 60

            if (target === 'calendar' && currentSnapTime.value !== null && currentSnapDate.value) {
                if (activeSource === 'todo') {
                    tasksStore.moveTodoToCalendar(activeTask.id, currentSnapDate.value, currentSnapTime.value, duration)
                } else {
                    tasksStore.copyShortcutToCalendar(activeTask.id, currentSnapDate.value, currentSnapTime.value, duration)
                }
            } else if (target === 'trash') {
                if (activeSource === 'todo') tasksStore.deleteTodo(activeTask.id)
                else tasksStore.deleteShortcut(activeTask.id)
            } else if (target === 'todo') {
                const targetIndex = dropTarget.value.data?.index
                if (targetIndex !== undefined) {
                    if (activeSource === 'shortcut') {
                        const order = tasksStore.calculateNewOrder(tasksStore.todoTasks, targetIndex)
                        tasksStore.copyShortcutToTodo(activeTask.id, order)
                    } else if (activeSource === 'todo') {
                        tasksStore.reorderTodo(activeTask.id, targetIndex)
                    }
                } else if (activeSource === 'shortcut') {
                    tasksStore.copyShortcutToTodo(activeTask.id)
                }
            } else if (target === 'shortcut') {
                const targetIndex = dropTarget.value.data?.index
                if (targetIndex !== undefined) {
                    if (activeSource === 'todo') {
                        const order = tasksStore.calculateNewOrder(tasksStore.shortcutTasks, targetIndex)
                        tasksStore.moveTodoToShortcut(activeTask.id, order)
                    } else if (activeSource === 'shortcut') {
                        tasksStore.reorderShortcut(activeTask.id, targetIndex)
                    }
                } else if (activeSource === 'todo') {
                    tasksStore.moveTodoToShortcut(activeTask.id)
                }
            }
            // If target is same as source (e.g. todo -> todo), it's reorder.
            // Reorder strategy might handle that, or we handle it here if dropped on self?
            // Usually reorder is specific strategy. 
        }

        activeTask = null
        activeSource = null
        currentSnapTime.value = null
        endDrag()
    }

    const onCancel = () => {
        activeTask = null
        endDrag()
    }

    return { onStart, onMove, onEnd, onCancel }
}
