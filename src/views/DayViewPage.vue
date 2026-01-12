<script
  setup
  lang="ts"
>
import { ref, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DayView from '../components/DayView.vue'
import TrashBasket from '../components/TrashBasket.vue'
import TaskPile from '../components/TaskPile.vue'
import TaskEditorPopup from '../components/TaskEditorPopup.vue'
import { useTasksStore } from '../stores/tasks'
import { useTimeBoundaries } from '../composables/useTimeBoundaries'
import { useZoneDetection } from '../composables/dnd/useZoneDetection'
import { useDragContext } from '../composables/dnd/useDragContext'
import { formatDate } from '../utils/dateUtils'
import type { Task } from '../types'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const { onDayChange } = useTimeBoundaries()

onDayChange((newDate) => {
  router.push({ name: 'day', params: { date: newDate } })
})
const { currentDates, scheduledTasks, todoTasks, shortcutTasks } = storeToRefs(tasksStore)

// --- Drag & Drop Zone Registration ---
const { registerZone } = useZoneDetection()
const { dropTarget } = useDragContext() // To show highlighting

const isOverTrash = computed(() => dropTarget.value.zone === 'trash')
const isOverTodo = computed(() => dropTarget.value.zone === 'todo')
const isOverShortcut = computed(() => dropTarget.value.zone === 'shortcut')

const todoInsertionIndex = ref<number | null>(null)
const shortcutInsertionIndex = ref<number | null>(null)

const handleInsertionIndexUpdate = (zone: 'todo' | 'shortcut', index: number | null) => {
  if (zone === 'todo') {
    todoInsertionIndex.value = index
    if (isOverTodo.value) {
      const { setDropTarget } = useDragContext()
      setDropTarget({ zone: 'todo', data: { index } })
    }
  } else if (zone === 'shortcut') {
    shortcutInsertionIndex.value = index
    if (isOverShortcut.value) {
      const { setDropTarget } = useDragContext()
      setDropTarget({ zone: 'shortcut', data: { index } })
    }
  }
}

// Reference to DayView
const dayViewRef = ref<any>(null)

// Watch for date parameter changes
watch(() => route.params.date, (newDate, oldDate) => {
  if (newDate && typeof newDate === 'string') {
    tasksStore.currentDates = [newDate]
  } else {
    const today = formatDate(new Date())
    tasksStore.currentDates = [today]
  }

  if (newDate !== oldDate) {
    nextTick(() => {
      dayViewRef.value?.scrollToTop()
    })
  }
}, { immediate: true })

// Popup visibility state
const showEditorPopup = ref(false)
const initialStartTime = ref<number | null>(null)
const taskToEdit = ref<Task | null>(null)
const popupTaskType = ref<'scheduled' | 'todo' | 'shortcut'>('scheduled')
const popupTargetDate = ref<string | null>(null)

// Handlers
const handleOpenCreatePopup = (payload?: { startTime: number, date?: string }) => {
  taskToEdit.value = null
  initialStartTime.value = payload?.startTime ?? null
  popupTargetDate.value = payload?.date ?? tasksStore.currentDates[0]
  popupTaskType.value = 'scheduled'
  showEditorPopup.value = true
}

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

// Pass External Drag Start to DayView (which delegates to strategy in new system)
const onDragStart = (_source: 'todo' | 'shortcut', task: Task, event: MouseEvent) => {
  // _source unused but kept for potential future logic or logging
  dayViewRef.value?.startExternalDrag(event, task)
}

</script>

<template>
  <div class="page-layout">
    <aside class="sidebar left">
      <TrashBasket :active="isOverTrash"
                   @update:bounds="registerZone('trash', $event)" />
    </aside>

    <main class="main-content">
      <button class="create-btn"
              @click="handleOpenCreatePopup()"
              style="margin-bottom: 1rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
        Create Task
      </button>
      <DayView ref="dayViewRef"
               :dates="currentDates"
               :tasks-by-date="scheduledTasks"
               :start-hour="0"
               :end-hour="24"
               @update:calendar-bounds="registerZone('calendar', $event)"
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
                  :insertion-index="shortcutInsertionIndex"
                  @update:bounds="registerZone('shortcut', $event)"
                  @update:insertion-index="handleInsertionIndexUpdate('shortcut', $event)"
                  @drag-start="onDragStart('shortcut', $event.task, $event.event)"
                  @edit="handleEditTask" />
        <TaskPile title="To Do"
                  :tasks="todoTasks"
                  list-type="todo"
                  :is-highlighted="isOverTodo"
                  :insertion-index="todoInsertionIndex"
                  @update:bounds="registerZone('todo', $event)"
                  @update:insertion-index="handleInsertionIndexUpdate('todo', $event)"
                  @drag-start="onDragStart('todo', $event.task, $event.event)"
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

.create-btn {
  transition: all 0.2s ease;
}

.create-btn.over {
  transform: scale(1.1);
  filter: brightness(1.2);
  box-shadow: 0 0 15px rgba(118, 75, 162, 0.5);
}

@media (min-width: 1440px) {
  .main-content {
    min-width: 70vw;
  }
}
</style>
