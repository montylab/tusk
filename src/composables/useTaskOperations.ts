import { ref, onUnmounted, computed, unref, type Ref } from 'vue'
import type { Task } from '../types'
import { useDragState } from './useDragState'

type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

interface OperationConfig {
    startHour: number
    endHour: number
    hourHeight: number
    getContainerRect?: () => DOMRect | null
    getScrollTop?: () => number
    getScrollLeft?: () => number
    activeExternalTask?: () => Task | null
    // Handler callbacks
    onTaskDropped?: (payload: { taskId: string | number, startTime: number, duration: number, date: string }) => void
    onCreateTask?: (payload: { text: string, startTime: number, category: string, date: string }) => void
    onDuplicateTask?: (payload: { originalTaskId: string | number }) => void
    onDeleteTask?: (payload: { taskId: string | number, date: string }) => void
    onExternalTaskDropped?: (payload: { taskId: string | number, startTime: number, duration: number, date: string }) => void
    onExternalTaskDroppedOnSidebar?: (payload: { event: MouseEvent }) => void
    dates?: Ref<string[]>
    topOffset?: number | Ref<number>
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
    const activeTaskId = ref<string | number | null>(null)
    const { overZone, isOverTrash, isOverTodo, isOverShortcut, isOverCalendar, isOverAddButton, updateCollision, resetCollisions } = useDragState()

    // Initial state for op
    const initialStart = ref(0)
    const initialDuration = ref(60)
    const startY = ref(0)
    const startX = ref(0) // Track horizontal to detect movement in any direction
    const startScrollTop = ref(0)
    const dragThreshold = 5
    const pendingOp = ref<{
        taskId: string | number | null, opMode: OperationMode, task: Task
        isExternal?: boolean
        onStarted?: () => void
        yOffsetHours?: number
    }
        | null>(null)

    // Temp state for rendering active op
    const currentSnapTime = ref<number | null>(null)
    const currentSnapDate = ref<string | null>(null)
    const currentDuration = ref<number | null>(null)

