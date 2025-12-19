<script setup lang="ts">
import { ref } from 'vue'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import type { Task } from './types'

// --- State ---
const tasks = ref<Task[]>([
  { id: 1, text: 'Design the UI', completed: false, category: 'Work', startTime: 9, duration: 60 },
  { id: 3, text: 'Client Meeting', completed: false, category: 'Work', startTime: 10, duration: 30 }, 
  { id: 4, text: 'Gym', completed: false, category: 'Personal', startTime: 18.25, duration: 45 },
])

// --- Actions ---
const createTask = ({ text, startTime, category }: { text: string, startTime: number, category: string }) => {
  tasks.value.push({
    id: Date.now(),
    text,
    category,
    completed: false,
    startTime: startTime,
    duration: 60 // Default duration 1 hr
  })
}

const scheduleTask = ({ taskId, startTime, duration }: { taskId: number, startTime: number, duration?: number }) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.startTime = startTime
    if (duration) task.duration = duration
  }
}

const duplicateTask = ({ originalTaskId, newTaskId }: { originalTaskId: number, newTaskId: number }) => {
    const original = tasks.value.find(t => t.id === originalTaskId)
    if (original) {
        tasks.value.push({
            ...original,
            id: newTaskId
        })
    }
}

const deleteTask = ({ taskId }: { taskId: number }) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
}

const trashBounds = ref<DOMRect | null>(null)
const isOverTrash = ref(false)
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
        <TrashBasket 
            :active="isOverTrash"
            @update:bounds="trashBounds = $event"
        />
    </aside>
    <main class="main-content">
      <DayView 
        :tasks="tasks" 
        :start-hour="8"
        :end-hour="24"
        :trash-bounds="trashBounds"
        @task-dropped="scheduleTask"
        @create-task="createTask"
        @duplicate-task="duplicateTask"
        @delete-task="deleteTask"
        @update:is-over-trash="isOverTrash = $event"
      />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--bg-dark);
}

.sidebar {
  width: 25%;
  min-width: 200px;
  max-width: 350px;
  border-right: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.2);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}
</style>
