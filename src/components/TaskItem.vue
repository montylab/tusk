<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{
  task: Task
  isDragging?: boolean
  isShaking?: boolean
  status?: 'past' | 'future' | 'on-air' | null
}>()

const emit = defineEmits<{
  (e: 'task-mousedown', payload: { originalEvent: MouseEvent, taskId: string | number }): void
}>()

const categoriesStore = useCategoriesStore()

const formatDuration = (minutes: number) => {
  const safeMinutes = isNaN(minutes) ? 60 : minutes
  if (safeMinutes < 60) return `${safeMinutes}m`
  const h = Math.floor(safeMinutes / 60)
  const m = safeMinutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const isCompact = computed(() => props.task.duration <= 30)

const itemStyle = computed(() => {
  const categoryObj = categoriesStore.categoriesArray.find(c => c.name === props.task.category)
  const color = props.task.color || categoryObj?.color || 'var(--color-default)'
  return { '--category-color': color }
})

const onMouseDown = (e: MouseEvent) => {
    emit('task-mousedown', { originalEvent: e, taskId: props.task.id })
}
</script>

<template>
  <div 
    class="task-item" 
    :class="{ 
      'shaking': isShaking, 
      'dragging': isDragging, 
      'on-air': status === 'on-air',
      'in-past': status === 'past',
      'in-future': status === 'future',
      'is-compact': isCompact
    }"
    :style="itemStyle"
    @mousedown.prevent="onMouseDown"
  >

    <div v-if="status === 'on-air'" class="on-air-tag">ON AIR</div>
    <div class="color-stripe"></div>
    <div class="content">
      <div class="main-info">
        <h4 class="title">{{ task.text }}</h4>
        <span class="category-badge">
          {{ task.category || 'Uncategorized' }}
        </span>
      </div>
      <div class="meta">
        <span class="time-badge" v-if="task.startTime !== null && task.startTime !== undefined">
           {{ Math.floor(task.startTime) }}:{{ (Math.round((task.startTime % 1) * 60)).toString().padStart(2, '0') }}
        </span>
        <span class="duration-badge">
          {{ formatDuration(task.duration) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-item {
  --category-color: var(--color-default);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  display: flex;
  border: 1px solid var(--category-color);
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.task-item.on-air {
  background: rgba(255, 255, 255, 0.2);
  border-width: 2px; 
  z-index: 5;
}

.on-air-tag {
  position: absolute;
  top: -8px;
  right: 8px;
  background: var(--color-urgent);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 3px;
  z-index: 10;
  letter-spacing: 0.5px;
  box-shadow: 0 0 10px rgba(255, 75, 31, 0.4);
  pointer-events: none;
  z-index: 999;
}

.task-item.in-past {
  opacity: 0.75;
  filter: grayscale(0.5);
  background: rgba(255, 255, 255, 0.04);
}

.task-item.in-past .color-stripe {
  opacity: 0.8;
}

.task-item.dragging {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    cursor: grabbing;
}

.task-item:active {
  cursor: grabbing;
}

.color-stripe {
  width: 4px;
  height: 100%;
  flex-shrink: 0;
  background: var(--category-color);
  border-radius: 6px 0 0 6px;
}

.content {
  padding: 4px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  gap: 2px;
}

.is-compact .content {
  flex-direction: row;
  justify-content: flex-start;
}

.is-compact .meta {
  margin-left: auto;
  margin-right: 3px;
}

.is-compact .category-badge {
  border-width: 0 0 0 1px;
  border-radius: 0;
}


.main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item.is-compact .title {
  font-size: 0.75rem;
}

.meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.category-badge {
  font-size: 0.6rem;
  opacity: 0.9;
  border: 1px solid var(--category-color);
  color: var(--category-color);
  border-radius: 4px;
  padding: 0 4px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.time-badge, .duration-badge {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.task-item.on-air .time-badge, 
.task-item.on-air .duration-badge {
  color: #fff;
  opacity: 0.9;
}

@keyframes shake {
  0% { transform: scaleX(1); }
  50% { transform: scaleX(1.03);}
  100% { transform: scaleX(1);}
}

.shaking {
    animation: shake .4s infinite ease-in-out;
}
</style>
