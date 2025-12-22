<script
  setup
  lang="ts"
>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import DayView from '../components/DayView.vue'
import TrashBasket from '../components/TrashBasket.vue'
import TaskPile from '../components/TaskPile.vue'
import TaskEditorPopup from '../components/TaskEditorPopup.vue'
import { useTasksStore } from '../stores/tasks'
import { useExternalDrag } from '../composables/useExternalDrag'
import { useDragState } from '../composables/useDragState'
import type { Task } from '../types'

const route = useRoute()
const tasksStore = useTasksStore()
const { currentDates, scheduledTasks, todoTasks, shortcutTasks } = storeToRefs(tasksStore)

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

// Watch for date parameter changes
watch(() => route.params.date, (newDate) => {
  if (newDate && typeof newDate === 'string') {
    tasksStore.currentDates = [newDate]
  } else {
    // Use today's date
    const today = new Date().toISOString().split('T')[0]
    tasksStore.currentDates = [today]
  }
}, { immediate: true })

const handleCalendarTaskDropped = (payload: { taskId: string | number, event: MouseEvent, target: 'todo' | 'shortcut', date: string }) => {
  if (payload.target === 'todo') {
    const finalOrder = todoInsertionIndex.value !== null
      ? tasksStore.calculateNewOrder(tasksStore.todoTasks, todoInsertionIndex.value)
      : undefined

    tasksStore.moveCalendarToTodo(payload.taskId, payload.date, finalOrder)
  } else if (payload.target === 'shortcut') {
    const finalOrder = shortcutInsertionIndex.value !== null
      ? tasksStore.calculateNewOrder(tasksStore.shortcutTasks, shortcutInsertionIndex.value)
      : undefined

    tasksStore.moveCalendarToShortcut(payload.taskId, payload.date, finalOrder)
  }

  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}

const handleExternalTaskSidebarDrop = async () => {
  if (!activeExternalTask.value) return

  const { source, task } = activeExternalTask.value

  if (isOverTodo.value) {
    if (source === 'shortcut') {
      const finalOrder = todoInsertionIndex.value !== null
        ? tasksStore.calculateNewOrder(tasksStore.todoTasks, todoInsertionIndex.value)
        : undefined

      await tasksStore.copyShortcutToTodo(task.id, finalOrder)
    } else if (source === 'todo') {
      if (todoInsertionIndex.value !== null) {
        tasksStore.reorderTodo(task.id, todoInsertionIndex.value)
      }
    }
  } else if (isOverShortcut.value) {
    if (source === 'todo') {
      const finalOrder = shortcutInsertionIndex.value !== null
        ? tasksStore.calculateNewOrder(tasksStore.shortcutTasks, shortcutInsertionIndex.value)
        : undefined

      await tasksStore.moveTodoToShortcut(task.id, finalOrder)
    } else if (source === 'shortcut') {
      if (shortcutInsertionIndex.value !== null) {
        tasksStore.reorderShortcut(task.id, shortcutInsertionIndex.value)
      }
    }
  }

  activeExternalTask.value = null
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}

const handleExternalTaskDeletedWrapper = () => {
  handleExternalTaskDeleted()
  todoInsertionIndex.value = null
  shortcutInsertionIndex.value = null
}

// Popup visibility state
const showEditorPopup = ref(false)
const initialStartTime = ref<number | null>(null)
const taskToEdit = ref<Task | null>(null)
const popupTaskType = ref<'scheduled' | 'todo' | 'shortcut'>('scheduled')

const popupTargetDate = ref<string | null>(null)

// Handler for when a slot is clicked or "Create Task" button is pressed
const handleOpenCreatePopup = (payload?: { startTime: number, date?: string }) => {
  taskToEdit.value = null
  initialStartTime.value = payload?.startTime ?? null
  popupTargetDate.value = payload?.date ?? tasksStore.currentDates[0]
  popupTaskType.value = 'scheduled'
  showEditorPopup.value = true
}

// Handler for opening the editor for an existing task
const handleEditTask = (task: Task) => {
  taskToEdit.value = task
  if (task.startTime !== null && task.startTime !== undefined) {
    popupTaskType.value = 'scheduled'
  } else if (task.isShortcut) {
    popupTaskType.value = 'shortcut'
  } else {
    popupTaskType.value = 'todo'
  }
  showEditorPopup.value = true
}

