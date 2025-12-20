<script setup lang="ts">
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
  (e: 'external-task-dropped', payload: { taskId: number, startTime: number, duration?: number }): void
  (e: 'task-dropped-on-sidebar', payload: { taskId: number, event: MouseEvent }): void
  (e: 'external-task-dropped-on-sidebar', payload: { event: MouseEvent }): void
  (e: 'delete-external-task', payload: {}): void
}>()

// Store access for task operations
const tasksStore = useTasksStore()

// Internal task operation handlers
const handleCreateTask = (payload: { text: string, startTime: number, category: string }) => {
  tasksStore.createTask({
    ...payload,
    completed: false,
    duration: 60
  })
}

const handleScheduleTask = (payload: { taskId: number, startTime: number, duration?: number }) => {
  tasksStore.scheduleTask(payload.taskId, payload.startTime, payload.duration)
}

const handleDuplicateTask = (payload: { originalTaskId: number }) => {
  const original = tasksStore.getTaskById(payload.originalTaskId)
  if (original) {
    const { id, ...taskData } = original
    tasksStore.createTask(taskData)
  }
}

const handleDeleteTask = (payload: { taskId: number }) => {
  tasksStore.deleteTask(payload.taskId)
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

const onWindowMouseUp = () => {
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
}

type OperationMode = 'none' | 'drag' | 'resize-top' | 'resize-bottom'

const handleStartOperation = (e: MouseEvent, taskId: number, opMode: OperationMode) => {
    if (opMode === 'drag') {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        dragOffsetX.value = e.clientX - rect.left
        mouseX.value = e.clientX
        mouseY.value = e.clientY
        window.addEventListener('mousemove', onWindowMouseMove)
        window.addEventListener('mouseup', onWindowMouseUp)
    }
    startOperation(e, taskId, opMode)
}

const handleExternalDrag = (e: MouseEvent, task: Task) => {
    // For external tasks, calculate offset relative to the item being clicked
    updateContainerRect()
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    dragOffsetX.value = e.clientX - rect.left
    
    mouseX.value = e.clientX
    mouseY.value = e.clientY
    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
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

// 3. Coordinate External Drag
defineExpose({
    startExternalDrag: handleExternalDrag // Expose the new handler
})

const currentTime = ref(new Date())
let timer: any = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const getTaskStatus = (task: Task) => {
  if (task.startTime === null) return null
  
  const now = currentTime.value
  const currentTotalHours = now.getHours() + now.getMinutes() / 60
  
  const taskStart = task.startTime
  const taskEnd = task.startTime + (task.duration / 60)
  
  if (currentTotalHours < taskStart) return 'future'
  if (currentTotalHours >= taskEnd) return 'past'
  return 'on-air'
}

const timeIndicatorTop = computed(() => {
  const now = currentTime.value
  const currentTotalHours = now.getHours() + now.getMinutes() / 60
  
  if (currentTotalHours < props.startHour || currentTotalHours > props.endHour) {
    return -100 // Hide if out of range
  }
  
  return (currentTotalHours - props.startHour) * 80
})

const getTeleportStyle = (task: any) => {
    const isInternalDrag = activeTaskId.value !== null && mode.value === 'drag' && task.id === activeTaskId.value;
    const isExternalDrag = activeTaskId.value === null && mode.value === 'drag' && props.activeExternalTask && task.id === props.activeExternalTask.id;

    if (!isInternalDrag && !isExternalDrag) {
        return {};
    }

    const freeLeft = mouseX.value - dragOffsetX.value;
    const freeTop = mouseY.value - 20;

    if (isExternalDrag) {
        // External tasks always follow mouse freely (ghost handled snapped position)
        return {
            position: 'fixed' as const,
            top: freeTop + 'px',
            left: freeLeft + 'px',
            width: '180px',
            zIndex: 9999,
            pointerEvents: 'none' as const,
            opacity: 0.7,
            transition: 'none'
        };
    }

    // Internal Drag Snapping (uses task.style from layout engine)
    if (!containerRect.value || !task.style) return {};

    const snappedLeft = containerRect.value.left + (parseFloat(task.style.left) / 100 * containerRect.value.width);
    const pixelWidth = (parseFloat(task.style.width) / 100 * containerRect.value.width);
    const threshold = 60;
    const isInsideSnapRange = Math.abs(freeLeft - snappedLeft) < threshold;
    const finalLeft = isInsideSnapRange ? snappedLeft : freeLeft;
    const finalTop = parseFloat(task.style.top) + containerRect.value.top - scrollTop.value;

    return {
        position: 'fixed' as const,
        top: finalTop + 'px',
        left: finalLeft + 'px',
        width: pixelWidth + 'px',
        zIndex: 9999,
        pointerEvents: 'none' as const,
        opacity: 0.5,
        transition: isInsideSnapRange ? 'left 0.1s ease-out' : 'none'
    };
};
</script>

<template>
  <div class="day-view-container">
    <div class="header">
      <h2>Today's Schedule</h2>
      <p class="instruction">Drag to move/wheel-resize. Drag edges to resize.</p>
    </div>
    <div class="calendar-layout">
        <div class="calendar-scroll-area" ref="scrollAreaRef" @scroll="updateScroll">
        <div class="calendar-content">
            <!-- Background Grid Layer -->
            <div class="grid-layer">
                 <div 
                    v-for="hour in hours" 
                    :key="hour" 
                    class="hour-row"
                >
                    <div class="time-label">{{ hour }}:00</div>
                    <div class="hour-content">
                        <div
                            v-for="q in 4" 
                            :key="q-1"
                            class="quarter-slot"
                            @click="handleSlotClick(hour, q-1)"
                        ></div>
                    </div>
                </div>
            </div>
            
            <!-- Tasks Layer -->
            <div class="tasks-layer">
                <!-- Spacing to align with grid content (width 60px label + padding) -->
                <div class="tasks-container" ref="tasksContainerRef">
                     <template v-for="task in layoutTasks" :key="task.id">
                        <!-- Teleport active dragging task to body to avoid clipping -->
                        <Teleport to="body" :disabled="task.id !== activeTaskId || mode !== 'drag'">
                            <div 
                                class="task-wrapper-absolute"
                                :class="{ 'is-dragging': task.id === activeTaskId && mode === 'drag' }"
                                :style="[task.style, getTeleportStyle(task)]"
                                @mousedown="handleStartOperation($event, task.id, 'drag')"
                            >
                                <!-- Top Handle -->
                                <div v-if="task.id !== activeTaskId || mode !== 'drag'" class="resize-handle top" @mousedown.stop="handleStartOperation($event, task.id, 'resize-top')"></div>
                                
                                <TaskItem 
                                    :task="task" 
                                    :is-dragging="task.id === activeTaskId && mode === 'drag'"
                                    :is-shaking="task.isOverlapping"
                                    :status="getTaskStatus(task)"
                                />
                                
                                <!-- Bottom Handle -->
                                <div v-if="task.id !== activeTaskId || mode !== 'drag'" class="resize-handle bottom" @mousedown.stop="handleStartOperation($event, task.id, 'resize-bottom')"></div>
                            </div>
                        </Teleport>
                     </template>

                     <template v-if="activeExternalTask && currentSnapTime !== null">
                        <div 
                            class="task-wrapper-absolute ghost-external"
                            :style="{
                                top: `${(currentSnapTime - startHour) * 80}px`,
                                height: `${((currentDuration || activeExternalTask.duration) / 60) * 80}px`,
                                left: '0%',
                                width: 'calc(100% - 8px)',
                                zIndex: 5,
                                opacity: 0.3,
                                pointerEvents: 'none',
                                padding: '0 4px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '6px'
                            }"
                        >
                            <TaskItem :task="activeExternalTask" />
                        </div>
                     </template>

                     <!-- Floating Item for External Drag (Teleport to Body) -->
                     <Teleport to="body" v-if="activeExternalTask && activeTaskId === null && mode === 'drag'">
                        <div 
                            class="task-wrapper-absolute is-dragging"
                            :style="getTeleportStyle(activeExternalTask)"
                        >
                            <TaskItem 
                                :task="activeExternalTask" 
                                :is-dragging="true"
                            />
                        </div>
                     </Teleport>

                     <!-- Current Time Indicator -->
                     <div 
                        v-if="timeIndicatorTop >= 0"
                        class="current-time-line"
                        :style="{ top: `${timeIndicatorTop}px` }"
                     >
                        <div class="time-dot"></div>
                     </div>
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
  width: 100%;
  user-select: none;
}

