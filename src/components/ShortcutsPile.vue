<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'
import { useCategoriesStore } from '../stores/categories'
import { ref, watch } from 'vue'

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const { shortcutTasks } = storeToRefs(tasksStore)

const props = defineProps<{
	isHighlighted?: boolean
	activeTaskId?: number
}>()

const emit = defineEmits<{
	(e: 'drag-start', payload: { event: MouseEvent; task: Task }): void
	(e: 'update:bounds', bounds: DOMRect): void
	(e: 'update:insertion-index', index: number | null): void
}>()

const pileRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

import { onMounted, onUnmounted } from 'vue'

watch(
	pileRef,
	(el) => {
		if (el) {
			emit('update:bounds', el.getBoundingClientRect())
		}
	},
	{ immediate: true }
)

const getCategoryColor = (category: string) => {
	return categoriesStore.categoriesArray.find((c) => c.name === category)?.color || 'var(--color-default)'
}

const getChaoticStyle = (id: string | number) => {
	const getSeed = (val: string | number) => {
		if (typeof val === 'number') return val
		let hash = 0
		for (let i = 0; i < val.length; i++) {
			hash = (hash << 5) - hash + val.charCodeAt(i)
			hash |= 0
		}
		return Math.abs(hash)
	}
	const seed = (getSeed(id) * 1337) % 100
	const rotation = (seed % 7) - 3 // -3 to 3 degrees
	const xOffset = (seed % 4) * 3 - 6 // -6 to 6px

	return {
		transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
		margin: '10px 0',
		width: '100%',
		cursor: 'grab'
	}
}

const insertionIndex = ref<number | null>(null)

const handleMouseMove = (e: MouseEvent) => {
	if (!props.isHighlighted || !contentRef.value) {
		if (insertionIndex.value !== null) {
			insertionIndex.value = null
			emit('update:insertion-index', null)
		}
		return
	}

	const tasks = Array.from(contentRef.value.querySelectorAll('.pile-task')) as HTMLElement[]

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
		emit('update:insertion-index', newIndex)
	}
}

onMounted(() => {
	window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
	window.removeEventListener('mousemove', handleMouseMove)
})

const handleMouseDown = (e: MouseEvent, task: Task) => {
	emit('drag-start', { event: e, task })
}
</script>

<template>
	<div ref="pileRef" class="shortcuts-pile" :class="{ 'is-highlighted': isHighlighted }">
		<h3 class="pile-title">Shortcuts</h3>
		<div ref="contentRef" class="pile-content">
			<TransitionGroup name="task-list">
				<template v-for="(task, index) in shortcutTasks" :key="task.id">
					<!-- Physical separator -->
					<div v-if="insertionIndex === index" :key="'indicator-' + index" class="insertion-indicator">
						<div class="line"></div>
					</div>

					<div
						class="pile-task"
						:class="{ 'is-active-drag': task.id === activeTaskId }"
						:style="{
							...getChaoticStyle(task.id),
							boxShadow: `0 0 2px 1px ${getCategoryColor(task.category)}, 0 2px 5px rgba(0,0,0,0.2)`
						}"
						@mousedown="handleMouseDown($event, task)"
					>
						<TaskItem :task="task" :isCompact="true" />
					</div>
				</template>

				<!-- Bottom separator -->
				<div v-if="insertionIndex === shortcutTasks.length" :key="'indicator-end'" class="insertion-indicator">
					<div class="line"></div>
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
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}
.pile-task.is-active-drag {
	opacity: 0.1;
	pointer-events: none;
	transform: scale(0.95) !important;
}

.pile-task :deep(.task-item) {
	border: none;
	box-shadow: none;
}

.insertion-indicator {
	height: 20px;
	display: flex;
	align-items: center;
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.insertion-indicator .line {
	height: 4px;
	width: 100%;
	background: var(--accent-color, #4facfe);
	border-radius: 2px;
	box-shadow: 0 0 8px rgba(79, 172, 254, 0.5);
}

/* Entering indicator starts at 0 height */
.task-list-enter-from.insertion-indicator {
	height: 0;
	opacity: 0;
}

.pile-task {
	/* Antialiasing improvements for rotated elements */
	backface-visibility: hidden;
	-webkit-font-smoothing: antialiased;
	will-change: transform;
	border-radius: 6px;
	overflow: hidden;
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}

.pile-task.is-active-drag {
	opacity: 0.1;
	pointer-events: none;
	transform: scale(0.95) !important;
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

.task-list-enter-from.pile-task {
	opacity: 0;
	transform: scale(0.25) translateY(-20px);
}

.task-list-leave-to {
	opacity: 0;
	transform: scale(0.8) translateY(20px);
}

.task-list-move {
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
