import { ref, readonly } from 'vue'
import { DragStrategy } from '../useDragAndDrop'
import { useDragContext } from '../useDragContext'
import { useTasksStore } from '../../../stores/tasks'
import { Task } from '../../../types'
import { useCalendarGrid, CalendarGridConfig } from '../useCalendarGrid'

interface CalendarDragPayload {
    task: Task
    mode: 'drag' | 'resize-top' | 'resize-bottom'
    initialRect?: DOMRect
}

export function useCalendarDrag(config: CalendarGridConfig): DragStrategy {
    const { startDrag, updateDragPosition, updateGhostPosition, updateDragDimensions, updateDragOffset, endDrag, setDropTarget, dropTarget } = useDragContext()
    const tasksStore = useTasksStore()
    const grid = useCalendarGrid(config)

    // Internal State
    const startY = ref(0)
    const startScrollTop = ref(0)
    const initialStart = ref(0)
    const initialDuration = ref(60)

    // Snap State
    const currentSnapTime = ref<number | null>(null)
    const currentSnapDate = ref<string | null>(null)
    const currentDuration = ref<number | null>(null)

    let activeTask: Task | null = null
    const activeMode = ref<'drag' | 'resize-top' | 'resize-bottom'>('drag')
    let initialOffsetRatioX = 0.5
    let initialOffsetRatioY = 0.5
    let dragWidth = 200
    let dragOffsetX = 0
    let dragOffsetY = 0
    let initialGhostX = 0
    let initialGhostY = 0

    const onStart = (payload: CalendarDragPayload, event: MouseEvent) => {
        activeTask = payload.task
        activeMode.value = payload.mode

        startY.value = event.clientY
        startScrollTop.value = config.getScrollTop()
        initialStart.value = activeTask.startTime ?? config.startHour
        initialDuration.value = activeTask.duration ?? 60
        currentSnapTime.value = initialStart.value
        currentDuration.value = initialDuration.value
        currentSnapDate.value = activeTask.date ?? null

        // Calculate Offset & Dimensions from initialRect if available
        dragOffsetX = 0
        dragOffsetY = 0
        dragWidth = 200 // Fallback

        // Initial Height
        const h = (activeTask.duration / 60) * config.hourHeight

        if (payload.initialRect) {
            dragWidth = payload.initialRect.width
            dragOffsetX = event.clientX - payload.initialRect.left
            dragOffsetY = event.clientY - payload.initialRect.top
            initialGhostX = payload.initialRect.left
            initialGhostY = payload.initialRect.top

            if (activeTask.date) {
                const projection = grid.project(event.clientX, event.clientY, activeTask.duration! / 60, dragOffsetY)
                if (projection) {
                    dragWidth = projection.colWidth
                    if (activeMode.value === 'drag') {
                        dragOffsetX = event.clientX - projection.ghostX
                    }
                    initialGhostX = projection.ghostX
                    initialGhostY = projection.ghostY
                }
            }

            initialOffsetRatioX = dragOffsetX / dragWidth
            initialOffsetRatioY = dragOffsetY / h

            // Fixed position for resize
            if (activeMode.value.startsWith('resize')) {
                updateGhostPosition(initialGhostX, initialGhostY)
            }
        }


        startDrag(
            { type: 'task', data: activeTask, source: 'calendar' },
            { x: event.clientX, y: event.clientY },
            { x: dragOffsetX, y: dragOffsetY },
            { width: dragWidth, height: h }
        )
    }

    const onMove = (event: MouseEvent) => {
        updateDragPosition(event.clientX, event.clientY)

        const scrollTop = config.getScrollTop()
        const deltaScroll = scrollTop - startScrollTop.value
        const deltaY = (event.clientY - startY.value) + deltaScroll
        const deltaHours = deltaY / config.hourHeight

        if (activeMode.value === 'drag' && activeTask) {
            const projection = grid.project(event.clientX, event.clientY, activeTask.duration / 60, dragOffsetY)

            if (projection) {
                currentSnapDate.value = projection.date
                currentSnapTime.value = projection.time

                updateGhostPosition(projection.ghostX, projection.ghostY)

                // Only setDropTarget to calendar if we are not over a higher priority zone
                if (dropTarget.value.zone === 'calendar' || dropTarget.value.zone === 'none') {
                    setDropTarget({ zone: 'calendar', data: { date: projection.date, time: projection.time } })
                }

                if (activeTask) {
                    const cardHeight = (activeTask.duration! / 60) * config.hourHeight
                    updateDragDimensions(projection.colWidth, cardHeight)
                    updateDragOffset(projection.colWidth * initialOffsetRatioX, cardHeight * initialOffsetRatioY)
                }
            } else if (activeTask) {
                updateGhostPosition(null, null)
                updateDragDimensions(220, 60)
                updateDragOffset(110, 30)
            }
        }
        else if (activeMode.value === 'resize-bottom') {
            let snappedDeltaHours = Math.round(deltaHours * 4) / 4
            let newDuration = initialDuration.value + snappedDeltaHours * 60
            newDuration = Math.max(15, newDuration)

            const endTime = initialStart.value + (newDuration / 60)
            if (endTime <= config.endHour) {
                currentDuration.value = newDuration
                // Anchor top, but account for scroll
                updateGhostPosition(initialGhostX, initialGhostY - deltaScroll)
                const newH = (newDuration / 60) * config.hourHeight
                updateDragDimensions(dragWidth, newH)
            }
        }
        else if (activeMode.value === 'resize-top') {
            let snappedDeltaHours = Math.round(deltaHours * 4) / 4
            let newStartTime = initialStart.value + snappedDeltaHours

            // Clamping
            newStartTime = Math.max(config.startHour, Math.min(initialStart.value + (initialDuration.value / 60) - 0.25, newStartTime))
            let newDuration = initialDuration.value - (newStartTime - initialStart.value) * 60

            currentSnapTime.value = newStartTime
            currentDuration.value = newDuration

            // Re-calculate shift pixels after clamping
            const actualDelta = newStartTime - initialStart.value
            const newGhostY = initialGhostY - deltaScroll + (actualDelta * config.hourHeight)
            updateGhostPosition(initialGhostX, newGhostY)

            const newH = (newDuration / 60) * config.hourHeight
            updateDragDimensions(dragWidth, newH)
        }
    }

    const onEnd = (event: MouseEvent) => {
        if (activeTask) {
            const target = dropTarget.value.zone

            if (activeMode.value === 'drag') {
                if (target === 'trash') {
                    tasksStore.deleteScheduledTask(activeTask.id, activeTask.date!)
                } else if (target === 'todo') {
                    const targetIndex = dropTarget.value.data?.index
                    const order = targetIndex !== undefined ? tasksStore.calculateNewOrder(tasksStore.todoTasks, targetIndex) : undefined
                    tasksStore.moveCalendarToTodo(activeTask.id, activeTask.date!, order)
                } else if (target === 'shortcut') {
                    const targetIndex = dropTarget.value.data?.index
                    const order = targetIndex !== undefined ? tasksStore.calculateNewOrder(tasksStore.shortcutTasks, targetIndex) : undefined
                    tasksStore.moveCalendarToShortcut(activeTask.id, activeTask.date!, order)
                } else if (target === 'calendar') {
                    if (currentSnapTime.value !== null && currentSnapDate.value) {
                        if (currentSnapDate.value !== activeTask.date) {
                            tasksStore.moveScheduledTask(activeTask.id, activeTask.date!, currentSnapDate.value, {
                                startTime: currentSnapTime.value
                            })
                        } else {
                            tasksStore.updateScheduledTask(activeTask.id, activeTask.date!, {
                                startTime: currentSnapTime.value
                            })
                        }
                    }
                }
            } else {
                // Resize
                if (currentDuration.value !== null) {
                    tasksStore.updateScheduledTask(activeTask.id, activeTask.date!, {
                        startTime: currentSnapTime.value !== null ? currentSnapTime.value : activeTask.startTime,
                        duration: currentDuration.value
                    })
                }
            }
        }

        // Cleanup
        activeTask = null
        currentSnapTime.value = null
        currentDuration.value = null
        endDrag()
    }

    return {
        onStart,
        onMove,
        onEnd,
        currentSnapTime: readonly(currentSnapTime),
        currentSnapDate: readonly(currentSnapDate),
        currentDuration: readonly(currentDuration),
        activeMode: readonly(activeMode)
    }
}

// Update the type definition if needed, or let TS infer it.
// Actually DragStrategy interface probably needs updating or we just use the return type.
