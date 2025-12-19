import { ref, onUnmounted, computed, unref, type Ref } from 'vue'
import type { Task } from '../types'
import { getRandomCategory } from '../utils'
import { useDragState } from './useDragState'

type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

interface OperationConfig {
    startHour: number
    endHour: number
    hourHeight: number
    getContainerRect?: () => DOMRect | null
    getScrollTop?: () => number
    activeExternalTask?: () => Task | null
    // Handler callbacks
    onTaskDropped?: (payload: { taskId: number, startTime: number, duration: number }) => void
    onCreateTask?: (payload: { text: string, startTime: number, category: string }) => void
    onDuplicateTask?: (payload: { originalTaskId: number }) => void
    onDeleteTask?: (payload: { taskId: number }) => void
    onExternalTaskDropped?: (payload: { taskId: number, startTime: number, duration: number }) => void
    onExternalTaskDroppedOnSidebar?: (payload: { event: MouseEvent }) => void
}

export function useTaskOperations(
    tasks: Task[] | Ref<Task[]> | (() => Task[]),
    emit: (event: string, payload: any) => void,
    config: OperationConfig
) {
    const taskList = computed(() => {
        const t = typeof tasks === 'function' ? tasks() : unref(tasks)
        return t || []
    })
    const mode = ref<OperationMode>('none')
    const activeTaskId = ref<number | null>(null)
    const { isOverTrash, isOverTodo, isOverShortcut, updateCollision, resetCollisions } = useDragState()

    // Initial state for op
    const initialStart = ref(0)
    const initialDuration = ref(60)
    const startY = ref(0)

    // Temp state for rendering active op
    const currentSnapTime = ref<number | null>(null)
    const currentDuration = ref<number | null>(null)

    const startOperation = (e: MouseEvent, taskId: number, opMode: OperationMode) => {
        e.preventDefault()
        e.stopPropagation()

        const task = taskList.value.find(t => t.id === taskId)
        if (!task) return

        let targetTaskId = taskId

        // Handle Clone & Drag
        if (opMode === 'drag' && e.ctrlKey) {
            config.onDuplicateTask?.({ originalTaskId: taskId })
            // Note: We can't get the new ID synchronously anymore
            // The duplicate will appear in the next render
            return
        }

        mode.value = opMode
        activeTaskId.value = targetTaskId
        initialStart.value = task.startTime!
        initialDuration.value = task.duration
        startY.value = e.clientY

        currentSnapTime.value = task.startTime
        currentDuration.value = task.duration

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        if (opMode === 'drag') {
            window.addEventListener('wheel', onWheel, { passive: false })
        }
    }

    // Logic to initiate an operation from an external source (sidebar)
    const startExternalDrag = (e: MouseEvent, task: Task) => {
        mode.value = 'drag'
        activeTaskId.value = null

        initialStart.value = config.startHour
        initialDuration.value = task.duration || 60
        startY.value = e.clientY

        currentSnapTime.value = null
        currentDuration.value = initialDuration.value

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('wheel', onWheel, { passive: false })
    }

    const onMouseMove = (e: MouseEvent) => {
        if (mode.value === 'none') return

        const hourHeight = config.hourHeight
        const deltaY = e.clientY - startY.value
        const deltaHours = deltaY / hourHeight

        if (mode.value === 'drag') {
            const containerRect = config.getContainerRect?.()
            const scrollTop = config.getScrollTop?.() || 0

            if (activeTaskId.value === null && containerRect) {
                // External drag: calculate time based on absolute mouse position relative to container
                const relativeY = e.clientY - containerRect.top + scrollTop
                const rawTime = (relativeY / config.hourHeight) + config.startHour

                // Only snap if we are horizontally over the calendar or close to it
                const isOverCalendar = e.clientX >= containerRect.left && e.clientX <= containerRect.right
                if (isOverCalendar) {
                    currentSnapTime.value = Math.max(config.startHour,
                        Math.min(config.endHour - (currentDuration.value! / 60),
                            Math.floor(rawTime * 4) / 4))
                } else {
                    currentSnapTime.value = null
                }
            } else {
                // Internal drag: relative movement
                const rawNewTime = initialStart.value + deltaHours
                let snapped = Math.round(rawNewTime * 4) / 4
                snapped = Math.max(config.startHour, Math.min(config.endHour - (currentDuration.value! / 60), snapped))
                currentSnapTime.value = snapped
            }
        }
        else if (mode.value === 'resize-bottom') {
            let deltaMinutes = deltaHours * 60
            let rawDuration = initialDuration.value + deltaMinutes
            let snappedDuration = Math.round(rawDuration / 15) * 15
            snappedDuration = Math.max(15, snappedDuration)

            const endTime = initialStart.value + (snappedDuration / 60)
            if (endTime <= config.endHour) {
                currentDuration.value = snappedDuration
            }
        }
        else if (mode.value === 'resize-top') {
            let rawNewStart = initialStart.value + deltaHours
            let snappedStart = Math.round(rawNewStart * 4) / 4
            snappedStart = Math.min(Math.max(config.startHour, snappedStart), initialStart.value + (initialDuration.value / 60) - 0.25)

            // Calculate new duration
            const originalEndTime = initialStart.value + (initialDuration.value / 60)
            let newDuration = (originalEndTime - snappedStart) * 60
            newDuration = Math.round(newDuration / 15) * 15

            if (newDuration >= 15) {
                currentSnapTime.value = snappedStart
                currentDuration.value = newDuration
            }
        }

        // Update centralized collision state
        updateCollision(e)
    }

    const onWheel = (e: WheelEvent) => {
        if (mode.value === 'drag' && activeTaskId.value !== null) {
            e.preventDefault()
            const step = 15
            const change = e.deltaY > 0 ? step : -step
            let newDur = (currentDuration.value || initialDuration.value) + change
            newDur = Math.max(15, newDur)

            const start = currentSnapTime.value || initialStart.value
            const end = start + (newDur / 60)
            if (end <= config.endHour) {
                currentDuration.value = newDur
            }
        }
    }

    const onMouseUp = (e: MouseEvent) => {
        try {
            if (mode.value !== 'none') {
                const finalOverTrash = isOverTrash.value
                const finalStart = currentSnapTime.value ?? initialStart.value
                const finalDuration = currentDuration.value ?? initialDuration.value

                if (activeTaskId.value !== null) {
                    // Internal task operation (drag or resize)
                    if (mode.value === 'drag' && finalOverTrash) {
                        config.onDeleteTask?.({ taskId: activeTaskId.value })
                    } else if (mode.value === 'drag' && (isOverTodo.value || isOverShortcut.value)) {
                        emit('task-dropped-on-sidebar', { taskId: activeTaskId.value, event: e })
                    } else if (finalStart !== initialStart.value || finalDuration !== initialDuration.value) {
                        // Persist any change (drag position or resize)
                        config.onTaskDropped?.({
                            taskId: activeTaskId.value,
                            startTime: finalStart,
                            duration: finalDuration
                        })
                    }
                } else if (mode.value === 'drag') {
                    // External task operation
                    if (finalOverTrash) {
                        emit('delete-external-task', {})
                    } else if (isOverTodo.value || isOverShortcut.value) {
                        // Dropped over a sidebar pile (To-Do or Shortcut)
                        emit('external-task-dropped-on-sidebar', { event: e })
                    } else if (currentSnapTime.value !== null) {
                        // Only create task if it was dropped over the calendar (has a snap position)
                        config.onExternalTaskDropped?.({
                            taskId: Date.now(),
                            startTime: currentSnapTime.value,
                            duration: finalDuration
                        })
                    }
                }
            }
        } finally {
            mode.value = 'none'
            activeTaskId.value = null
            currentSnapTime.value = null
            currentDuration.value = null
            resetCollisions()

            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('wheel', onWheel)
        }
    }

    const handleSlotClick = (hour: number, quarter: number) => {
        if (mode.value !== 'none') return
        const startTime = hour + (quarter * 0.25)
        const text = prompt("Enter task title:")
        if (text) {
            config.onCreateTask?.({
                text,
                startTime,
                category: getRandomCategory()
            })
        }
    }

    onUnmounted(() => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('wheel', onWheel)
    })

    return {
        mode,
        activeTaskId,
        currentSnapTime,
        currentDuration,
        isOverTrash,
        startOperation,
        startExternalDrag,
        resetCollisions,
        handleSlotClick
    }
}
