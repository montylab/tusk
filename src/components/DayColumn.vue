<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import TaskResizer from './TaskResizer.vue'
import type { Task } from '../types'
import { useTaskLayout } from '../composables/useTaskLayout'
import { useDragOperator } from '../composables/useDragOperator'
import { useTasksStore } from '../stores/tasks'
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

const props = withDefaults(
	defineProps<{
		date: string
		tasks: Task[]
		startHour: number
		endHour: number
		taskStatuses: Record<string | number, 'past' | 'future' | 'on-air' | null>
		scrollTop?: number
		scrollLeft?: number
	}>(),
	{
		scrollTop: 0,
		scrollLeft: 0
	}
)

const emit = defineEmits<{
	(e: 'slot-click', payload: { startTime: number }): void
	(e: 'edit', task: Task): void
	(e: 'update:bounds', bounds: DOMRect): void
}>()

import { useAppearanceStore } from '../stores/appearance'

const tasksStore = useTasksStore()
const appearanceStore = useAppearanceStore()
const { hourHeight } = storeToRefs(appearanceStore)

const { activeDraggedTaskId, registerZone, unregisterZone, updateZoneBounds, startDrag, dragOffset } = useDragOperator()

const gridRef = ref<HTMLElement | null>(null)

const zoneName = computed(() => `calendar-day-${props.date}`)

const hours = computed(() => Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour))

// Use activeTaskId from drag operator instead of prop
const { layoutTasks } = useTaskLayout(
	() => props.tasks,
	activeDraggedTaskId,
	ref(null), // Not using snapped time anymore
	ref(null), // Not using snapped duration anymore
	{
		startHour: props.startHour,
		endHour: props.endHour,
		hourHeight
	}
)

// Grid snapping calculation for drop data
const calculateDropData = (_x: number, y: number, task: Task) => {
	if (!gridRef.value) return { time: props.startHour, duration: task.duration || 60, date: props.date }

	const rect = gridRef.value.getBoundingClientRect()

	// Calculate Task Top Y based on cursor Y and drag offset
	// This ensures we snap the TOP of the task to the grid, based on where the user grabbed it
	const taskTopY = y - dragOffset.value.y
	const relativeY = taskTopY - rect.top

	const hours = relativeY / hourHeight.value
	const snappedHours = Math.round(hours / 0.25) * 0.25 // 15min snap
	let time = props.startHour + snappedHours

	// Clamp time
	time = Math.max(props.startHour, Math.min(time, props.endHour - (task.duration || 60) / 60))

	// Calculate snapped screen coordinates
	const snappedScreenY = rect.top + (time - props.startHour) * hourHeight.value
	const snappedScreenX = rect.left
	const snappedWidth = rect.width

	return {
		time,
		duration: task.duration || 60,
		date: props.date,
		snappedRect: {
			top: snappedScreenY,
			left: snappedScreenX,
			width: snappedWidth,
			height: ((task.duration || 60) / 60) * hourHeight.value
		}
	}
}

const updateBounds = () => {
	if (gridRef.value) {
		const bounds = gridRef.value.getBoundingClientRect()
		emit('update:bounds', bounds)
		updateZoneBounds(zoneName.value, bounds, { x: props.scrollLeft, y: props.scrollTop })
	}
}

// Watch scrollTop to keep bounds accurate during scroll
watch(() => [props.scrollTop, props.scrollLeft], updateBounds)

onMounted(() => {
	if (gridRef.value) {
		// Register zone with grid config and drop data calculator
		registerZone(zoneName.value, gridRef.value.getBoundingClientRect(), {
			gridConfig: {
				snapWidth: gridRef.value.clientWidth / 7, // Assume 7 days max
				snapHeight: hourHeight.value / 4, // 15 min segments
				startHour: props.startHour,
				endHour: props.endHour
			},
			calculateDropData,
			scrollOffset: { x: 0, y: props.scrollTop }
		})

		// Listen for resize
		const resizeObserver = new ResizeObserver(() => updateBounds())
		resizeObserver.observe(gridRef.value)
		;(gridRef.value as any).__resizeObserver = resizeObserver

		window.addEventListener('resize', updateBounds)
	}
})

onUnmounted(() => {
	unregisterZone(zoneName.value)

	if (gridRef.value && (gridRef.value as any).__resizeObserver) {
		;(gridRef.value as any).__resizeObserver.disconnect()
	}
	window.removeEventListener('resize', updateBounds)
})

const handleSlotClick = (hour: number, q: number) => {
	emit('slot-click', { startTime: hour + q * 0.25 })
}

const handleTaskMouseDown = (e: MouseEvent, task: Task) => {
	// Handle Ctrl+Click duplication
	if (e.ctrlKey || e.metaKey) {
		// Create duplicate with temp ID
		const duplicateTask: Task = {
			...task,
			id: tasksStore.generateTempId()
		}
		startDrag(duplicateTask, zoneName.value, e)
	} else {
		// Normal drag
		startDrag(task, zoneName.value, e)
	}
}

const handleTaskTouchStart = (e: TouchEvent, task: Task) => {
	// TODO: For touch, we could implement long-press for duplication
	startDrag(task, zoneName.value, e)
}
</script>

<template>
	<div ref="columnRef" class="day-column">
		<div ref="gridRef" class="column-grid">
			<div v-for="hour in hours" :key="hour" class="hour-row">
				<div v-for="q in 4" :key="q - 1" class="quarter-slot" @click="handleSlotClick(hour, q - 1)"></div>
			</div>
		</div>

		<div class="tasks-container">
			<template v-for="task in layoutTasks" :key="task.id">
				<TaskResizer
					:task="task"
					:layout-style="task.style"
					:start-hour="props.startHour"
					class="task-wrapper-absolute"
					:class="{ 'dragged-origin': task.id === activeDraggedTaskId }"
					@mousedown="handleTaskMouseDown($event, task)"
					@touchstart="handleTaskTouchStart($event, task)"
				>
					<template #default="{ resizedTask }">
						<TaskItem
							:task="resizedTask"
							:is-dragging="task.id === activeDraggedTaskId"
							:is-shaking="task.isOverlapping"
							:status="taskStatuses[task.id]"
							@edit="emit('edit', $event)"
						/>
					</template>
				</TaskResizer>
			</template>
		</div>
	</div>
</template>

<style scoped>
.day-column {
	flex: 1;
	position: relative;
	border-left: 1px solid var(--border-color);
	min-width: clamp(200px, 12.5rem, 12.5rem);
	background: var(--bg-column);
}

.column-grid {
	position: relative;
}

.hour-row {
	height: var(--hour-height);
	border-bottom: 1px solid var(--border-color);
	display: flex;
	flex-direction: column;
}

.quarter-slot {
	flex: 1;
	border-bottom: 1px solid rgba(255, 255, 255, 0.03);
	cursor: cell;
	transition: background 0.2s;
}

.quarter-slot:last-child {
	border-bottom: none;
}

.quarter-slot:hover {
	background: var(--surface-hover);
}

.tasks-container {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}

.task-wrapper-absolute {
	position: absolute;
	pointer-events: auto;
	transition: none;
	user-select: none;
	cursor: grab;
}

.task-wrapper-absolute:active {
	cursor: grabbing;
}

/* Base transition for static items */
.task-wrapper-absolute:not(.dragged-origin) {
	transition:
		transform 0.1s,
		box-shadow 0.2s,
		opacity 0.2s;
}

.dragged-origin {
	opacity: 0.25;
	pointer-events: none;
}
</style>
