<script
    setup
    lang="ts"
>
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTaskOperations } from '../composables/useTaskOperations'
import { useTaskLayout } from '../composables/useTaskLayout'
import { useTasksStore } from '../stores/tasks'
import { useDragState } from '../composables/useDragState'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const props = withDefaults(defineProps<{
    tasks: Task[]
    startHour?: number
    endHour?: number
    activeExternalTask?: Task | null
}>(), {
    startHour: 6,
    endHour: 22,
    activeExternalTask: null
})

const emit = defineEmits<{
    (e: 'update:is-over-trash', payload: boolean): void
    (e: 'external-task-dropped', payload: { taskId: string | number, startTime: number, duration?: number }): void
    (e: 'task-dropped-on-sidebar', payload: { taskId: string | number, event: MouseEvent, target: 'todo' | 'shortcut' }): void
    (e: 'external-task-dropped-on-sidebar', payload: { event: MouseEvent }): void
    (e: 'delete-external-task', payload: {}): void
    (e: 'create-task', payload: { startTime: number }): void
}>()

// Store access for task operations
const tasksStore = useTasksStore()

// Internal task operation handlers
const handleCreateTask = (payload: { text: string, startTime: number, category: string }) => {
    tasksStore.createScheduledTask({
        ...payload,
        completed: false,
        duration: 60
    } as any)
}

const handleScheduleTask = (payload: { taskId: string | number, startTime: number, duration?: number }) => {
    tasksStore.updateScheduledTask(payload.taskId, tasksStore.currentDate, { startTime: payload.startTime, duration: payload.duration })
}

const handleDuplicateTask = (payload: { originalTaskId: string | number }) => {
    const original = tasksStore.getTaskById(payload.originalTaskId)
    if (original) {
        const { id, ...taskData } = original
        tasksStore.createScheduledTask(taskData as any)
    }
}

const handleDeleteTask = (payload: { taskId: string | number }) => {
    tasksStore.deleteScheduledTask(payload.taskId, tasksStore.currentDate)
}

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)

