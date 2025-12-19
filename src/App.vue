<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import ShortcutsPile from './components/ShortcutsPile.vue'
import ToDoPile from './components/ToDoPile.vue'
import type { Task } from './types'
import { useTasksStore } from './stores/tasks'

// Initialize store
const tasksStore = useTasksStore()
const { scheduledTasks } = storeToRefs(tasksStore)

// Load tasks on mount
onMounted(() => {
  tasksStore.loadTasks()
})

// --- Drag State ---
const activeExternalTask = ref<{ source: 'shortcut' | 'todo', task: Task } | null>(null)

// --- Actions ---
const createTask = ({ text, startTime, category }: { text: string, startTime: number, category: string }) => {
  tasksStore.createTask({
    text,
    category,
    completed: false,
    startTime: startTime,
    duration: 60 // Default duration 1 hr
  })
}

const scheduleTask = ({ taskId, startTime, duration }: { taskId: number, startTime: number, duration?: number }) => {
  tasksStore.scheduleTask(taskId, startTime, duration)
}

const duplicateTask = ({ originalTaskId, newTaskId }: { originalTaskId: number, newTaskId: number }) => {
  const original = tasksStore.getTaskById(originalTaskId)
  if (original) {
    // Create a copy without the id (it will be auto-generated)
    const { id, ...taskData } = original
    tasksStore.createTask(taskData)
  }
}

const deleteTask = ({ taskId }: { taskId: number }) => {
  tasksStore.deleteTask(taskId)
}

const trashBounds = ref<DOMRect | null>(null)
const isOverTrash = ref(false)
const dayViewRef = ref<any>(null)

const handleExternalDragStart = (source: 'shortcut' | 'todo', task: Task, event: MouseEvent) => {
  activeExternalTask.value = { source, task }
  // Pass the drag event to DayView so it can initiate the ghost logic
  if (dayViewRef.value) {
    dayViewRef.value.startExternalDrag(event, task)
  }
}

const handleExternalTaskDropped = ({ taskId, startTime, duration }: { taskId: number, startTime: number, duration?: number }) => {
  if (!activeExternalTask.value) return

  const { source, task } = activeExternalTask.value
  
  // 1. Create task in calendar (id will be auto-generated)
  const { id, ...taskData } = task
  tasksStore.createTask({
    ...taskData,
    startTime,
    duration: duration || task.duration || 60,
    isShortcut: false // Remove shortcut flag when scheduling
  })

  // 2. If it was a ToDo, remove from pile
  if (source === 'todo') {
    tasksStore.deleteTask(task.id)
  }

  activeExternalTask.value = null
}

const handleExternalTaskDeleted = () => {
  if (!activeExternalTask.value) return
  
  const { source, task } = activeExternalTask.value
  
  // If it was a ToDo, remove from pile (shortcuts are permanent templates)
  if (source === 'todo') {
    tasksStore.deleteTask(task.id)
  }
  
  activeExternalTask.value = null
}

</script>

<template>
  <div class="app-layout">
    <aside class="sidebar left">
        <TrashBasket 
            :active="isOverTrash"
            @update:bounds="trashBounds = $event"
        />
    </aside>
    
    <main class="main-content">
      <DayView 
        ref="dayViewRef"
        :tasks="scheduledTasks" 
        :start-hour="8"
        :end-hour="24"
        :trash-bounds="trashBounds"
        :active-external-task="activeExternalTask?.task || null"
        @update:is-over-trash="isOverTrash = $event"
        @delete-task="deleteTask($event)"
        @task-dropped="scheduleTask($event)"
        @duplicate-task="duplicateTask($event)"
        @create-task="createTask($event)"
        @external-task-dropped="handleExternalTaskDropped"
        @delete-external-task="handleExternalTaskDeleted"
      />
    </main>

    <aside class="sidebar right">
        <div class="pile-container">
            <ShortcutsPile 
                @drag-start="handleExternalDragStart('shortcut', $event.task, $event.event)"
            />
            <ToDoPile 
                @drag-start="handleExternalDragStart('todo', $event.task, $event.event)"
            />
        </div>
    </aside>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--bg-dark);
}

.sidebar.left {
  width: 15%;
  min-width: 150px;
  max-width: 250px;
  border-right: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.2);
}

.sidebar.right {
  width: 20%;
  min-width: 200px;
  max-width: 300px;
  border-left: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.15);
}

.pile-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.pile-container > * {
    flex: 1;
    min-height: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}
</style>