// Handler for when the popup emits a create event
const handleTaskCreate = (payload: { text: string; description: string; category: string; startTime?: number | null; duration?: number }) => {
  tasksStore.createScheduledTask({
    text: payload.text,
    description: payload.description,
    category: payload.category,
    completed: false,
    startTime: payload.startTime ?? null,
    duration: payload.duration ?? 60,
    date: popupTargetDate.value || tasksStore.currentDates[0],
    isShortcut: false,
    order: 0,
    color: null
  } as any)
  showEditorPopup.value = false
}

// Handler for when the popup emits an update event
const handleTaskUpdate = (payload: { id: string | number, updates: Partial<Task> }) => {
  const task = tasksStore.getTaskById(payload.id)
  if (!task) return

  if (task.startTime !== null && task.startTime !== undefined) {
    tasksStore.updateScheduledTask(task.id, task.date!, payload.updates)
  } else if (task.isShortcut) {
    tasksStore.updateShortcut(task.id, payload.updates)
  } else {
    tasksStore.updateTodo(task.id, payload.updates)
  }
  showEditorPopup.value = false
}

const handlePopupClose = () => {
  showEditorPopup.value = false
  taskToEdit.value = null
  popupTargetDate.value = null
}

const handleAddDay = () => {
  const lastDateStr = currentDates.value[currentDates.value.length - 1]
  const lastDate = new Date(lastDateStr)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + 1)
  const nextDateStr = nextDate.toISOString().split('T')[0]
  tasksStore.addDate(nextDateStr)
}
</script>

<template>
  <div class="page-layout">
    <aside class="sidebar left">
      <TrashBasket :active="isOverTrash"
                   @update:bounds="trashBounds = $event" />
    </aside>

    <main class="main-content">
      <button class="create-btn"
              @click="handleOpenCreatePopup()"
              style="margin-bottom: 1rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 8px; cursor: pointer;">Create
        Task</button>
      <DayView ref="dayViewRef"
               :dates="currentDates"
               :tasks-by-date="scheduledTasks"
               :start-hour="0"
               :end-hour="24"
               :active-external-task="activeExternalTask?.task || null"
               @update:is-over-trash="isOverTrash = $event"
               @external-task-dropped="handleExternalTaskDropped"
               @delete-external-task="handleExternalTaskDeletedWrapper"
               @task-dropped-on-sidebar="handleCalendarTaskDropped($event)"
               @external-task-dropped-on-sidebar="handleExternalTaskSidebarDrop"
               @create-task="handleOpenCreatePopup"
               @edit="handleEditTask"
               @add-day="handleAddDay" />

      <TaskEditorPopup :show="showEditorPopup"
                       :task="taskToEdit"
                       :task-type="popupTaskType"
                       :initial-start-time="initialStartTime"
                       @close="handlePopupClose"
                       @create="handleTaskCreate"
                       @update="handleTaskUpdate" />
    </main>

    <aside class="sidebar right">
      <div class="pile-container">
        <TaskPile title="Shortcuts"
                  :tasks="shortcutTasks"
                  list-type="shortcut"
                  :is-highlighted="isOverShortcut"
                  :active-task-id="activeExternalTask?.task.id"
                  :insertion-index="shortcutInsertionIndex"
                  @update:bounds="shortcutBounds = $event"
                  @update:insertion-index="shortcutInsertionIndex = $event"
                  @drag-start="handleExternalDragStart('shortcut', $event.task, $event.event)"
                  @edit="handleEditTask" />
        <TaskPile title="To Do"
                  :tasks="todoTasks"
                  list-type="todo"
                  :is-highlighted="isOverTodo"
                  :active-task-id="activeExternalTask?.task.id"
                  :insertion-index="todoInsertionIndex"
                  @update:bounds="todoBounds = $event"
                  @update:insertion-index="todoInsertionIndex = $event"
                  @drag-start="handleExternalDragStart('todo', $event.task, $event.event)"
                  @edit="handleEditTask" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.page-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
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

.pile-container>* {
  flex: 1;
  min-height: 0;
}

.main-content {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
  min-width: 50vw;
}

@media (min-width: 1440px) {
  .main-content {
    min-width: 70vw;
  }
}
</style>