    const startOperation = (e: MouseEvent, taskId: string | number, opMode: OperationMode, onStarted?: () => void) => {
        e.stopPropagation()
        const task = taskList.value.find(t => t.id === taskId)
        if (!task) return

        // Handle Clone & Drag
        if (opMode === 'drag' && e.ctrlKey) {
            config.onDuplicateTask?.({ originalTaskId: taskId })
        }

        startY.value = e.clientY
        startX.value = e.clientX
        startScrollTop.value = config.getScrollTop?.() || 0
        currentSnapDate.value = task.date!

        // Calculate initial offset from task start if not passed explicitly?
        // Actually, we should accept an offset in minutes or pixels.
        // But for now let's rely on the caller passing correct relativeY if possible?
        // No, caller passed initialRect in previous step, but startOperation here doesn't use it.
        // We need startOperation to accept an offset.

        // Let's add an optional offset argument to startOperation
        pendingOp.value = { taskId, opMode, task, onStarted }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // Logic to initiate an operation from an external source (sidebar)
    const startExternalDrag = (e: MouseEvent, task: Task, onStarted?: () => void, yOffsetHours?: number) => {
        startY.value = e.clientY
        startX.value = e.clientX
        startScrollTop.value = config.getScrollTop?.() || 0
        pendingOp.value = { taskId: null, opMode: 'drag', task, isExternal: true, onStarted, yOffsetHours }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    const onMouseMove = (e: MouseEvent) => {
        // Handle pending threshold
        if (mode.value === 'none' && pendingOp.value) {
            const dist = Math.sqrt(Math.pow(e.clientX - startX.value, 2) + Math.pow(e.clientY - startY.value, 2))
            if (dist > dragThreshold) {
                const { taskId, opMode, task, isExternal, onStarted, yOffsetHours } = pendingOp.value
                mode.value = opMode
                activeTaskId.value = taskId

                if (isExternal) {
                    const scrollTop = config.getScrollTop?.() || 0
                    // Reset start coordinates to current position to avoid double-counting delta
                    // since initialStart is calculated based on current position
                    startY.value = e.clientY
                    startX.value = e.clientX
                    startScrollTop.value = scrollTop

                    const containerRect = config.getContainerRect?.()
                    const headerHeight = unref(config.topOffset) || 0

                    if (containerRect) {
                        const relativeY = e.clientY - containerRect.top - headerHeight
                        const mouseTime = (relativeY / config.hourHeight) + config.startHour
                        initialStart.value = mouseTime - (yOffsetHours || 0)
                    } else {
                        initialStart.value = config.startHour
                    }

                    initialDuration.value = task.duration || 60
                    currentSnapTime.value = null
                    currentDuration.value = initialDuration.value
                }
                else {
                    initialStart.value = task.startTime!
                    initialDuration.value = task.duration
                    currentSnapTime.value = task.startTime
                    currentDuration.value = task.duration
                }

                if (opMode === 'drag') {
                    window.addEventListener('wheel', onWheel, { passive: false })
                }

                // Notify that the operation has actually started after threshold
                onStarted?.()
            } else {
                return
            }
        }

        if (mode.value === 'none') return

        const hourHeight = config.hourHeight
        const scrollTop = config.getScrollTop?.() || 0
        const deltaScroll = scrollTop - startScrollTop.value

        // Calculate deltaY relative to the grid (including scroll)
        // This ensures that if the grid scrolls, the delta accounts for it
        const deltaY = (e.clientY - startY.value) + deltaScroll
        const deltaHours = deltaY / hourHeight

        if (mode.value === 'drag') {
            const containerRect = config.getContainerRect?.()
            if (containerRect) {
                // Calculate time based on absolute mouse position relative to container
                const relativeY = e.clientY - containerRect.top - (unref(config.topOffset) || 0)
                const rawTime = (relativeY / config.hourHeight) + config.startHour

                // Calculate which column (date) we are over
                const isOverCalendar = e.clientX >= containerRect.left && e.clientX <= containerRect.right

                if (isOverCalendar && config.dates?.value) {
                    const relativeX = e.clientX - containerRect.left
                    const colWidth = containerRect.width / config.dates.value.length
                    const colIndex = Math.floor(relativeX / colWidth)
                    const targetDate = config.dates.value[Math.min(colIndex, config.dates.value.length - 1)]

                    currentSnapDate.value = targetDate

                    if (activeTaskId.value === null) {
                        // External drag - now use same delta logic to preserve grab points
                        const rawNewTime = initialStart.value + deltaHours
                        let snapped = Math.round(rawNewTime * 4) / 4
                        snapped = Math.max(config.startHour, Math.min(config.endHour - (currentDuration.value! / 60), snapped))
                        currentSnapTime.value = snapped
                    } else {
                        // Internal drag - USE DELTA from initial start!
                        // This ensures the task moves by the same amount the mouse moved,
                        // preserving the relative grab position.
                        const rawNewTime = initialStart.value + deltaHours
                        let snapped = Math.round(rawNewTime * 4) / 4
                        snapped = Math.max(config.startHour, Math.min(config.endHour - (currentDuration.value! / 60), snapped))
                        currentSnapTime.value = snapped
                    }
                } else {
                    currentSnapTime.value = null
                    currentSnapDate.value = null
                }
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
                    const originalDate = pendingOp.value?.task.date!

                    if (mode.value === 'drag' && finalOverTrash) {
                        config.onDeleteTask?.({ taskId: activeTaskId.value, date: originalDate })
                    } else if (mode.value === 'drag' && (isOverTodo.value || isOverShortcut.value)) {
                        const target = isOverTodo.value ? 'todo' : 'shortcut'
                        emit('task-dropped-on-sidebar', { taskId: activeTaskId.value, event: e, target, date: originalDate })
                    } else if (currentSnapTime.value !== null && currentSnapDate.value !== null) {
                        // Persist any change
                        config.onTaskDropped?.({
                            taskId: activeTaskId.value,
                            startTime: finalStart,
                            duration: finalDuration,
                            date: currentSnapDate.value
                        })
                    }
                } else if (mode.value === 'drag') {
                    // External task operation
                    if (finalOverTrash) {
                        emit('delete-external-task', {})
                    } else if (isOverTodo.value || isOverShortcut.value) {
                        // Dropped over a sidebar pile (To-Do or Shortcut)
                        emit('external-task-dropped-on-sidebar', { event: e })
                    } else if (currentSnapTime.value !== null && currentSnapDate.value !== null) {
                        // Only create task if it was dropped over the calendar (has a snap position)
                        config.onExternalTaskDropped?.({
                            taskId: Date.now(),
                            startTime: currentSnapTime.value,
                            duration: finalDuration,
                            date: currentSnapDate.value
                        })
                    }
                }
            }
        } finally {
            mode.value = 'none'
            activeTaskId.value = null
            pendingOp.value = null
            //currentSnapTime.value = null
            currentDuration.value = null
            resetCollisions()

            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('wheel', onWheel)
        }
    }

    const handleSlotClick = (hour: number, quarter: number, date: string) => {
        if (mode.value !== 'none') return
        const startTime = hour + (quarter * 0.25)
        emit('create-task', { startTime, date })
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
        currentSnapDate,
        currentDuration,
        overZone,
        isOverTrash,
        isOverTodo,
        isOverShortcut,
        isOverCalendar,
        isOverAddButton,
        startOperation,
        startExternalDrag,
        resetCollisions,
        handleSlotClick
    }
}
