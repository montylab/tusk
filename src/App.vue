<script setup lang="ts">
import { ref } from 'vue'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import ShortcutsPile from './components/ShortcutsPile.vue'
import ToDoPile from './components/ToDoPile.vue'
import type { Task } from './types'

// --- State ---
const tasks = ref<Task[]>([
  { id: 1, text: 'Design the UI', completed: false, category: 'Work', startTime: 9, duration: 60 },
  { id: 3, text: 'Client Meeting', completed: false, category: 'Work', startTime: 10, duration: 30 }, 
  { id: 4, text: 'Gym', completed: false, category: 'Personal', startTime: 18.25, duration: 45 },
])

const shortcutTasks = ref<Task[]>([
  { id: 101, text: 'Brainstorming', category: 'Work', duration: 30, completed: false, startTime: null },
  { id: 102, text: 'Code Review', category: 'Work', duration: 45, completed: false, startTime: null },
  { id: 103, text: 'Quick Workout', category: 'Personal', duration: 15, completed: false, startTime: null },
  { id: 104, text: 'Email Batching', category: 'Work', duration: 20, completed: false, startTime: null },
])

const todoTasks = ref<Task[]>([
  { id: 201, text: 'Submit Expense Report', category: 'Work', duration: 15, completed: false, startTime: null },
  { id: 202, text: 'Buy Groceries', category: 'Personal', duration: 45, completed: false, startTime: null },
  { id: 203, text: 'Prepare Slides for Demo', category: 'Urgent', duration: 30, completed: false, startTime: null },
])

// --- Drag State ---
const activeExternalTask = ref<{ source: 'shortcut' | 'todo', task: Task } | null>(null)

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
    
    // 1. Create task in calendar
    tasks.value.push({
        ...task,
        id: taskId,
        startTime,
        duration: duration || task.duration || 60
    })

    // 2. If it was a ToDo, remove from pile
    if (source === 'todo') {
        todoTasks.value = todoTasks.value.filter(t => t.id !== task.id)
    }

    activeExternalTask.value = null
}

const handleExternalTaskDeleted = () => {
    if (!activeExternalTask.value) return
    
    const { source, task } = activeExternalTask.value
    
    // If it was a ToDo, remove from pile (shortcuts are permanent templates)
    if (source === 'todo') {
        todoTasks.value = todoTasks.value.filter(t => t.id !== task.id)
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
        :tasks="tasks" 
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
                :tasks="shortcutTasks" 
                @drag-start="handleExternalDragStart('shortcut', $event.task, $event.event)"
            />
            <ToDoPile 
                :tasks="todoTasks" 
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
