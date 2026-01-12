import { ref, unref, Ref } from 'vue'
import { DragStrategy } from '../useDragAndDrop'
import { useDragContext } from '../useDragContext'
import { useTasksStore } from '../../../stores/tasks'
import { Task } from '../../../types'

interface SidebarDragConfig {
    hourHeight: number
    startHour: number
    endHour: number
    dates: Ref<string[]>
    topOffset: Ref<number>
    getContainerRect: () => DOMRect | null
    getScrollTop: () => number
}

interface SidebarDragPayload {
    task: Task
    source: 'todo' | 'shortcut'
    offsetHours?: number // vertical offset from mouse to task top in hours
}

export function useSidebarDrag(config: SidebarDragConfig): DragStrategy {
    const { startDrag, updateDragPosition, updateGhostPosition, updateDragDimensions, updateDragOffset, endDrag, setDropTarget, dropTarget } = useDragContext()
    const tasksStore = useTasksStore()

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

        const containerRect = config.getContainerRect()
        if (!containerRect) return

        const isOverCalendar =
            event.clientX >= containerRect.left &&
            event.clientX <= containerRect.right &&
            event.clientY >= containerRect.top &&
            event.clientY <= containerRect.bottom

        if (isOverCalendar) {
            // Column Calculation
            const relativeX = event.clientX - containerRect.left
            // Subtract the 30px spacer of AddDayZone to get true columns area
            const colWidth = (containerRect.width - 30) / config.dates.value.length
            const colIndex = Math.floor(relativeX / colWidth)
            const targetDate = config.dates.value[Math.min(colIndex, config.dates.value.length - 1)]

            // Time Calculation
            // We need to account for the scroll and the offset at which we grabbed the task
            const relativeY = event.clientY - containerRect.top - unref(config.topOffset)
            const mouseTime = (relativeY / config.hourHeight) + config.startHour

            // The task start time should be where the TOP of the task lands.
            // mouseTime is where the cursor is.
            // startTime = mouseTime - yOffsetHours
            const rawStartTime = mouseTime - yOffsetHours

            let snapped = Math.round(rawStartTime * 4) / 4
            const duration = activeTask?.duration || 60
            snapped = Math.max(config.startHour, Math.min(config.endHour - (duration / 60), snapped))

            currentSnapDate.value = targetDate
            currentSnapTime.value = snapped

            // Ghost Position
            // +1 to account for the border-left of DayColumn
            const ghostX = containerRect.left + (colIndex * colWidth) + 1
            const ghostY = containerRect.top + (snapped - config.startHour) * config.hourHeight + unref(config.topOffset)

            updateGhostPosition(ghostX, ghostY)
            setDropTarget({ zone: 'calendar', data: { date: targetDate, time: snapped } })

            // Expand to column width
            if (activeTask) {
                const h = (activeTask.duration / 60) * config.hourHeight
                updateDragDimensions(colWidth, h)
                updateDragOffset(colWidth * 0.5, h * initialOffsetRatioY)
            }
        } else {
            updateGhostPosition(null, null)
            // Shrink to card size when over sidebar/trash
            const h = activeTask ? (activeTask.duration / 60) * config.hourHeight : 60
            updateDragDimensions(220, 60) // Simple card height? or h? 
            // Usually sidebar items have uniform height in TaskPile (e.g. 60)
            updateDragOffset(110, 30)
            // Let ZoneDetection handle Sidebar/Trash zones
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
