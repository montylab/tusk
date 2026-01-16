<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '../types'
import MonthDayCell from './MonthDayCell.vue'
import MonthTaskPopover from './MonthTaskPopover.vue'
import { getMonthCalendarGrid, getShortDayName, getMonthName } from '../utils/dateUtils'
import { useTasksStore } from '../stores/tasks'

const props = defineProps<{
	year: number
	month: number
	tasksByDate: Record<string, Task[]>
}>()

const emit = defineEmits<{
	(e: 'create-task', payload: { date: string }): void
	(e: 'edit-task', task: Task): void
	(e: 'prev-month'): void
	(e: 'next-month'): void
}>()

const tasksStore = useTasksStore()

// Grid of date strings
const calendarGrid = computed(() => getMonthCalendarGrid(props.year, props.month))

// Day names header
const dayNames = computed(() => Array.from({ length: 7 }, (_, i) => getShortDayName(i)))

// Popover state
const popoverTask = ref<Task | null>(null)
const popoverVisible = ref(false)
const popoverAnchor = ref<HTMLElement | null>(null)

// Drag state
const draggedTask = ref<Task | null>(null)
const dragSourceDate = ref<string | null>(null)

// Task helpers
const getTasksForDate = (date: string): Task[] => {
	return props.tasksByDate[date] || []
}

// Event handlers
const handleCreate = (date: string) => {
	emit('create-task', { date })
}

const handleTaskClick = (task: Task, event: MouseEvent) => {
	popoverTask.value = task
	popoverAnchor.value = event.currentTarget as HTMLElement
	popoverVisible.value = true
}

const handleTaskDblClick = (task: Task) => {
	popoverVisible.value = false
	emit('edit-task', task)
}

const handlePopoverClose = () => {
	popoverVisible.value = false
	popoverTask.value = null
}

const handlePopoverEdit = (task: Task) => {
	popoverVisible.value = false
	emit('edit-task', task)
}

const handlePopoverDelete = (task: Task) => {
	popoverVisible.value = false
	if (task.date) {
		tasksStore.deleteScheduledTask(task.id, task.date)
	}
}

// Drag handlers
const handleTaskDragStart = (task: Task, event: DragEvent) => {
	draggedTask.value = task
	dragSourceDate.value = task.date || null
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData('text/plain', String(task.id))
	}
}

const handleDrop = (targetDate: string) => {
	if (!draggedTask.value || !dragSourceDate.value) return
	if (dragSourceDate.value === targetDate) {
		// Dropped on same day, no change needed
		draggedTask.value = null
		dragSourceDate.value = null
		return
	}

	// Move task to new date (only date changes, not time)
	tasksStore.moveScheduledTask(draggedTask.value.id, dragSourceDate.value, targetDate, { date: targetDate })

	draggedTask.value = null
	dragSourceDate.value = null
}
</script>

<template>
	<div class="month-calendar">
		<div class="calendar-header">
			<button class="nav-btn" @click="emit('prev-month')" title="Previous month">&lsaquo;</button>
			<h2 class="month-title">{{ getMonthName(month) }} {{ year }}</h2>
			<button class="nav-btn" @click="emit('next-month')" title="Next month">&rsaquo;</button>
		</div>

		<div class="calendar-grid">
			<!-- Day names header -->
			<div class="day-names">
				<div v-for="name in dayNames" :key="name" class="day-name">{{ name }}</div>
			</div>

			<!-- Weeks -->
			<div class="weeks">
				<div v-for="(week, weekIndex) in calendarGrid" :key="weekIndex" class="week-row">
					<MonthDayCell
						v-for="date in week"
						:key="date"
						:date="date"
						:tasks="getTasksForDate(date)"
						:current-month="month"
						@create="handleCreate"
						@task-click="handleTaskClick"
						@task-dblclick="handleTaskDblClick"
						@task-dragstart="handleTaskDragStart"
						@drop="handleDrop"
					/>
				</div>
			</div>
		</div>

		<!-- Task Popover -->
		<MonthTaskPopover
			:task="popoverTask"
			:visible="popoverVisible"
			:anchor-el="popoverAnchor"
			@close="handlePopoverClose"
			@edit="handlePopoverEdit"
			@delete="handlePopoverDelete"
		/>
	</div>
</template>

<style scoped lang="scss">
.month-calendar {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-width: 700px;
	min-height: 500px;

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 0.75rem 1rem;
		flex-shrink: 0;

		.nav-btn {
			background: var(--surface-hover);
			border: 1px solid var(--border-color);
			color: var(--text-primary);
			width: 32px;
			height: 32px;
			border-radius: 6px;
			font-size: 1.25rem;
			cursor: pointer;
			transition: all 0.15s ease;
			display: flex;
			align-items: center;
			justify-content: center;

			&:hover {
				background: var(--surface-hover);
				border-color: var(--accent);
			}
		}

		.month-title {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--text-primary);
			margin: 0;
			min-width: 180px;
			text-align: center;
		}
	}

	.calendar-grid {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: auto;

		.day-names {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			background: var(--surface-hover);
			border-bottom: 1px solid var(--border-color);
			flex-shrink: 0;

			.day-name {
				padding: 0.5rem;
				text-align: center;
				font-size: 0.75rem;
				font-weight: 600;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
		}

		.weeks {
			flex: 1;
			display: grid;
			min-height: 0; // Allow shrinking

			.week-row {
				display: grid;
				grid-template-columns: repeat(7, 1fr);
				min-height: 0;
				min-height: 4rem;

				.month-day-cell {
					min-width: 100%;
				}
			}
		}
	}
}
</style>
