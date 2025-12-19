<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
const isOverTrash = ref(false)
const dayViewRef = ref<any>(null)

// External drag handling
const {
  activeExternalTask,
  handleExternalDragStart,
  handleExternalTaskDropped,
  handleExternalTaskDeleted
} = useExternalDrag(dayViewRef)

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
