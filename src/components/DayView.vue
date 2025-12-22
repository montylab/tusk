<script
    setup
    lang="ts"
>
import DayColumn from './DayColumn.vue'
import TaskItem from './TaskItem.vue'
import AddDayZone from './AddDayZone.vue'
import type { Task } from '../types'
import { useTaskOperations } from '../composables/useTaskOperations'
import { useTasksStore } from '../stores/tasks'
import { useDragState } from '../composables/useDragState'
import { ref, watch, onMounted, onUnmounted, computed, toRef, nextTick } from 'vue'

const props = withDefaults(defineProps<{
    dates: string[]
    tasksByDate: Record<string, Task[]>
    startHour?: number
    endHour?: number
    activeExternalTask?: Task | null
}>(), {
    startHour: 0,
    endHour: 24,
    activeExternalTask: null
})

const emit = defineEmits<{
    (e: 'update:is-over-trash', payload: boolean): void
    (e: 'external-task-dropped', payload: { taskId: string | number, startTime: number, duration?: number, date: string }): void
    (e: 'task-dropped-on-sidebar', payload: { taskId: string | number, event: MouseEvent, target: 'todo' | 'shortcut', date: string }): void
    (e: 'external-task-dropped-on-sidebar', payload: { event: MouseEvent }): void
    (e: 'delete-external-task', payload: {}): void
    (e: 'create-task', payload: { startTime: number, date: string }): void
    (e: 'edit', task: Task): void
    (e: 'add-day'): void
}>()

// Store access for task operations
const tasksStore = useTasksStore()
const headerOffset = ref(0)

// Internal task operation handlers
const handleCreateTask = (payload: { text: string, startTime: number, category: string, date: string }) => {
    tasksStore.createScheduledTask({
        ...payload,
        completed: false,
        duration: 60
    } as any)
}

const handleScheduleTask = (payload: { taskId: string | number, startTime: number, duration: number, date: string }) => {
    // Check if the task is moving to a different date
    const originalTask = allTasks.value.find(t => t.id === payload.taskId)

    if (originalTask && originalTask.date && originalTask.date !== payload.date) {
        // Cross-day move
        tasksStore.moveScheduledTask(
            payload.taskId,
            originalTask.date,
            payload.date,
            { startTime: payload.startTime, duration: payload.duration }
        )
    } else {
        // Same-day update
        tasksStore.updateScheduledTask(payload.taskId, payload.date, { startTime: payload.startTime, duration: payload.duration })
    }
}

const handleDuplicateTask = (payload: { originalTaskId: string | number }) => {
    const original = tasksStore.getTaskById(payload.originalTaskId)
    if (original) {
        const { id, ...taskData } = original
        tasksStore.createScheduledTask(taskData as any)
    }
}

const handleDeleteTask = (payload: { taskId: string | number, date: string }) => {
    tasksStore.deleteScheduledTask(payload.taskId, payload.date)
}

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)

const allTasks = computed(() => Object.values(props.tasksByDate).flat())

const {
    mode,
    activeTaskId,
    currentSnapTime,
    currentSnapDate,
    currentDuration,
    startOperation,
    startExternalDrag: startExternalDragOp,
    handleSlotClick
} = useTaskOperations(
    allTasks,
    emit as any,
    {
        startHour: props.startHour,
        endHour: props.endHour,
        hourHeight: 80,
        dates: toRef(props, 'dates'),
        getContainerRect: () => tasksContainerRef.value?.getBoundingClientRect() || null,
        getScrollTop: () => scrollTop.value,
        activeExternalTask: () => props.activeExternalTask,
        // Wire up internal handlers
        onTaskDropped: handleScheduleTask,
        onCreateTask: handleCreateTask,
        onDuplicateTask: handleDuplicateTask,
        onDeleteTask: handleDeleteTask,
        onExternalTaskDropped: (payload) => emit('external-task-dropped', payload),
        onExternalTaskDroppedOnSidebar: (payload: { event: MouseEvent }) => emit('external-task-dropped-on-sidebar', payload),
        topOffset: headerOffset
    }
)

