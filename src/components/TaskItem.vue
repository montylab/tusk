<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'task-mousedown', payload: { originalEvent: MouseEvent, taskId: number }): void
}>()

const categoryColors: Record<string, string> = {
  Work: '#4facfe',
  Personal: '#43e97b',
  Urgent: '#ff4b1f',
  Learning: '#f093fb',
  Default: '#666'
}

const itemColor = computed(() => {
  return categoryColors[props.task.category] || categoryColors.Default
})

const onMouseDown = (e: MouseEvent) => {
    emit('task-mousedown', { originalEvent: e, taskId: props.task.id })
}
</script>

<template>
  <div 
    class="task-item" 
    @mousedown.prevent="onMouseDown"
    :style="{ borderColor: itemColor }"
  >
    <div class="color-stripe" :style="{ background: itemColor }"></div>
    <div class="content">
      <h4 class="title">{{ task.text }}</h4>
      <div class="meta">
         <span class="category-badge" :style="{ color: itemColor, borderColor: itemColor }">
          {{ task.category || 'Uncategorized' }}
        </span>
        <span class="time-badge" v-if="task.startTime !== null">
           {{ Math.floor(task.startTime) }}:{{ (Math.round((task.startTime % 1) * 60)).toString().padStart(2, '0') }}
        </span>
      </div>
     
    </div>
  </div>
</template>

<style scoped>
.task-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  display: flex;
  overflow: hidden;
  border: 1px solid transparent;
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: transform 0.1s;
}

.task-item:active {
  cursor: grabbing;
}

.color-stripe {
  width: 4px;
  height: 100%;
  flex-shrink: 0;
}

.content {
  padding: 4px 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-main);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  gap: 6px;
  align-items: center;
}

.category-badge {
  font-size: 0.65rem;
  opacity: 0.9;
  border: 1px solid;
  border-radius: 3px;
  padding: 0 4px;
  font-weight: 600;
}

.time-badge {
  font-size: 0.65rem;
  color: var(--text-muted);
}
</style>
