import { ref, unref, Ref } from 'vue'
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
}

export function useCalendarDrag(config: CalendarDragConfig): DragStrategy {
    const { startDrag, updateDragPosition, updateGhostPosition, updateDragDimensions, endDrag, setDropTarget, dropTarget } = useDragContext()
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
    let activeMode: 'drag' | 'resize-top' | 'resize-bottom' = 'drag'

    const onStart = (payload: CalendarDragPayload, event: MouseEvent) => {
        activeTask = payload.task
        activeMode = payload.mode

        startY.value = event.clientY
        startScrollTop.value = config.getScrollTop()
        initialStart.value = activeTask.startTime || config.startHour
        initialDuration.value = activeTask.duration || 60
        currentSnapTime.value = initialStart.value
        currentDuration.value = initialDuration.value
        currentSnapDate.value = activeTask.date || null

        // Dimensions (Attempt to get from event target if possible, or config?)
        // Ideally we grab the rect of the task element.
        // For logic, we assume standard width/height or use passed dims.
        // Here we just accept a default since we don't have the element rect readily available
        // unless passed in payload.
        // Assuming hourHeight * duration
        const h = (activeMode === 'drag')
            ? (activeTask.duration / 60) * config.hourHeight
            : (activeTask.duration / 60) * config.hourHeight // Resize ghost size?

        startDrag(
            { type: 'task', data: activeTask, source: 'calendar' },
            { x: event.clientX, y: event.clientY },
            { x: 0, y: 0 }, // Offset TODO: Calculate correct offset
            { width: 200, height: h } // Width hardcoded for now or fetch from context
        )
    }

    const onMove = (event: MouseEvent) => {
        updateDragPosition(event.clientX, event.clientY)

        const scrollTop = config.getScrollTop()
        const deltaScroll = scrollTop - startScrollTop.value
        const deltaY = (event.clientY - startY.value) + deltaScroll
        const deltaHours = deltaY / config.hourHeight

        if (activeMode === 'drag') {
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
                const colWidth = containerRect.width / config.dates.value.length
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
                const ghostX = containerRect.left + (colIndex * colWidth)
                const ghostY = containerRect.top + (snapped - config.startHour) * config.hourHeight + unref(config.topOffset)

                updateGhostPosition(ghostX, ghostY)
                setDropTarget({ zone: 'calendar', data: { date: targetDate, time: snapped } })

                // Ensure dimensions match duration (if changed externally? no)
            } else {
                updateGhostPosition(null, null)
                // Let ZoneDetection handle zones.
                // It will overwrite setDropTarget.
                // We assume ZoneDetection runs AFTER or concurrently. 
                // Wait, useZoneDetection watches dragPosition.
                // If we also set dropTarget here, who wins?
                // Depending on watch/update order. 
                // BUT, ZoneDetection only sets 'trash' / 'todo' if collision.
                // If collision with Calendar bounds -> it sets 'calendar'.
                // Strategy logic is more specific (it calculates snap).
                // If ZoneDetection overrides, we might lose `data` (snap time).

                // Solution: ZoneDetection detects generic zone.
                // Detailed Strategy overrides/augments it?
                // Or better: Strategy handles Calendar Zone explicitely (as above)
                // and if NOT over calendar, let ZoneDetection handle it (via fallback or simple overlap).
            }
        }
        else if (activeMode === 'resize-bottom') {
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

            if (activeMode === 'drag') {
                if (target === 'trash') {
                    tasksStore.deleteScheduledTask(activeTask.id, activeTask.date!)
                } else if (target === 'todo') {
                    // Move to Todo
                    // We need order? Store handles appending usually.
                    // Or use dropTarget.data if ZoneDetection provided index?
                    tasksStore.moveCalendarToTodo(activeTask.id, activeTask.date!)
                } else if (target === 'shortcut') {
                    tasksStore.moveCalendarToShortcut(activeTask.id, activeTask.date!)
                    // Note: Logic allows moving calendar -> shortcut. 
                } else if (target === 'calendar') {
                    // Check specific data from our own calculation?
                    // If ZoneDetection overwrote it, we might check local currentSnapTime.
                    // Local state is more reliable for specific strategy logic.
                    if (currentSnapTime.value !== null && currentSnapDate.value) {
                        tasksStore.updateScheduledTask(activeTask.id, activeTask.date!, {
                            startTime: currentSnapTime.value,
                            date: currentSnapDate.value
                        })
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

    return { onStart, onMove, onEnd }
}
