<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { getRandomCategory } from '../utils'

const props = withDefaults(defineProps<{
  tasks: Task[]
  startHour?: number
  endHour?: number
}>(), {
  startHour: 6,
  endHour: 22
})

const emit = defineEmits<{
  (e: 'task-dropped', payload: { taskId: number, startTime: number }): void
  (e: 'create-task', payload: { text: string, startTime: number, category: string }): void
}>()

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)
const containerRef = ref<HTMLElement | null>(null)

// Drag State
const isDragging = ref(false)
const draggedTaskId = ref<number | null>(null)
const initialTaskStartTime = ref<number>(0)
const dragStartY = ref<number>(0)
const currentSnapTime = ref<number | null>(null)

// --- Drag Handlers ---

const startDrag = ({ originalEvent, taskId }: { originalEvent: MouseEvent, taskId: number }) => {
    const task = props.tasks.find(t => t.id === taskId)
    if (!task || task.startTime === null) return

    isDragging.value = true
    draggedTaskId.value = taskId
    initialTaskStartTime.value = task.startTime
    dragStartY.value = originalEvent.clientY

    // Add global listeners
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !containerRef.value) return

    // Calculate delta Y
    const deltaY = e.clientY - dragStartY.value
    
    // Convert pixels to time slots
    // We need to know the height of one hour. 
    // We can query the DOM or assume a fixed height if set in CSS.
    // Let's measure the first hour-row height dynamically.
    const hourRow = containerRef.value.querySelector('.hour-row')
    if (!hourRow) return
    const hourHeight = hourRow.getBoundingClientRect().height
    
    // Pixels per hour
    // Time delta in hours = deltaY / hourHeight
    const deltaHours = deltaY / hourHeight

    // New raw time
    let rawNewTime = initialTaskStartTime.value + deltaHours

    // Snap to nearest 0.25 (15 min)
    let snappedTime = Math.round(rawNewTime * 4) / 4

    // Clamp between boundaries
    snappedTime = Math.max(props.startHour, Math.min(props.endHour, snappedTime))

    currentSnapTime.value = snappedTime
}

const onMouseUp = () => {
    if (isDragging.value && draggedTaskId.value !== null && currentSnapTime.value !== null) {
        if (currentSnapTime.value !== initialTaskStartTime.value) {
             emit('task-dropped', { 
                 taskId: draggedTaskId.value, 
                 startTime: currentSnapTime.value 
             })
        }
    }

    // Reset
    isDragging.value = false
    draggedTaskId.value = null
    currentSnapTime.value = null
    
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
}

onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
})

const handleSlotClick = (hour: number, quarter: number) => {
    if (isDragging.value) return // Don't create on drag releae
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

// --- Render Helpers ---

const getTasksForSlot = (hour: number, quarter: number) => {
  const slotTime = hour + (quarter * 0.25)
  // If we are dragging this task, use the currentSnapTime, otherwise use task.startTime
  return props.tasks.filter(t => {
      if (t.id === draggedTaskId.value && currentSnapTime.value !== null) {
          return currentSnapTime.value === slotTime
      }
      return t.startTime === slotTime
  })
}

// Special check: if we are dragging a task, we shouldn't render it in its OLD slot
// The filter above handles "move visual to new slot", but we need to ensure 
// the old slot doesn't render it if it's being dragged away.
// Actually, `getTasksForSlot` iterates over all tasks. 
// If `t.id === draggedTaskId` we check `currentSnapTime === slotTime`.
// If `t.id !== draggedTaskId` we check `t.startTime === slotTime`.
// This logic works perfectly to "move" the task visually.
</script>

<template>
  <div class="day-view-container" ref="containerRef">
    <div class="header">
      <h2>Today's Schedule</h2>
      <p class="instruction">Click to add. Drag to move (snaps to 15m).</p>
    </div>
    <div class="calendar-grid">
      <div 
        v-for="hour in hours" 
        :key="hour" 
        class="hour-row"
      >
        <div class="time-label">{{ hour }}:00</div>
        <div class="hour-content">
            <!-- 4 Quarters per hour -->
            <div 
                v-for="q in 4" 
                :key="q-1"
                class="quarter-slot"
                @click="handleSlotClick(hour, q-1)"
            >
                <!-- Render tasks in this slot -->
                <div 
                    v-for="task in getTasksForSlot(hour, q-1)"
                    :key="task.id"
                    class="task-wrapper-slot"
                    :class="{ 'dragging': task.id === draggedTaskId }"
                    :style="{ height: (task.duration / 15 * 100) + '%' }" 
                    @click.stop
                >
                    <TaskItem 
                        :task="task" 
                        @task-mousedown="startDrag"
                    />
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

.calendar-grid {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  position: relative; /* Context for absolute drag if needed, but we use slots */
}

.hour-row {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  height: 80px; /* Fixed height is easier for calc, but min-height works if we measure */
  min-height: 80px;
}

.time-label {
  width: 60px;
  padding: 0.5rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: right;
  border-right: 1px solid rgba(255,255,255,0.1);
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
  position: relative;
  cursor: cell;
}

.quarter-slot:last-child {
    border-bottom: none;
}

.quarter-slot:hover {
    background: rgba(255,255,255,0.02);
}

.task-wrapper-slot {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 1px;
    transition: top 0.1s, left 0.1s; /* Smooth visual snap */
}

.task-wrapper-slot.dragging {
    z-index: 100;
    opacity: 0.9;
    pointer-events: none; /* Let clicks pass to window handler */
    transform: scale(1.02);
    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
    transition: none; /* Instant update during drag */
}

/* Ensure TaskItem inside wrapper captures mouse events initially */
.task-wrapper-slot > * {
    pointer-events: auto;
    height: 100%;
}
.task-wrapper-slot.dragging > * {
     pointer-events: none; /* Disable internal events while dragging */
}
</style>
