import { ref, unref, Ref, readonly } from 'vue'
import { DragStrategy } from '../useDragAndDrop'
import { useDragContext } from '../useDragContext'
import { useTasksStore } from '../../../stores/tasks'
import { Task } from '../../../types'

interface CalendarDragConfig {
    hourHeight: number
    startHour: number
    endHour: number
    dates: Ref<string[]>
    topOffset: Ref<number>
    getContainerRect: () => DOMRect | null
    getScrollTop: () => number
}

interface CalendarDragPayload {
    task: Task
    mode: 'drag' | 'resize-top' | 'resize-bottom'
    initialRect?: DOMRect
}

export function useCalendarDrag(config: CalendarDragConfig): DragStrategy {
    const { startDrag, updateDragPosition, updateGhostPosition, updateDragDimensions, updateDragOffset, endDrag, setDropTarget, dropTarget } = useDragContext()
    const tasksStore = useTasksStore()

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
    let originalWidth = 200

    const onStart = (payload: CalendarDragPayload, event: MouseEvent) => {
        activeTask = payload.task
        activeMode.value = payload.mode

        startY.value = event.clientY
        startScrollTop.value = config.getScrollTop()
        initialStart.value = activeTask.startTime || config.startHour
        initialDuration.value = activeTask.duration || 60
        currentSnapTime.value = initialStart.value
        currentDuration.value = initialDuration.value
        currentSnapDate.value = activeTask.date || null

        currentSnapDate.value = activeTask.date || null

        // Calculate Offset & Dimensions from initialRect if available
        let offsetX = 0
        let offsetY = 0
        let width = 200 // Fallback

        // Initial Height
        const h = (activeTask.duration / 60) * config.hourHeight

        const containerRect = config.getContainerRect()
        if (payload.initialRect) {
            width = payload.initialRect.width
            originalWidth = width
            offsetX = event.clientX - payload.initialRect.left
            offsetY = event.clientY - payload.initialRect.top

            // If it's a drag operation, we want it to become full column width immediately
            if (activeMode.value === 'drag' && containerRect && activeTask.date) {
                const colWidth = (containerRect.width - 30) / config.dates.value.length
                const colIndex = config.dates.value.indexOf(activeTask.date)
                if (colIndex !== -1) {
                    const colLeft = containerRect.left + (colIndex * colWidth)
                    width = colWidth
                    offsetX = event.clientX - colLeft
                }
            }

            initialOffsetRatioX = offsetX / width
            initialOffsetRatioY = offsetY / h
        } else {
            originalWidth = 200 // Fallback
        }


        startDrag(
            { type: 'task', data: activeTask, source: 'calendar' },
            { x: event.clientX, y: event.clientY },
            { x: offsetX, y: offsetY },
            { width, height: h }
        )
    }

    const onMove = (event: MouseEvent) => {
        updateDragPosition(event.clientX, event.clientY)

        const scrollTop = config.getScrollTop()
        const deltaScroll = scrollTop - startScrollTop.value
        const deltaY = (event.clientY - startY.value) + deltaScroll
        const deltaHours = deltaY / config.hourHeight

        if (activeMode.value === 'drag') {
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
                currentSnapDate.value = targetDate

                // Time Calculation
                const rawNewTime = initialStart.value + deltaHours
                let snapped = Math.round(rawNewTime * 4) / 4
                snapped = Math.max(config.startHour, Math.min(config.endHour - (currentDuration.value! / 60), snapped))
                currentSnapTime.value = snapped

                // Update Ghost Position
                // Calculate Screen coords for the ghost
                // +1 to account for the border-left of DayColumn
                const ghostX = containerRect.left + (colIndex * colWidth) + 1
                const ghostY = containerRect.top + (snapped - config.startHour) * config.hourHeight + unref(config.topOffset)

                updateGhostPosition(ghostX, ghostY)
                setDropTarget({ zone: 'calendar', data: { date: targetDate, time: snapped } })

                // Dimensions: Now always use full column width for better visibility
                if (activeTask) {
                    const h = (activeTask.duration / 60) * config.hourHeight
                    updateDragDimensions(colWidth, h)
                    updateDragOffset(colWidth * initialOffsetRatioX, h * initialOffsetRatioY)
                }

            } else {
                updateGhostPosition(null, null)
                // Outside Calendar: Shrink to card size
                updateDragDimensions(220, 60)
                updateDragOffset(110, 30) // Center mouse on card
            }
        }
        else if (activeMode.value === 'resize-bottom') {
            let deltaMinutes = deltaHours * 60
            let rawDuration = initialDuration.value + deltaMinutes
            let snappedDuration = Math.round(rawDuration / 15) * 15
            snappedDuration = Math.max(15, snappedDuration)

            const endTime = initialStart.value + (snappedDuration / 60)
            if (endTime <= config.endHour) {
                currentDuration.value = snappedDuration
                // Update dimensions
                const newH = (snappedDuration / 60) * config.hourHeight
                updateDragDimensions(200, newH)
            }
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
