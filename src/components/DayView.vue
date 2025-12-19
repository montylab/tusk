<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTaskOperations } from '../composables/useTaskOperations'
import { useTaskLayout } from '../composables/useTaskLayout'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  tasks: Task[]
  startHour?: number
  endHour?: number
  trashBounds?: DOMRect | null
}>(), {
  startHour: 6,
  endHour: 22,
  trashBounds: null
})

const emit = defineEmits<{
  (e: 'task-dropped', payload: { taskId: number, startTime: number, duration: number }): void
  (e: 'create-task', payload: { text: string, startTime: number, category: string }): void
  (e: 'duplicate-task', payload: { originalTaskId: number, newTaskId: number }): void
  (e: 'delete-task', payload: { taskId: number }): void
  (e: 'update:is-over-trash', value: boolean): void
}>()

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)

// 1. Interaction Logic
const { 
    mode, 
    activeTaskId, 
    currentSnapTime, 
    currentDuration, 
    isOverTrash,
    startOperation, 
    handleSlotClick 
} = useTaskOperations(() => props.tasks, emit, { 
    startHour: props.startHour, 
    endHour: props.endHour,
    hourHeight: 80,
    getTrashBounds: () => props.trashBounds
})

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
        updateContainerRect()
        const task = layoutTasks.value.find(t => t.id === taskId)
        if (task && containerRect.value) {
            const taskLeft = containerRect.value.left + (parseFloat(task.style.left) / 100 * containerRect.value.width)
            dragOffsetX.value = e.clientX - taskLeft
            
            mouseX.value = e.clientX
            mouseY.value = e.clientY
            window.addEventListener('mousemove', onWindowMouseMove)
            window.addEventListener('mouseup', onWindowMouseUp)
        }
    }
    startOperation(e, taskId, opMode)
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

const getTeleportStyle = (task: any) => {
    if (task.id !== activeTaskId.value || mode.value !== 'drag' || !containerRect.value) {
        return {};
    }

    const freeLeft = mouseX.value - dragOffsetX.value;
    const snappedLeft = containerRect.value.left + (parseFloat(task.style.left) / 100 * containerRect.value.width);
    
    // Threshold for snapping (60px)
    const threshold = 60;
    const isInsideSnapRange = Math.abs(freeLeft - snappedLeft) < threshold;
    const finalLeft = isInsideSnapRange ? snappedLeft : freeLeft;

    return {
        position: 'fixed' as const,
        // Vertical is always snapped to grid
        top: (parseFloat(task.style.top) + containerRect.value.top - scrollTop.value) + 'px',
        left: finalLeft + 'px',
        width: (parseFloat(task.style.width) / 100 * containerRect.value.width) + 'px',
        zIndex: 9999,
        pointerEvents: 'none' as const,
        opacity: 0.5,
        // Add a smooth transition only for the horizontal snap
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
                                />
                                
                                <!-- Bottom Handle -->
                                <div v-if="task.id !== activeTaskId || mode !== 'drag'" class="resize-handle bottom" @mousedown.stop="handleStartOperation($event, task.id, 'resize-bottom')"></div>
                            </div>
                        </Teleport>
                     </template>
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
</style>
```