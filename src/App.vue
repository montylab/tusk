<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import DayView from './components/DayView.vue'
import TrashBasket from './components/TrashBasket.vue'
import TaskPile from './components/TaskPile.vue'
import { useTasksStore } from './stores/tasks'
import { useUserStore } from './stores/user'
import { useExternalDrag } from './composables/useExternalDrag'
import { useDragState } from './composables/useDragState'

// Initialize stores
const tasksStore = useTasksStore()
const userStore = useUserStore()
const { scheduledTasks, todoTasks, shortcutTasks } = storeToRefs(tasksStore)
const { user, loading: authLoading } = storeToRefs(userStore)

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

const handleCalendarTaskDropped = (payload: { taskId: string | number, event: MouseEvent, target: 'todo' | 'shortcut' }) => {
  if (payload.target === 'todo') {
    tasksStore.moveCalendarToTodo(payload.taskId, tasksStore.currentDate)
    if (todoInsertionIndex.value !== null) {
      tasksStore.reorderTodo(payload.taskId, todoInsertionIndex.value)
    }
  } else if (payload.target === 'shortcut') {
    tasksStore.moveCalendarToShortcut(payload.taskId, tasksStore.currentDate)
    if (shortcutInsertionIndex.value !== null) {
      tasksStore.reorderShortcut(payload.taskId, shortcutInsertionIndex.value)
    }
  }
  
  // Cleanup indices
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}

const handleExternalTaskSidebarDrop = async () => {
  if (!activeExternalTask.value) return
  
  const { source, task } = activeExternalTask.value
  
  // 2. Handle the transfer
  if (isOverTodo.value) {
    if (source === 'shortcut') {
      // Shortcut -> To-Do (Clone as new task)
      const newTask: any = await tasksStore.copyShortcutToTodo(task.id)
      if (newTask && todoInsertionIndex.value !== null) {
        tasksStore.reorderTodo(newTask.id, todoInsertionIndex.value)
      }
    } else if (source === 'todo' && todoInsertionIndex.value !== null) {
      // Internal To-Do reorder: find original index and adjust target
      const oldIndex = tasksStore.todoTasks.findIndex(t => t.id === task.id)
      let targetIndex = todoInsertionIndex.value
      if (oldIndex !== -1 && targetIndex > oldIndex) {
        targetIndex -= 1
      }
      tasksStore.reorderTodo(task.id, targetIndex)
    }
  } else if (isOverShortcut.value) {
    if (source === 'todo') {
      // To-Do -> Shortcut (Move/Convert)
      await tasksStore.moveTodoToShortcut(task.id)
      if (shortcutInsertionIndex.value !== null) {
        tasksStore.reorderShortcut(task.id, shortcutInsertionIndex.value)
      }
    } else if (source === 'shortcut' && shortcutInsertionIndex.value !== null) {
      // Internal Shortcut reorder: find original index and adjust target
      const oldIndex = tasksStore.shortcutTasks.findIndex(t => t.id === task.id)
      let targetIndex = shortcutInsertionIndex.value
      if (oldIndex !== -1 && targetIndex > oldIndex) {
        targetIndex -= 1
      }
      tasksStore.reorderShortcut(task.id, targetIndex)
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
    <aside class="sidebar left" v-if="user">
        <div class="user-info">
          <img v-if="user.photoURL" :src="user.photoURL" class="avatar" />
          <span class="user-name">{{ user.displayName || user.email }}</span>
          <button @click="userStore.logout" class="logout-btn">Logout</button>
        </div>
        <TrashBasket 
            :active="isOverTrash"
            @update:bounds="trashBounds = $event"
        />
    </aside>
    
    <main class="main-content">
      <div v-if="authLoading" class="loading-overlay">
        <div class="loader"></div>
        <p>Checking authentication...</p>
      </div>

      <div v-else-if="!user" class="login-screen">
        <div class="login-card">
          <h1>TaskTracker</h1>
          <p>Organize your day with precision</p>
          <button @click="userStore.login" class="login-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Login with Google
          </button>
        </div>
      </div>

      <DayView 
        v-else
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

    <aside class="sidebar right" v-if="user">
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
#app {
  width: 100%;
}

.app-layout {
  display: flex;
  width: 100%;
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

.user-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-light);
  text-align: center;
  word-break: break-word;
}

.logout-btn {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 69, 58, 0.2);
  border-color: #ff453a;
}

.loading-overlay, .login-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.login-card {
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.login-card h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, #aaa 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-card p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.login-btn img {
  width: 20px;
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
