<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import { useDragOperator } from '../composables/useDragOperator'
import { useTasksStore } from '../stores/tasks'

const props = defineProps<{
	title: string
	tasks: Task[]
	listType: 'todo' | 'shortcut'
}>()

const emit = defineEmits<{
	(e: 'edit', task: Task): void
}>()

const categoriesStore = useCategoriesStore()
const tasksStore = useTasksStore()
const { currentZone, activeDraggedTaskId, isDragging, registerZone, unregisterZone, updateZoneBounds, startDrag } = useDragOperator()

const pileRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const insertionIndex = ref<number | null>(null)

// Zone name
const zoneName = computed(() => props.listType)

// Reactive highlighting
const isHighlighted = computed(() => currentZone.value === zoneName.value)

const updateBounds = () => {
	if (pileRef.value) {
		const rect = pileRef.value.getBoundingClientRect()
		updateZoneBounds(zoneName.value, rect)
	}
}

// Calculate drop data (insertion index and order)
const calculateDropData = (x: number, y: number, task: Task) => {
	if (!contentRef.value) return { index: 0, order: 0 }

	const tasks = Array.from(contentRef.value.querySelectorAll('.task-group:not(.bottom-indicator-group)')) as HTMLElement[]

	let index = tasks.length
	for (let i = 0; i < tasks.length; i++) {
		const rect = tasks[i].getBoundingClientRect()
		const midPoint = rect.top + rect.height / 2
		if (y < midPoint) {
			index = i
			break
		}
	}

	// Calculate order value for this index
	const order = tasksStore.calculateNewOrder(props.tasks, index)

	return { index, order }
}

onMounted(() => {
	if (pileRef.value) {
		// Register zone with calculateDropData
		registerZone(zoneName.value, pileRef.value.getBoundingClientRect(), {
			calculateDropData
		})

		// Watch for resizes
		const resizeObserver = new ResizeObserver(() => updateBounds())
		resizeObserver.observe(pileRef.value)
		;(pileRef.value as any).__resizeObserver = resizeObserver

		window.addEventListener('resize', updateBounds)
	}
})

onUnmounted(() => {
	unregisterZone(zoneName.value)

	if (pileRef.value && (pileRef.value as any).__resizeObserver) {
		;(pileRef.value as any).__resizeObserver.disconnect()
	}
	window.removeEventListener('resize', updateBounds)
})

// Update insertion index when dragging over this zone
const handleMouseMove = (e: MouseEvent) => {
	if (!isHighlighted.value || !contentRef.value || !isDragging.value) {
		if (insertionIndex.value !== null) {
			insertionIndex.value = null
		}
		return
	}

	const tasks = Array.from(contentRef.value.querySelectorAll('.task-group:not(.bottom-indicator-group)')) as HTMLElement[]

	let newIndex = tasks.length
	for (let i = 0; i < tasks.length; i++) {
		const rect = tasks[i].getBoundingClientRect()
		const midPoint = rect.top + rect.height / 2
		if (e.clientY < midPoint) {
			newIndex = i
			break
		}
	}

	if (insertionIndex.value !== newIndex) {
		insertionIndex.value = newIndex
	}
}

onMounted(() => {
	window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
	window.removeEventListener('mousemove', handleMouseMove)
})

const getChaoticStyle = (task: Task) => {
	const getSeed = (id: string | number) => {
		if (typeof id === 'number') return id
		let hash = 0
		for (let i = 0; i < id.length; i++) {
			hash = (hash << 5) - hash + id.charCodeAt(i)
			hash |= 0
		}
		return Math.abs(hash)
	}

	const seed = (getSeed(task.id) * 1337) % 100
	const rotation = (seed % 7) - 3
	const xOffset = (seed % 4) * 3 - 6

	// Dynamic height based on duration
	let height = 68
	if (task.duration <= 15) height = 42
	else if (task.duration <= 30) height = 52

	return {
		transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
		margin: '12px 0',
		width: '100%',
		height: `${height}px`,
		cursor: 'grab'
	}
}