const {
    mode,
    activeTaskId,
    currentSnapTime,
    currentDuration,
    startOperation,
    startExternalDrag: startExternalDragOp,
    handleSlotClick
} = useTaskOperations(
    () => props.tasks,
    emit as any,
    {
        startHour: props.startHour,
        endHour: props.endHour,
        hourHeight: 80,
        getContainerRect: () => containerRect.value,
        getScrollTop: () => scrollTop.value,
        activeExternalTask: () => props.activeExternalTask,
        // Wire up internal handlers
        onTaskDropped: handleScheduleTask,
        onCreateTask: handleCreateTask,
        onDuplicateTask: handleDuplicateTask,
        onDeleteTask: handleDeleteTask,
        onExternalTaskDropped: (payload) => emit('external-task-dropped', payload),
        onExternalTaskDroppedOnSidebar: (payload: { event: MouseEvent }) => emit('external-task-dropped-on-sidebar', payload)
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
const dragOffsetX = ref(0)

const updateScroll = () => {
    if (scrollAreaRef.value) {
        scrollTop.value = scrollAreaRef.value.scrollTop
        scrollLeft.value = scrollAreaRef.value.scrollLeft
    }
}

const updateContainerRect = () => {
    if (tasksContainerRef.value) {
        containerRect.value = tasksContainerRef.value.getBoundingClientRect()
    }
}

const onWindowMouseMove = (e: MouseEvent) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
}



type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

const handleStartOperation = (e: MouseEvent, taskId: string | number, opMode: OperationMode) => {
    updateContainerRect()
    updateScroll()

    // Calculate drag offset
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragOffsetX.value = e.clientX - rect.left

    startOperation(e, taskId, opMode)
}

const handleExternalDrag = (e: MouseEvent, task: Task) => {
    updateContainerRect()
    updateScroll()

    // For external drag, pick a reasonable offset (e.g. center)
    dragOffsetX.value = 100

    startExternalDragOp(e, task)
}

watch(activeTaskId, (id) => {
    if (id !== null) {
        updateContainerRect()
        updateScroll()
    }
})

// 2. Layout Logic
const { layoutTasks } = useTaskLayout(
    () => props.tasks,
    activeTaskId,
    currentSnapTime,
    currentDuration,
    {
        startHour: props.startHour,
        endHour: props.endHour,
        hourHeight: 80
    }
)

defineExpose({
    startExternalDrag: handleExternalDrag // Expose the new handler
})

const currentTime = ref(new Date())
let timer: any = null
const taskStatuses = ref<Record<string | number, 'past' | 'future' | 'on-air' | null>>({})

const updateTaskStatuses = () => {
    const now = currentTime.value
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()

    props.tasks.forEach(task => {
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

watch(() => props.tasks, updateTaskStatuses, { immediate: true })


onMounted(() => {
    updateContainerRect()
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

const getTeleportStyle = (task: any) => {
    if (mode.value !== 'drag') return {}
    if (task.id !== activeTaskId.value && activeTaskId.value !== null) return {}
    if (activeTaskId.value === null && task !== props.activeExternalTask) return {}

    const isExternal = activeTaskId.value === null

    let top = 0
    let left = 0
    let width = '200px'
    const duration = currentDuration.value || task.duration || 60
    const height = (duration / 60) * 80

    if (currentSnapTime.value !== null && !isExternal) {
        // Snapped position (internal tasks only)
        top = (currentSnapTime.value - props.startHour) * 80
        if (containerRect.value) {
            top += containerRect.value.top - scrollTop.value
            left = containerRect.value.left + 8
            width = `${containerRect.value.width - 16}px`
        }
    } else {
        // Free float (near mouse) - always for external or when not snapped
        top = mouseY.value - 20
        left = mouseX.value - dragOffsetX.value
        width = '240px'
    }

    return {
        position: 'fixed' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: width,
        height: `${height}px`,
        zIndex: 9999,
        pointerEvents: 'none' as const,
        transform: 'scale(1.02)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    }
}
</script>

<template>
    <div class="day-view-container">
        <div class="header">
            <h2>Today's Schedule</h2>
            <p class="instruction">Drag to move/wheel-resize. Drag edges to resize.</p>
        </div>

        <div class="calendar-layout">
            <div class="calendar-scroll-area"
                 ref="scrollAreaRef"
                 @scroll="updateScroll">
                <div class="calendar-grid">
                    <!-- Time Labels -->
                    <div class="time-labels">
                        <div v-for="hour in hours"
                             :key="hour"
                             class="time-label">
                            {{ hour.toString().padStart(2, '0') }}:00
                        </div>
                    </div>

                    <!-- Grid Content -->
                    <div class="grid-content">
                        <div v-for="hour in hours"
                             :key="hour"
                             class="hour-row">
                            <div v-for="q in 4"
                                 :key="q - 1"
                                 class="quarter-slot"
                                 @click="handleSlotClick(hour, q - 1)">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tasks Layer -->
                <div class="tasks-layer">
                    <!-- Spacing to align with grid content (width 60px label + padding) -->
                    <div class="tasks-container"
                         ref="tasksContainerRef">
                        <template v-for="task in layoutTasks"
                                  :key="task.id">
                            <!-- Teleport active dragging task to body to avoid clipping -->
                            <Teleport to="body"
                                      :disabled="task.id !== activeTaskId || mode !== 'drag'">
                                <div class="task-wrapper-absolute"
                                     :class="{ 'is-dragging': task.id === activeTaskId && mode === 'drag' }"
                                     :style="[task.style, getTeleportStyle(task)]"
                                     @mousedown="handleStartOperation($event, task.id, 'drag')">
                                    <!-- Top Handle -->
                                    <div v-if="task.id !== activeTaskId || mode !== 'drag'"
                                         class="resize-handle top"
                                         @mousedown.stop="handleStartOperation($event, task.id, 'resize-top')"></div>

                                    <TaskItem :task="task"
                                              :is-dragging="task.id === activeTaskId && mode === 'drag'"
                                              :is-shaking="task.isOverlapping"
                                              :status="taskStatuses[task.id]" />

                                    <!-- Bottom Handle -->
                                    <div v-if="task.id !== activeTaskId || mode !== 'drag'"
                                         class="resize-handle bottom"
                                         @mousedown.stop="handleStartOperation($event, task.id, 'resize-bottom')"></div>
                                </div>
                            </Teleport>
                        </template>

                        <template v-if="activeExternalTask && currentSnapTime !== null">
                            <div class="task-wrapper-absolute ghost-external"
                                 :style="{
                                    top: `${(currentSnapTime - startHour) * 80}px`,
                                    height: `${((currentDuration || activeExternalTask.duration) / 60) * 80}px`,
                                    left: '0%',
                                    width: 'calc(100% - 8px)',
                                    zIndex: 5,
                                    opacity: 0.3,
                                    pointerEvents: 'none' as const,
                                    padding: '0 4px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '6px'
                                }">
                                <TaskItem :task="activeExternalTask" />
                            </div>
                        </template>

                        <!-- Floating Item for External Drag (Teleport to Body) -->
                        <Teleport to="body"
                                  v-if="activeExternalTask && activeTaskId === null && mode === 'drag'">
                            <div class="task-wrapper-absolute is-dragging"
                                 :style="getTeleportStyle(activeExternalTask)">
                                <TaskItem :task="activeExternalTask"
                                          :is-dragging="true" />
                            </div>
                        </Teleport>

                        <!-- Current Time Indicator -->
                        <div v-if="timeIndicatorTop >= 0"
                             class="current-time-line"
                             :style="{ top: `${timeIndicatorTop}px` }">
                            <div class="time-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.calendar-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 0;
}

.day-view-container {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
}

.header {
    margin-bottom: 2rem;
    text-align: left;
}

.header h2 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.instruction {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.calendar-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    padding-right: 10px;
}

.calendar-grid {
    display: flex;
    position: relative;
}

.time-labels {
    width: 60px;
    flex-shrink: 0;
}

.time-label {
    height: 80px;
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    align-items: flex-start;
    padding-top: 0;
    border-top: 1px solid transparent;
}

.grid-content {
    flex: 1;
    position: relative;
    border-left: 1px solid var(--border-color);
}

.hour-row {
    height: 80px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
}

.quarter-slot {
    flex: 1;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
    cursor: cell;
    transition: background 0.2s;
}

.quarter-slot:last-child {
    border-bottom: none;
}

.quarter-slot:hover {
    background: rgba(255, 255, 255, 0.03);
}

.tasks-layer {
    position: absolute;
    top: 0;
    left: 60px;
    /* offset for labels */
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.tasks-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.task-wrapper-absolute {
    position: absolute;
    pointer-events: auto;
    transition: transform 0.1s, box-shadow 0.2s, opacity 0.2s;
    user-select: none;
}

.task-wrapper-absolute.is-dragging {
    opacity: 0.8;
    z-index: 1000;
}

.resize-handle {
    position: absolute;
    left: 0;
    right: 0;
    height: 6px;
    cursor: ns-resize;
    z-index: 10;
}

.resize-handle.top {
    top: -3px;
}

.resize-handle.bottom {
    bottom: -3px;
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
</style>