.header {
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.header h2 {
  font-size: 1.8rem;
  color: var(--primary);
}

.instruction {
    color: var(--text-muted);
    font-size: 0.9rem;
}

.calendar-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
}

.calendar-content {
    position: relative;
    /* Height will define scroll. Grid items define height. */
}

/* Grid Layer */
.grid-layer {
    width: 100%;
}

.hour-row {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  height: 80px; 
  box-sizing: border-box;
}

.time-label {
  width: 60px;
  padding: 0.5rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: right;
  border-right: 1px solid rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.hour-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quarter-slot {
  flex: 1; 
  border-bottom: 1px dotted rgba(255,255,255,0.05);
  cursor: cell;
}
.quarter-slot:last-child {
    border-bottom: none;
}
.quarter-slot:hover {
    background: rgba(255,255,255,0.02);
}

/* Tasks Layer */
.tasks-layer {
    position: absolute;
    top: 0;
    left: 60px; /* Offset for time label */
    right: 0;
    bottom: 0;
    pointer-events: none; /* Let clicks pass to grid if no task */
}

.tasks-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.task-wrapper-absolute {
    position: absolute;
    width: 100%;
    z-index: 10;
    padding: 0 4px;
    box-sizing: border-box;
    transition: transform 0.1s ease, width 0.1s ease, left 0.1s ease;
    pointer-events: auto;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.task-wrapper-absolute.is-dragging {
    opacity: 0.5;
    transition: none;
}

/* Handles */
.resize-handle {
    position: absolute;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
    z-index: 20;
}
.resize-handle:hover {
    background: rgba(255,255,255,0.2);
}
.resize-handle.top { top: -4px; }
.resize-handle.bottom { bottom: -4px; }

/* Current Time Indicator */
.current-time-line {
    position: absolute;
    left: -60px; /* Extend to time label area */
    right: 0;
    height: 2px;
    background: #ff4b1f; /* Vibrant red */
    z-index: 100;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(255, 75, 31, 0.4);
}

.current-time-line::after {
    content: '';
    position: absolute;
    left: 60px;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, #ff4b1f, transparent);
    top: 0;
}

.time-dot {
    position: absolute;
    left: 56px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: #ff4b1f;
    border-radius: 50%;
    border: 2px solid var(--bg-card);
    box-shadow: 0 0 10px rgba(255, 75, 31, 0.8);
    z-index: 101;
}

.time-dot::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    background: rgba(255, 75, 31, 0.2);
    animation: ripple 2s infinite ease-out;
}

@keyframes ripple {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
}
</style>
```