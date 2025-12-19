<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import ShortcutsPile from './components/ShortcutsPile.vue'
import ToDoPile from './components/ToDoPile.vue'
import { useTasksStore } from './stores/tasks'
import { useExternalDrag } from './composables/useExternalDrag'

// Initialize store
const tasksStore = useTasksStore()
const { scheduledTasks } = storeToRefs(tasksStore)

// Load tasks on mount
onMounted(() => {
  tasksStore.loadTasks()
})

// UI state
const trashBounds = ref<DOMRect | null>(null)
const todoPileBounds = ref<DOMRect | null>(null)
const shortcutPileBounds = ref<DOMRect | null>(null)

const isOverTrash = ref(false)
const isOverTodo = ref(false)
const isOverShortcut = ref(false)

const dayViewRef = ref<any>(null)

// External drag handling
const {
  activeExternalTask,
  handleExternalDragStart,
  handleExternalTaskDropped,
  handleExternalTaskDeleted
} = useExternalDrag(dayViewRef)

// Reverse drag-and-drop detection
const checkCollision = (e: MouseEvent) => {
  if (!todoPileBounds.value || !shortcutPileBounds.value) return

  const check = (bounds: DOMRect) => {
    return e.clientX >= bounds.left &&
           e.clientX <= bounds.right &&
           e.clientY >= bounds.top &&
           e.clientY <= bounds.bottom
  }

  isOverTodo.value = check(todoPileBounds.value)
  isOverShortcut.value = check(shortcutPileBounds.value)
}

const handleCalendarTaskDropped = (payload: { taskId: number, event: MouseEvent }) => {
  // Perform one final collision check at drop position
  checkCollision(payload.event)

  if (isOverTodo.value) {
    tasksStore.convertToTodo(payload.taskId)
  } else if (isOverShortcut.value) {
    tasksStore.convertToShortcut(payload.taskId)
  }
}

const handleExternalTaskSidebarDrop = (payload: { event: MouseEvent }) => {
  if (!activeExternalTask.value) return
  
  // 1. Perform final collision check
  checkCollision(payload.event)
  
  const { source, task } = activeExternalTask.value
  
  // 2. Handle the transfer
  if (isOverTodo.value && source === 'shortcut') {
    // Shortcut -> To-Do: Just create a normal task from the shortcut
    tasksStore.createTask({
      ...task,
      isShortcut: false,
      startTime: null
    })
  } else if (isOverShortcut.value && source === 'todo') {
    // To-Do -> Shortcut: Convert existing to-do to shortcut
    tasksStore.convertToShortcut(task.id)
  }
  
  // 3. Clear the active drag state
  activeExternalTask.value = null
}

// Global mouse tracking during calendar drag
watch(isOverTrash, (val) => {
  if (!val) {
    // If not over trash, reset other highlights to allow checkCollision to take over
    isOverTodo.value = false
    isOverShortcut.value = false
  }
})

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
        :is-over-sidebar="isOverTodo || isOverShortcut"
        @update:is-over-trash="isOverTrash = $event"
        @external-task-dropped="handleExternalTaskDropped"
        @delete-external-task="handleExternalTaskDeleted"
        @task-over-sidebar="checkCollision($event)"
        @task-dropped-on-sidebar="handleCalendarTaskDropped($event)"
        @external-task-dropped-on-sidebar="handleExternalTaskSidebarDrop($event)"
      />
    </main>

    <aside class="sidebar right">
        <div class="pile-container">
            <ShortcutsPile 
                :is-highlighted="isOverShortcut"
                @update:bounds="shortcutPileBounds = $event"
                @drag-start="handleExternalDragStart('shortcut', $event.task, $event.event)"
            />
            <ToDoPile 
                :is-highlighted="isOverTodo"
                @update:bounds="todoPileBounds = $event"
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
