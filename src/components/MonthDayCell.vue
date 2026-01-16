<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '../types'
import MonthTaskItem from './MonthTaskItem.vue'
import { isToday, getMonthFromDate } from '../utils/dateUtils'

const props = defineProps<{
	date: string
	tasks: Task[]
	currentMonth: number
}>()

const emit = defineEmits<{
	(e: 'create', date: string): void
	(e: 'task-click', task: Task, event: MouseEvent): void
	(e: 'task-dblclick', task: Task): void
	(e: 'task-dragstart', task: Task, event: DragEvent): void
	(e: 'dragover', event: DragEvent): void
	(e: 'drop', date: string, event: DragEvent): void
}>()

const isDragOver = ref(false)

const isCurrentMonth = computed(() => {
	return getMonthFromDate(props.date) === props.currentMonth
})

const isTodayDate = computed(() => isToday(props.date))

const dayNumber = computed(() => {
	const d = new Date(props.date)
	return d.getDate()
})

const sortedTasks = computed(() => {
	return [...props.tasks].sort((a, b) => {
		const aTime = a.startTime ?? 0
		const bTime = b.startTime ?? 0
		return aTime - bTime
	})
})

const handleCellClick = (e: MouseEvent) => {
	// Only trigger if clicking on the cell itself, not a task
	if (
		(e.target as HTMLElement).classList.contains('cell-content') ||
		(e.target as HTMLElement).classList.contains('day-header') ||
		(e.target as HTMLElement).classList.contains('day-number')
	) {
		emit('create', props.date)
	}
}

const handleDragOver = (e: DragEvent) => {
	e.preventDefault()
	isDragOver.value = true
	emit('dragover', e)
}

const handleDragLeave = () => {
	isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
	e.preventDefault()
	isDragOver.value = false
	emit('drop', props.date, e)
}
</script>

<template>
	<div
		class="month-day-cell"
		:class="{
			'other-month': !isCurrentMonth,
			'is-today': isTodayDate,
			'drag-over': isDragOver
		}"
		@click="handleCellClick"
		@dragover="handleDragOver"
		@dragleave="handleDragLeave"
		@drop="handleDrop"
	>
		<div class="day-header">
			<span class="day-number">{{ dayNumber }}</span>
		</div>
		<div class="cell-content">
			<div class="tasks-list">
				<MonthTaskItem
					v-for="task in sortedTasks"
					:key="task.id"
					:task="task"
					@click="(t, e) => emit('task-click', t, e)"
					@dblclick="(t) => emit('task-dblclick', t)"
					@dragstart="(t, e) => emit('task-dragstart', t, e)"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.month-day-cell {
	display: flex;
	flex-direction: column;
	background: var(--bg-column);
	border: 1px solid var(--border-color);
	min-height: 0;
	height: 100%;
	transition: all 0.15s ease;

	&:hover {
		background: var(--surface-hover);
	}

	&.other-month {
		opacity: 0.4;
		background: color-mix(in srgb, var(--bg-page), transparent 80%);
	}

	&.is-today {
		border-color: var(--accent);
		background: var(--bg-today-highlight);

		.day-number {
			background: var(--accent);
			color: var(--text-on-accent);
			border-radius: var(--radius-full);
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	&.drag-over {
		background: color-mix(in srgb, var(--accent), transparent 85%);
		border-color: var(--accent);
	}

	.day-header {
		padding: 0.25rem 0.375rem;
		flex-shrink: 0;

		.day-number {
			width: 1.25rem;
			height: 1.25rem;

			font-size: var(--font-sm);
			line-height: 1.25rem;
			font-weight: 600;
			color: var(--text-meta);
			text-align: center;
			text-indent: -1px;
		}
	}

	.cell-content {
		flex: 1;
		overflow: hidden;
		padding: 0 0.25rem 0.25rem;

		.tasks-list {
			display: flex;
			flex-direction: column;
			gap: 2px;
			overflow-y: auto;
			max-height: 100%;
			scrollbar-width: thin;
			scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);

			&::-webkit-scrollbar {
				width: 4px;
			}

			&::-webkit-scrollbar-track {
				background: var(--scrollbar-track);
			}

			&::-webkit-scrollbar-thumb {
				background: var(--scrollbar-thumb);
				border-radius: var(--radius-xs);
			}
		}
	}
}
</style>
