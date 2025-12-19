<script setup lang="ts">
import { ref } from 'vue'
import DayView from './components/DayView.vue'
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
</script>

<template>
  <div class="app-layout">
    <main class="main-content">
      <DayView 
        :tasks="tasks" 
        :start-hour="8"
        :end-hour="24"
        @task-dropped="scheduleTask"
        @create-task="createTask"
      />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  max-width: 1000px;
  height: 95vh;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
