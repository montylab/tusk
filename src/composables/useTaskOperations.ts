import { ref, onUnmounted } from 'vue'
import type { Task } from '../types'
import { getRandomCategory } from '../utils'

type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

interface OperationConfig {
    startHour: number
    endHour: number
    hourHeight: number
}

export function useTaskOperations(
    tasks: Task[],
    emit: (event: any, payload: any) => void,
    config: OperationConfig
) {
    const mode = ref<OperationMode>('none')
    const activeTaskId = ref<number | null>(null)

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

        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        mode.value = opMode
        activeTaskId.value = taskId
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

    const onMouseMove = (e: MouseEvent) => {
        if (mode.value === 'none') return

        const deltaY = e.clientY - startY.value
        // Assumed fixed height from CSS is 80px per hour
        const hourHeight = config.hourHeight
        const deltaHours = deltaY / hourHeight

        if (mode.value === 'drag') {
            let rawNewTime = initialStart.value + deltaHours
            let snapped = Math.round(rawNewTime * 4) / 4
            // Clamp
            snapped = Math.max(config.startHour, Math.min(config.endHour - (initialDuration.value / 60), snapped))
            currentSnapTime.value = snapped
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

    const onMouseUp = () => {
        if (mode.value !== 'none' && activeTaskId.value !== null) {
            const finalStart = currentSnapTime.value ?? initialStart.value
            const finalDuration = currentDuration.value ?? initialDuration.value

            if (finalStart !== initialStart.value || finalDuration !== initialDuration.value) {
                emit('task-dropped', {
                    taskId: activeTaskId.value,
                    startTime: finalStart,
                    duration: finalDuration
                })
            }
        }

        mode.value = 'none'
        activeTaskId.value = null
        currentSnapTime.value = null
        currentDuration.value = null

        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('wheel', onWheel)
    }

    const handleSlotClick = (hour: number, quarter: number) => {
        if (mode.value !== 'none') return
        const startTime = hour + (quarter * 0.25)
        const text = prompt("Enter task title:")
        if (text) {
            emit('create-task', {
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
        startOperation,
        handleSlotClick
    }
}
