<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'

defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e: 'drag-start', payload: { event: MouseEvent, task: Task }): void
}>()

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

const getChaoticStyle = (index: number) => {
  const rotation = (index % 7) - 3 // -3 to 3 degrees
  const xOffset = (index % 4) * 3 - 6 // -6 to 6px
  
  return {
    transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
    margin: '12px 0',
    width: '100%',
    cursor: 'grab'
  }
}

const handleMouseDown = (e: MouseEvent, task: Task) => {
  emit('drag-start', { event: e, task })
}
</script>

<template>
  <div class="todo-pile">
    <h3 class="pile-title">To Do</h3>
    <div class="pile-content">
      <div 
        v-for="(task, index) in tasks" 
        :key="task.id"
        class="pile-task"
        :style="{ 
          ...getChaoticStyle(index),
          boxShadow: `0 0 2px 1px ${getCategoryColor(task.category)}, 0 2px 5px rgba(0,0,0,0.2)`
        }"
        @mousedown="handleMouseDown($event, task)"
      >
        <TaskItem :task="task" />
      </div>
      <div v-if="tasks.length === 0" class="empty-state">
        No tasks to do
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-pile {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.01);
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

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 2rem;
}
</style>
