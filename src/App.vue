<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import TaskPile from './components/TaskPile.vue'
import { useTasksStore } from './stores/tasks'
import { useExternalDrag } from './composables/useExternalDrag'
import { useDragState } from './composables/useDragState'

// Initialize store
const tasksStore = useTasksStore()
const { scheduledTasks, todoTasks, shortcutTasks } = storeToRefs(tasksStore)

// Load tasks on mount
onMounted(() => {
  tasksStore.loadTasks()
})

// Shared drag state
const { 
  trashBounds, 
  todoBounds, 
  shortcutBounds, 
  isOverTrash, 
  isOverTodo, 
  isOverShortcut 
} = useDragState()

const todoInsertionIndex = ref<number | null>(null)
const shortcutInsertionIndex = ref<number | null>(null)

// Reference to DayView for external drag initiation
const dayViewRef = ref<any>(null)

// External drag handling
const {
  activeExternalTask,
  handleExternalDragStart,
  handleExternalTaskDropped,
  handleExternalTaskDeleted
} = useExternalDrag(dayViewRef)

const handleCalendarTaskDropped = (payload: { taskId: number, event: MouseEvent }) => {
  if (isOverTodo.value) {
    tasksStore.convertToTodo(payload.taskId)
    if (todoInsertionIndex.value !== null) {
      tasksStore.reorderTask(payload.taskId, todoInsertionIndex.value, 'todo')
    }
  } else if (isOverShortcut.value) {
    tasksStore.convertToShortcut(payload.taskId)
    if (shortcutInsertionIndex.value !== null) {
      tasksStore.reorderTask(payload.taskId, shortcutInsertionIndex.value, 'shortcut')
    }
  }
  
  // Cleanup indices
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}

const handleExternalTaskSidebarDrop = () => {
  if (!activeExternalTask.value) return
  
  const { source, task } = activeExternalTask.value
  
  // 2. Handle the transfer
  if (isOverTodo.value) {
    if (source === 'shortcut') {
      // Shortcut -> To-Do (Clone as new task)
      const newTask = tasksStore.createTask({
        ...task,
        isShortcut: false,
        startTime: null
      })
      if (todoInsertionIndex.value !== null) {
        tasksStore.reorderTask(newTask.id, todoInsertionIndex.value, 'todo')
      }
    } else if (source === 'todo' && todoInsertionIndex.value !== null) {
      // Internal To-Do reorder: find original index and adjust target
      const oldIndex = tasksStore.todoTasks.findIndex(t => t.id === task.id)
      let targetIndex = todoInsertionIndex.value
      if (oldIndex !== -1 && targetIndex > oldIndex) {
        targetIndex -= 1
      }
      tasksStore.reorderTask(task.id, targetIndex, 'todo')
    }
  } else if (isOverShortcut.value) {
    if (source === 'todo') {
      // To-Do -> Shortcut
      tasksStore.convertToShortcut(task.id)
      if (shortcutInsertionIndex.value !== null) {
        tasksStore.reorderTask(task.id, shortcutInsertionIndex.value, 'shortcut')
      }
    } else if (source === 'shortcut' && shortcutInsertionIndex.value !== null) {
      // Internal Shortcut reorder: find original index and adjust target
      const oldIndex = tasksStore.shortcutTasks.findIndex(t => t.id === task.id)
      let targetIndex = shortcutInsertionIndex.value
      if (oldIndex !== -1 && targetIndex > oldIndex) {
        targetIndex -= 1
      }
      tasksStore.reorderTask(task.id, targetIndex, 'shortcut')
    }
  }
  
  // 3. Clear the active drag state and indices
  activeExternalTask.value = null
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}


const handleExternalTaskDeletedWrapper = () => {
  handleExternalTaskDeleted()
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
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
        :active-external-task="activeExternalTask?.task || null"
        @update:is-over-trash="isOverTrash = $event"
        @external-task-dropped="handleExternalTaskDropped"
        @delete-external-task="handleExternalTaskDeletedWrapper"
        @task-dropped-on-sidebar="handleCalendarTaskDropped($event)"
        @external-task-dropped-on-sidebar="handleExternalTaskSidebarDrop"
      />
    </main>

    <aside class="sidebar right">
        <div class="pile-container">
            <TaskPile 
                title="Shortcuts"
                :tasks="shortcutTasks"
                list-type="shortcut"
                :is-highlighted="isOverShortcut"
                :active-task-id="activeExternalTask?.task.id"
                :insertion-index="shortcutInsertionIndex"
                @update:bounds="shortcutBounds = $event"
                @update:insertion-index="shortcutInsertionIndex = $event"
                @drag-start="handleExternalDragStart('shortcut', $event.task, $event.event)"
            />
            <TaskPile 
                title="To Do"
                :tasks="todoTasks"
                list-type="todo"
                :is-highlighted="isOverTodo"
                :active-task-id="activeExternalTask?.task.id"
                :insertion-index="todoInsertionIndex"
                @update:bounds="todoBounds = $event"
                @update:insertion-index="todoInsertionIndex = $event"
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
