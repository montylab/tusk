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
    (e: 'update:calendar-bounds', rect: DOMRect): void
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
    handleSlotClick,
    isOverCalendar
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
        getScrollLeft: () => scrollLeft.value,
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
        const rect = tasksContainerRef.value.getBoundingClientRect()
        containerRect.value = rect
        emit('update:calendar-bounds', rect)
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

    // Use actual capture relative to the sidebar item
    const target = e.target as HTMLElement
    const itemEl = target.closest('.task-item')
    let yOffsetHours = 0
    if (itemEl) {
        const rect = itemEl.getBoundingClientRect()
        // Proportional X offset (0 to 1)
        dragOffsetXPercent.value = (e.clientX - rect.left) / rect.width
        // Fixed Y offset (absolute pixels)
        dragOffsetY.value = e.clientY - rect.top
        yOffsetHours = dragOffsetY.value / 80
    } else {
        dragOffsetXPercent.value = 0.5
        dragOffsetY.value = 20
        yOffsetHours = 20 / 80
    }

    startExternalDragOp(e, task, onStarted, yOffsetHours)
}

watch(activeTaskId, (id) => {
    if (id !== null) {
        updateContainerRect()
        updateScroll()
    }
})

// 2. Layout Logic (Now handled by DayColumn components)

const scrollToTop = () => {
    if (scrollAreaRef.value) {
        scrollAreaRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

defineExpose({
    startExternalDrag: handleExternalDrag,
    scrollToTop
})

const currentTime = ref(new Date())
let timer: any = null
const taskStatuses = ref<Record<string | number, 'past' | 'future' | 'on-air' | null>>({})

const getTaskStatus = (task: Task | Partial<Task>, now: Date): 'past' | 'future' | 'on-air' | null => {
    if (task.startTime === null || task.startTime === undefined || !task.date) return null

    const todayStr = now.toISOString().split('T')[0]
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()
    const taskStartMinutes = task.startTime * 60
    const taskEndMinutes = taskStartMinutes + (task.duration || 60)

    if (task.date > todayStr) return 'future'
    if (task.date < todayStr) return 'past'

    if (currentTotalMinutes < taskStartMinutes) return 'future'
    if (currentTotalMinutes >= taskStartMinutes && currentTotalMinutes < taskEndMinutes) return 'on-air'
    return 'past'
}

const updateTaskStatuses = () => {
    const now = currentTime.value
    allTasks.value.forEach(task => {
        taskStatuses.value[task.id] = getTaskStatus(task, now)
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

// --- Statistics Calculation ---
const formatStatsTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}:${m.toString().padStart(2, '0')}h`
}

const getDayStats = (date: string) => {
    const tasks = props.tasksByDate[date] || []
    let total = 0
    let completed = 0
    let deepTotal = 0
    let deepCompleted = 0

    const now = currentTime.value
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()

    tasks.forEach(t => {
        const status = taskStatuses.value[t.id]
        total += t.duration

        let taskCompletedMinutes = 0
        if (status === 'past') {
            taskCompletedMinutes = t.duration
        } else if (status === 'on-air' && t.startTime !== null) {
            const taskStartMinutes = t.startTime * 60
            taskCompletedMinutes = Math.max(0, Math.min(t.duration, currentTotalMinutes - taskStartMinutes))
        }

        completed += taskCompletedMinutes

        if (t.isDeepWork) {
            deepTotal += t.duration
            deepCompleted += taskCompletedMinutes
        }
    })

    return {
        tasks: `${formatStatsTime(completed)} / ${formatStatsTime(total)}`,
        deep: `${formatStatsTime(deepCompleted)} / ${formatStatsTime(deepTotal)}`,
        hasDeep: deepTotal > 0
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

const activeTask = computed(() => {
    if (activeTaskId.value !== null) {
        return allTasks.value.find(t => t.id === activeTaskId.value) || null
    }
    return props.activeExternalTask
})

const activeTaskPreview = computed<Task | null>(() => {
    const baseTask = activeTask.value
    if (!baseTask) return null

    // Create a copy and merge with current snap/operation state
    return {
        ...baseTask,
        startTime: currentSnapTime.value !== null ? currentSnapTime.value : baseTask.startTime,
        duration: currentDuration.value !== null ? currentDuration.value : (baseTask.duration || 60),
        date: currentSnapDate.value || baseTask.date
    }
})

const activeTaskStatus = computed(() => {
    if (!activeTaskPreview.value) return null
    return getTaskStatus(activeTaskPreview.value, currentTime.value)
})

const mergedTaskStatuses = computed(() => {
    if (activeTaskId.value === null || !activeTaskStatus.value) return taskStatuses.value
    return {
        ...taskStatuses.value,
        [activeTaskId.value]: activeTaskStatus.value
    }
})

const getTeleportStyle = (task: any) => {
    if (mode.value !== 'drag') return {}
    const activeId = activeTaskId.value !== null ? activeTaskId.value : props.activeExternalTask?.id
    if (task.id !== activeId) return {}

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
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                maxHeight: '80px'
            }
        }
        colIndex = props.dates.indexOf(task.date)
    }

    if (currentSnapTime.value !== null && isOverCalendar.value) {
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
        const floatWidth = Math.max(colWidth || 200, 240)
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
                        <div class="column-header">
                            <!-- Time -->
                        </div>
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
                                <div class="header-left">
                                    <span class="day-name">{{ getDayName(date) }}</span>
                                    <span class="date-num">{{ date }}</span>
                                </div>
                                <div class="header-right">
                                    <div class="stat-row"
                                         title="Tasks Process (Completed / Total)">
                                        <i class="pi pi-check-circle"></i>
                                        <span>{{ getDayStats(date).tasks }}</span>
                                    </div>
                                    <div v-if="getDayStats(date).hasDeep"
                                         class="stat-row deep"
                                         title="Deep Work Progress (Completed / Total)">
                                        <i class="pi pi-brain"></i>
                                        <span>{{ getDayStats(date).deep }}</span>
                                    </div>
                                </div>
                            </div>

                            <DayColumn :date="date"
                                       :tasks="tasksByDate[date] || []"
                                       :start-hour="startHour"
                                       :end-hour="endHour"
                                       :active-task-id="activeTaskId"
                                       :mode="mode"
                                       :current-snap-time="currentSnapDate === date ? currentSnapTime : null"
                                       :current-duration="currentDuration"
                                       :task-statuses="mergedTaskStatuses"
                                       @start-operation="handleStartOperation($event.event, $event.taskId, $event.opMode, $event.initialRect)"
                                       @slot-click="handleSlotClick($event.startTime, 0 /* not used */, date)"
                                       @edit="emit('edit', $event)" />

                            <!-- Per-column Current Time Indicator (Visual Sync) -->
                            <div v-if="timeIndicatorTop >= 0 && getDayName(date) === 'Today'"
                                 class="current-time-line"
                                 :style="{ top: `${timeIndicatorTop + headerOffset}px` }">
                                <div class="time-dot"></div>
                            </div>
                        </div>

                        <!-- Add Day Zone -->
                        <AddDayZone :label="getNextDateLabel"
                                    :is-dragging="activeTaskId !== null || activeExternalTask !== null"
                                    @add-day="onAddDay" />
                    </div>
                </div>

                <!-- Floating Item for Interaction (Teleport to Body) -->
                <Teleport to="body"
                          v-if="activeTaskPreview && mode === 'drag'">
                    <div class="task-wrapper-absolute is-dragging-teleport"
                         :style="getTeleportStyle(activeTaskPreview)">
                        <TaskItem :task="activeTaskPreview"
                                  :is-dragging="true"
                                  :status="activeTaskStatus" />
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
    padding-top: .5rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
    overflow: hidden;
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
    /* padding-right: 10px; */
}

.calendar-scroll-area::-webkit-scrollbar {
    scrollbar-color: red;
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
    /* margin-top: 40px; */
    /* Offset for column headers */
}

.time-label {
    height: 80px;
    padding: 0 1rem;
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
    height: 70px;
    padding: 0 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    background: color-mix(in srgb, var(--bg-card) 60%, transparent);
    position: sticky;
    inset: 0;
    z-index: 20;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
}

.column-header:hover {
    background: color-mix(in srgb, var(--bg-card) 85%, transparent);
}

.header-left,
.header-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.header-left {
    align-items: flex-start;
}

.header-right {
    align-items: flex-end;
}

.stat-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-muted);
}

.stat-row i {
    font-size: 0.6rem;
    opacity: 0.7;
}

.stat-row.deep {
    color: #a78bfa;
    /* Light purple to match brain theme */
}

.stat-row.deep i {
    opacity: 1;
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
    transition: max-height 0.4s ease;
    max-height: 800px;
}
</style>
