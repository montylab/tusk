<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'
import { ref, watch } from 'vue'

const tasksStore = useTasksStore()
const { shortcutTasks } = storeToRefs(tasksStore)

const props = defineProps<{
  isHighlighted?: boolean
}>()

const emit = defineEmits<{
  (e: 'drag-start', payload: { event: MouseEvent, task: Task }): void
  (e: 'update:bounds', bounds: DOMRect): void
}>()

const pileRef = ref<HTMLElement | null>(null)

watch(pileRef, (el) => {
  if (el) {
    emit('update:bounds', el.getBoundingClientRect())
  }
}, { immediate: true })

const categoryColors: Record<string, string> = {
  Work: '#4facfe',
  Personal: '#43e97b',
  Urgent: '#ff4b1f',
  Learning: '#f093fb',
  Default: '#666'
}

const getCategoryColor = (category: string) => {
  return categoryColors[category] || categoryColors.Default
}

const getChaoticStyle = (id: number) => {
  // Use id as a seed for stable "chaos"
  const seed = (id * 1337) % 100
  const rotation = (seed % 7) - 3 // -3 to 3 degrees
  const xOffset = (seed % 4) * 3 - 6 // -6 to 6px
  
  return {
    transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
    margin: '10px 0',
    width: '100%',
    cursor: 'grab'
  }
}

const handleMouseDown = (e: MouseEvent, task: Task) => {
  emit('drag-start', { event: e, task })
}
</script>

<template>
  <div 
    ref="pileRef"
    class="shortcuts-pile"
    :class="{ 'is-highlighted': isHighlighted }"
  >
    <h3 class="pile-title">Shortcuts</h3>
    <div class="pile-content">
      <TransitionGroup name="task-list">
        <div 
          v-for="task in shortcutTasks" 
          :key="task.id"
          class="pile-task"
          :style="{ 
            ...getChaoticStyle(task.id),
            boxShadow: `0 0 2px 1px ${getCategoryColor(task.category)}, 0 2px 5px rgba(0,0,0,0.2)`
          }"
          @mousedown="handleMouseDown($event, task)"
        >
          <TaskItem :task="task" />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.shortcuts-pile {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  border-radius: 12px;
}

.shortcuts-pile.is-highlighted {
  background: rgba(var(--accent-rgb, 79, 172, 254), 0.1);
  border-color: rgba(var(--accent-rgb, 79, 172, 254), 0.3);
  box-shadow: inset 0 0 20px rgba(var(--accent-rgb, 79, 172, 254), 0.05);
  transform: scale(1.02);
}

.pile-title {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.pile-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.pile-task {
  /* Antialiasing improvements for rotated elements */
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  will-change: transform;
  border-radius: 6px;
  overflow: hidden;
}

.pile-task :deep(.task-item) {
  border: none;
  box-shadow: none;
}

/* Animations */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-list-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(-20px) rotate(10deg);
}

.task-list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.task-list-move {
  transition: transform 0.4s ease;
}
</style>
