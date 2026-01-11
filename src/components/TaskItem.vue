<script
  setup
  lang="ts"
>
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
  (e: 'edit', task: Task): void
}>()

const categoriesStore = useCategoriesStore()

const formatTime = (time: number) => {
  const h = Math.floor(time)
  const m = Math.round((time % 1) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

const formatDuration = (minutes: number) => {
  const safeMinutes = isNaN(minutes) ? 60 : minutes
  if (safeMinutes <= 0) return '0m'
  if (safeMinutes < 60) return `${safeMinutes}m`
  const h = Math.floor(safeMinutes / 60)
  const m = Math.round(safeMinutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const endTime = computed(() => {
  if (props.task.startTime === null || props.task.startTime === undefined) return null
  return props.task.startTime + (props.task.duration / 60)
})

const isCompact = computed(() => props.task.duration <= 30)

const itemStyle = computed(() => {
  const categoryObj = categoriesStore.categoriesArray.find(c => c.name === props.task.category)
  const color = props.task.color || categoryObj?.color || 'var(--color-default)'
  return { '--category-color': color }
})

const onEditClick = (e: Event) => {
  e.stopPropagation()
  emit('edit', props.task)
}
</script>

<template>
  <div class="task-item"
       :class="{
        'shaking': isShaking,
        'dragging': isDragging,
        'on-air': status === 'on-air',
        'in-past': status === 'past',
        'in-future': status === 'future',
        'is-compact': isCompact
      }"
       :style="itemStyle"
       @dblclick="emit('edit', task)">

    <div v-if="status === 'on-air'"
         class="on-air-tag">ON AIR</div>
    <div class="color-stripe"></div>
    <div class="content">
      <div class="main-info">
        <h4 class="title">{{ task.text }}</h4>
        <div class="header-actions"
             v-if="!isDragging">
          <button class="edit-btn"
                  @mousedown.stop
                  @click="onEditClick"
                  title="Edit Task">
            <i class="pi pi-pencil"></i>
          </button>
        </div>
        <span class="category-badge">{{ task.category || 'Uncategorized' }}</span>
        <span v-if="task.isDeepWork"
              class="deep-work-badge"
              title="Deep Work task">
          <i class="pi pi-brain"></i>
          <span v-if="!isCompact">DEEP</span>
        </span>
      </div>
      <p v-if="task.description && !isCompact"
         class="description-text">
        {{ task.description }}
      </p>
      <div class="meta">
        <span class="time-badge"
              v-if="task.startTime !== null && task.startTime !== undefined">
          {{ formatTime(task.startTime) }} - {{ endTime !== null ? formatTime(endTime) : '?' }}
        </span>
        <span class="duration-badge">
          {{ formatDuration(task.duration) }}
        </span>
      </div>
      <span class="category-badge for-compact">{{ task.category || 'Uncategorized' }}</span>
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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

.for-compact {
  display: none;
}

.is-compact .content {
  flex-direction: row;
  justify-content: flex-start;
}


.is-compact .category-badge {
  display: none;
}

.is-compact .category-badge.for-compact {
  display: inline-block;
  border-width: 0 0 0 1px;
  border-radius: 0;
  margin-right: 3px;
  margin-left: auto;
  /* height: 20px; */
  /* line-height: ; */
  place-self: center;
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
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-item:hover .header-actions {
  opacity: 1;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn i {
  font-size: 0.7rem;
}

.edit-btn:hover {
  background: var(--category-color);
  border-color: #fff;
  transform: scale(1.1);
}

.task-item.is-compact .title {
  font-size: 0.75rem;
}

.description-text {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
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
  white-space: nowrap;
  text-transform: uppercase;
  flex-shrink: 0;
}

.deep-work-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #7c3aed;
  /* Purple */
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  box-shadow: 0 0 10px rgba(124, 58, 237, 0.3);
  pointer-events: none;
}

.deep-work-badge i {
  font-size: 0.65rem;
}

.time-badge,
.duration-badge {
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
  0% {
    transform: scaleX(1);
  }

  50% {
    transform: scaleX(1.03);
  }

  100% {
    transform: scaleX(1);
  }
}

.shaking {
  animation: shake .4s infinite ease-in-out;
}
</style>