const { isOverTrash } = useDragState()

watch(isOverTrash, (val) => {
    emit('update:is-over-trash', val)
})

const tasksContainerRef = ref<HTMLElement | null>(null)
const containerRect = ref<DOMRect | null>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)
const dragOffsetXPercent = ref(0)
const dragOffsetY = ref(0)

const updateScroll = () => {
    if (scrollAreaRef.value) {
        scrollTop.value = scrollAreaRef.value.scrollTop
        scrollLeft.value = scrollAreaRef.value.scrollLeft
        updateContainerRect()
    }
}

const updateContainerRect = () => {
    if (tasksContainerRef.value) {
        containerRect.value = tasksContainerRef.value.getBoundingClientRect()
        // Measure header height dynamically
        const headerEl = tasksContainerRef.value.querySelector('.column-header')
        if (headerEl) {
            headerOffset.value = headerEl.clientHeight
        }
    }
}

const onWindowMouseMove = (e: MouseEvent) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
}



type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

const handleStartOperation = (e: MouseEvent, taskId: string | number, opMode: OperationMode, initialRect?: DOMRect) => {
    updateContainerRect()
    updateScroll()

    // Initialize mouse coordinates for immediate teleport rendering
    mouseX.value = e.clientX
    mouseY.value = e.clientY

    // Use initialRect if provided (more reliable), otherwise fallback to currentTarget
    const rect = initialRect || (e.currentTarget as HTMLElement).getBoundingClientRect()

    // Calculate drag offset as percentage of width
    dragOffsetXPercent.value = (e.clientX - rect.left) / rect.width
    dragOffsetY.value = e.clientY - rect.top

    startOperation(e, taskId, opMode)
}

const handleExternalDrag = (e: MouseEvent, task: Task, onStarted?: () => void) => {
    updateContainerRect()
    updateScroll()

    // Initialize mouse coordinates
    mouseX.value = e.clientX
    mouseY.value = e.clientY

    // For external drag, pick a reasonable offset (center)
    dragOffsetXPercent.value = 0.5
    dragOffsetY.value = 20

    startExternalDragOp(e, task, onStarted)
}

watch(activeTaskId, (id) => {
    if (id !== null) {
        updateContainerRect()
        updateScroll()
    }
})

// 2. Layout Logic (Now handled by DayColumn components)

defineExpose({
    startExternalDrag: handleExternalDrag // Expose the new handler
})

const currentTime = ref(new Date())
let timer: any = null
const taskStatuses = ref<Record<string | number, 'past' | 'future' | 'on-air' | null>>({})

const updateTaskStatuses = () => {
    const now = currentTime.value
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()

    allTasks.value.forEach(task => {
        if (task.startTime === null) return

        const taskStartMinutes = task.startTime * 60
        const taskEndMinutes = taskStartMinutes + task.duration

        if (currentTotalMinutes < taskStartMinutes) {
            taskStatuses.value[task.id] = 'future'
        } else if (currentTotalMinutes >= taskStartMinutes && currentTotalMinutes < taskEndMinutes) {
            taskStatuses.value[task.id] = 'on-air'
        } else {
            taskStatuses.value[task.id] = 'past'
        }
    })
}

watch(() => props.tasksByDate, updateTaskStatuses, { immediate: true, deep: true })

const onAddDay = async () => {
    emit('add-day')
    await nextTick()
    if (scrollAreaRef.value) {
        scrollAreaRef.value.scrollTo({
            left: scrollAreaRef.value.scrollWidth,
            behavior: 'smooth'
        })
    }
}


onMounted(() => {
    //updateContainerRect()
    updateTaskStatuses()
    setTimeout(() => {
        timer = setInterval(() => {
            currentTime.value = new Date()
            updateTaskStatuses()
        }, 60000)
    }, (60 - currentTime.value.getSeconds()) * 1000)

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('resize', updateContainerRect)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('resize', updateContainerRect)
})

