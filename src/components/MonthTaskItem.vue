<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{
	task: Task
	isDragging?: boolean
}>()

const emit = defineEmits<{
	(e: 'click', task: Task, event: MouseEvent): void
	(e: 'dblclick', task: Task): void
	(e: 'dragstart', task: Task, event: DragEvent): void
}>()

const categoriesStore = useCategoriesStore()

const formatTime = (time: number) => {
	const h = Math.floor(time)
	const m = Math.round((time % 1) * 60)
	return `${h}:${m.toString().padStart(2, '0')}`
}

const categoryColor = computed(() => {
	const categoryObj = categoriesStore.categoriesArray.find((c) => c.name === props.task.category)
	return props.task.color || categoryObj?.color || 'var(--color-default)'
})

const handleClick = (e: MouseEvent) => {
	e.stopPropagation()
	emit('click', props.task, e)
}

const handleDblClick = (e: MouseEvent) => {
	e.stopPropagation()
	emit('dblclick', props.task)
}

const handleDragStart = (e: DragEvent) => {
	emit('dragstart', props.task, e)
}
</script>

<template>
	<div
		class="month-task-item"
		:class="{ dragging: isDragging }"
		draggable="true"
		@click="handleClick"
		@dblclick="handleDblClick"
		@dragstart="handleDragStart"
	>
		<span class="bullet" :style="{ backgroundColor: categoryColor }"></span>
		<span class="time" v-if="task.startTime !== null && task.startTime !== undefined">
			{{ formatTime(task.startTime) }}
		</span>
		<span class="title">{{ task.text }}</span>
	</div>
</template>

<style scoped lang="scss">
.month-task-item {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0 0.25rem 0;
	border-radius: var(--radius-xs);
	cursor: pointer;
	user-select: none;
	transition: background-color 0.15s ease;

	&:hover {
		background: var(--surface-hover);
	}

	&.dragging {
		opacity: 0.5;
	}

	.bullet {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.time {
		font-size: 0.7rem;
		color: var(--text-meta);
		font-weight: 500;
		flex-shrink: 0;
	}

	.title {
		font-size: 0.75rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}
</style>
