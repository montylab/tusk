<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTaskOperations } from '../composables/useTaskOperations'
import { useTaskLayout } from '../composables/useTaskLayout'

const props = withDefaults(defineProps<{
  tasks: Task[]
  startHour?: number
  endHour?: number
}>(), {
  startHour: 6,
  endHour: 22
})

const emit = defineEmits<{
  (e: 'task-dropped', payload: { taskId: number, startTime: number, duration: number }): void
  (e: 'create-task', payload: { text: string, startTime: number, category: string }): void
}>()

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)

// 1. Interaction Logic
const { 
    mode, 
    activeTaskId, 
    currentSnapTime, 
    currentDuration, 
    startOperation, 
    handleSlotClick 
} = useTaskOperations(props.tasks, emit, { 
    startHour: props.startHour, 
    endHour: props.endHour,
    hourHeight: 80 
})

// 2. Layout Logic
const { layoutTasks } = useTaskLayout(
    props.tasks, 
    activeTaskId, 
    currentSnapTime, 
    currentDuration, 
    { 
        startHour: props.startHour, 
        endHour: props.endHour,
        hourHeight: 80
    }
)
</script>

<template>
  <div class="day-view-container">
    <div class="header">
      <h2>Today's Schedule</h2>
      <p class="instruction">Drag to move/wheel-resize. Drag edges to resize.</p>
    </div>
    <div class="calendar-scroll-area">
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
                <div class="tasks-container">
                     <div 
                        v-for="task in layoutTasks"
                        :key="task.id"
                        class="task-wrapper-absolute"
                        :style="task.style"
                        @mousedown="startOperation($event, task.id, 'drag')"
                    >
                        <!-- Top Handle -->
                        <div class="resize-handle top" @mousedown.stop="startOperation($event, task.id, 'resize-top')"></div>
                        
                        <TaskItem 
                            :task="task" 
                            :is-dragging="task.id === activeTaskId && mode === 'drag'"
                            :is-shaking="task.isOverlapping"
                        />
                        
                        <!-- Bottom Handle -->
                        <div class="resize-handle bottom" @mousedown.stop="startOperation($event, task.id, 'resize-bottom')"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
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
    pointer-events: auto;
    padding: 1px;
    transition: width 0.2s, left 0.2s, top 0.05s, height 0.05s;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
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