const timeIndicatorTop = computed(() => {
    const now = currentTime.value
    const currentTotalHours = now.getHours() + now.getMinutes() / 60

    if (currentTotalHours < props.startHour || currentTotalHours > props.endHour) {
        return -100 // Hide if out of range
    }

    return (currentTotalHours - props.startHour) * 80
})

const getDayName = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    return d.toLocaleDateString('en-US', { weekday: 'long' })
}

const getNextDateLabel = computed(() => {
    if (!props.dates.length) return ''
    const lastDate = new Date(props.dates[props.dates.length - 1])
    const nextDate = new Date(lastDate)
    nextDate.setDate(lastDate.getDate() + 1)
    const nextDateStr = nextDate.toISOString().split('T')[0]

    return getDayName(nextDateStr) + ' (' + nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ')'
})

const getTeleportStyle = (task: any) => {
    if (mode.value !== 'drag') return {}
    if (task.id !== activeTaskId.value && activeTaskId.value !== null) return {}
    if (activeTaskId.value === null && task !== props.activeExternalTask) return {}

    const isExternal = activeTaskId.value === null
    const duration = currentDuration.value || task.duration || 60
    const height = (duration / 60) * 80

    // For multi-column, teleporting to body means we need to calculate 
    // the global left position based on the column index.
    const containerRect = tasksContainerRef.value?.getBoundingClientRect()
    if (!containerRect) return {}

    // Find actual column width by querying the first column element
    // This avoids the issue where "Add Day Zone" skews the division
    const firstColumn = tasksContainerRef.value?.querySelector('.day-column-outer')
    const colWidth = firstColumn ? firstColumn.getBoundingClientRect().width : (containerRect.width / props.dates.length)
    //debugger

    // We snap the teleported ghost to the column it's currently over
    let colIndex = 0
    if (currentSnapDate.value) {
        colIndex = props.dates.indexOf(currentSnapDate.value)
    } else {
        // If not over a day, stick to the original day if internal, or centered on mouse if external
        if (isExternal) {
            // Free float near mouse
            const floatWidth = Math.min(colWidth, 240)
            return {
                position: 'fixed' as const,
                top: `${mouseY.value - dragOffsetY.value}px`,
                left: `${mouseX.value - (dragOffsetXPercent.value * floatWidth)}px`,
                width: `${floatWidth}px`,
                height: `${height}px`,
                zIndex: 9999,
                pointerEvents: 'none' as const,
                transform: 'scale(1.02)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }
        }
        colIndex = props.dates.indexOf(task.date)
    }

    if (currentSnapTime.value !== null) {
        // Vertical Snap
        const topViewport = ((currentSnapTime.value - props.startHour) * 80) + (containerRect.top || 0) + headerOffset.value
        const leftViewport = containerRect.left + (colIndex * colWidth)

        return {
            position: 'fixed' as const,
            top: `${topViewport}px`,
            left: `${leftViewport}px`,
            width: `${colWidth}px`, // padding
            height: `${height}px`,
            zIndex: 9999,
            pointerEvents: 'none' as const,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }
    } else {
        // Free float (near mouse)
        const floatWidth = Math.min(colWidth, 240)
        return {
            position: 'fixed' as const,
            top: `${mouseY.value - dragOffsetY.value}px`,
            left: `${mouseX.value - (dragOffsetXPercent.value * floatWidth)}px`,
            width: `${floatWidth}px`,
            height: `${height}px`,
            zIndex: 9999,
            pointerEvents: 'none' as const,
            transform: 'scale(1.02)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            opacity: 0.9
        }
    }
}
</script>

<template>
    <div class="day-view-container">
        <div class="calendar-layout">
            <div class="calendar-scroll-area"
                 ref="scrollAreaRef"
                 @scroll="updateScroll">
                <div class="calendar-grid">
                    <!-- Time Labels (Fixed Axis) -->
                    <div class="time-labels">
                        <div v-for="hour in hours"
                             :key="hour"
                             class="time-label">
                            {{ hour.toString().padStart(2, '0') }}:00
                        </div>
                    </div>

                    <!-- Columnar Content -->
                    <div class="days-wrapper"
                         ref="tasksContainerRef">
                        <div v-for="date in dates"
                             :key="date"
                             class="day-column-outer">
                            <div class="column-header">
                                <span class="day-name">{{ getDayName(date) }}</span>
                                <span class="date-num">{{ date }}</span>
                            </div>

                            <DayColumn :date="date"
                                       :tasks="tasksByDate[date] || []"
                                       :start-hour="startHour"
                                       :end-hour="endHour"
                                       :active-task-id="activeTaskId"
                                       :mode="mode"
                                       :current-snap-time="currentSnapDate === date ? currentSnapTime : null"
                                       :current-duration="currentDuration"
                                       :task-statuses="taskStatuses"
                                       @start-operation="handleStartOperation($event.event, $event.taskId, $event.opMode, $event.initialRect)"
                                       @slot-click="handleSlotClick($event.startTime, 0 /* not used */, date)"
                                       @edit="emit('edit', $event)" />

                            <!-- Per-column Current Time Indicator (Visual Sync) -->
                            <div v-if="timeIndicatorTop >= 0"
                                 class="current-time-line"
                                 :style="{ top: `${timeIndicatorTop + 40}px` }">
                                <div class="time-dot"></div>
                            </div>
                        </div>

                        <!-- Add Day Zone -->
                        <AddDayZone :label="getNextDateLabel"
                                    :is-dragging="activeTaskId !== null || activeExternalTask !== null"
                                    @add-day="onAddDay" />
                    </div>
                </div>

                <!-- Floating Item for Drags (Teleport to Body) -->
                <Teleport to="body"
                          v-if="activeTaskId !== null && mode === 'drag'">
                    <div v-if="allTasks.find(t => t.id === activeTaskId)"
                         class="task-wrapper-absolute is-dragging-teleport"
                         :style="getTeleportStyle(allTasks.find(t => t.id === activeTaskId))">
                        <TaskItem :task="allTasks.find(t => t.id === activeTaskId)!"
                                  :is-dragging="true"
                                  :status="taskStatuses[activeTaskId]" />
                    </div>
                </Teleport>

                <!-- Floating Item for External Drag (Teleport to Body) -->
                <Teleport to="body"
                          v-if="activeExternalTask && activeTaskId === null && mode === 'drag'">
                    <div class="task-wrapper-absolute is-dragging-teleport"
                         :style="getTeleportStyle(activeExternalTask)">
                        <TaskItem :task="activeExternalTask"
                                  :is-dragging="true" />
                    </div>
                </Teleport>
            </div>
        </div>
    </div>
</template>

<style scoped>
.day-view-container {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding: 1.5rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
}

.calendar-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.calendar-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    /* Handle many days */
    position: relative;
    padding-right: 10px;
}

.calendar-grid {
    display: flex;
    position: relative;
    min-height: 100%;
    min-width: fit-content;
}

.time-labels {
    width: 60px;
    flex-shrink: 0;
    margin-top: 40px;
    /* Offset for column headers */
}

.time-label {
    height: 80px;
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    align-items: flex-start;
}

.days-wrapper {
    display: flex;
    flex: 1;
    min-width: 0;
    position: relative;
}

.day-column-outer {
    flex: 1;
    min-width: 200px;
    /* max-width: 500px; */
    width: 20vw;
    display: flex;
    flex-direction: column;
    position: relative;
}

.column-header {
    height: 40px;
    line-height: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    background: var(--bg-card);
    position: sticky;
    inset: 0;
    z-index: 20;
    backdrop-filter: blur(4px);

    /* we should cover timeline */
    width: 120%;
    transform: translateX(-100px);
}

.day-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
}

.date-num {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.current-time-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-urgent);
    z-index: 100;
    pointer-events: none;
    box-shadow: 0 0 10px var(--color-urgent);
}

.time-dot {
    position: absolute;
    left: -4px;
    top: -4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-urgent);
}

.is-dragging-teleport {
    z-index: 9999;
    pointer-events: none;
}
</style>