const handleMouseDown = (e: MouseEvent, task: Task) => {
	// Start drag
	startDrag(task, zoneName.value, e)
}

const handleTouchStart = (e: TouchEvent, task: Task) => {
	startDrag(task, zoneName.value, e)
}
</script>

<template>
	<div ref="pileRef" class="task-pile" :class="{ 'is-highlighted': isHighlighted, 'is-shortcuts': listType === 'shortcut' }">
		<h3 class="pile-title">{{ title }}</h3>
		<div ref="contentRef" class="pile-content">
			<TransitionGroup name="task-list">
				<!-- We use a wrapper div for each task to keep the list layout stable -->
				<div v-for="(task, index) in tasks" :key="task.id" class="task-group">
					<!-- Insertion indicator is now ALWAYS present but has 0 height by default -->
					<div class="insertion-indicator" :class="{ 'is-visible': insertionIndex === index }">
						<div class="line"></div>
					</div>

					<div
						class="pile-task"
						:class="{ 'is-active-drag': task.id === activeDraggedTaskId }"
						:style="[
							getChaoticStyle(task),
							{
								'--category-color':
									task.color || categoriesStore.categoriesArray.find((c) => c.name === task.category)?.color || 'var(--color-default)'
							}
						]"
						@mousedown="handleMouseDown($event, task)"
						@touchstart="handleTouchStart($event, task)"
					>
						<TaskItem :task="task" is-compact @edit="emit('edit', $event)" />
					</div>
				</div>

				<!-- Final indicator at the very bottom -->
				<div :key="'bottom-indicator'" class="task-group bottom-indicator-group">
					<div class="insertion-indicator" :class="{ 'is-visible': insertionIndex === tasks.length }">
						<div class="line"></div>
					</div>
				</div>
			</TransitionGroup>

			<div v-if="tasks.length === 0 && !isHighlighted" class="empty-state">
				{{ listType === 'todo' ? 'No tasks to do' : 'No shortcuts yet' }}
			</div>
		</div>
	</div>
</template>

<style scoped>
.task-pile {
	height: 100%;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	background: rgba(255, 255, 255, 0.01);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 1px solid transparent;
	border-radius: 12px;
}

.is-shortcuts {
	background: rgba(255, 255, 255, 0.02);
	border-bottom: 1px solid var(--border-color);
}

.task-pile.is-highlighted {
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
	position: relative;
}

.pile-task {
	--category-color: var(--color-default);
	backface-visibility: hidden;
	-webkit-font-smoothing: antialiased;
	will-change: transform;
	border-radius: 6px;
	transition: all 0.3s ease;
	box-shadow:
		0 0 2px 1px var(--category-color),
		0 2px 5px rgba(0, 0, 0, 0.2);
}

.pile-task.is-active-drag {
	opacity: 0.25;
	pointer-events: none;
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
	z-index: 1;
}

.insertion-indicator {
	height: 0;
	opacity: 0;
	display: flex;
	align-items: center;
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.insertion-indicator.is-visible {
	height: 20px;
	opacity: 1;
}

.insertion-indicator .line {
	height: 4px;
	width: 100%;
	background: var(--accent-color, #4facfe);
	border-radius: 2px;
	box-shadow: 0 0 8px rgba(79, 172, 254, 0.5);
}

.task-group {
	position: relative;
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Bottom group shouldn't move siblings when it appears/disappears */
.bottom-indicator-group {
	transition: none;
}

/* Animations */
.task-list-enter-active {
	transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-list-leave-active {
	transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	position: absolute;
	width: calc(100% - 20px);
	z-index: 0;
}

.task-list-enter-from.task-group {
	opacity: 0;
	transform: scale(0.25) translateY(-20px);
}

/* Ensure indicators don't animate separately if they are part of a group */
.task-list-enter-from.insertion-indicator {
	height: 0;
	opacity: 0;
}

.task-list-leave-to {
	opacity: 0;
	transform: scale(0.8) translateY(20px);
}

.task-list-move {
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
