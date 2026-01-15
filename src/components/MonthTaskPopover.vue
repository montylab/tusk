<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Task } from '../types'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{
	task: Task | null
	visible: boolean
	anchorEl: HTMLElement | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'edit', task: Task): void
	(e: 'delete', task: Task): void
}>()

const categoriesStore = useCategoriesStore()
const popoverRef = ref<HTMLElement | null>(null)
const position = ref({ top: 0, left: 0 })

const formatTime = (time: number) => {
	const h = Math.floor(time)
	const m = Math.round((time % 1) * 60)
	return `${h}:${m.toString().padStart(2, '0')}`
}

const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${minutes}m`
	const h = Math.floor(minutes / 60)
	const m = Math.round(minutes % 60)
	return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const categoryColor = () => {
	if (!props.task) return 'var(--color-default)'
	const categoryObj = categoriesStore.categoriesArray.find((c) => c.name === props.task!.category)
	return props.task.color || categoryObj?.color || 'var(--color-default)'
}

const calculatePosition = () => {
	const el = popoverRef.value
	if (!props.anchorEl || !el || !props.visible) return

	const anchor = props.anchorEl.getBoundingClientRect()
	const [pw, ph, pad, gap] = [el.offsetWidth, el.offsetHeight, 12, 8]

	const left = Math.max(pad, Math.min(anchor.left + anchor.width / 2 - pw / 2, window.innerWidth - pw - pad))
	let top = anchor.bottom + gap
	if (top + ph > window.innerHeight - pad) top = anchor.top - ph - gap

	position.value = { top: Math.max(pad, top), left }
}

const handleClickOutside = (e: MouseEvent) => {
	if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
		emit('close')
	}
}

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Escape') {
		emit('close')
	}
}

const handleEdit = () => {
	if (props.task) {
		emit('edit', props.task)
	}
}

const handleDelete = () => {
	if (props.task) {
		emit('delete', props.task)
	}
}

watch(
	() => props.visible,
	(visible) => {
		if (visible) {
			nextTick(() => {
				calculatePosition()
				document.addEventListener('click', handleClickOutside, true)
				document.addEventListener('keydown', handleKeydown)
			})
		} else {
			document.removeEventListener('click', handleClickOutside, true)
			document.removeEventListener('keydown', handleKeydown)
		}
	}
)

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside, true)
	document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
	<Teleport to="body">
		<Transition name="popover">
			<div
				v-if="visible && task"
				ref="popoverRef"
				class="month-task-popover"
				:style="{ top: position.top + 'px', left: position.left + 'px' }"
			>
				<div class="popover-header">
					<div class="color-bar" :style="{ backgroundColor: categoryColor() }"></div>
					<h4 class="title">{{ task.text }}</h4>
				</div>

				<div class="popover-body">
					<div class="info-row" v-if="task.startTime !== null && task.startTime !== undefined">
						<span class="label">Time:</span>
						<span class="value">{{ formatTime(task.startTime) }}</span>
					</div>
					<div class="info-row">
						<span class="label">Duration:</span>
						<span class="value">{{ formatDuration(task.duration) }}</span>
					</div>
					<div class="info-row">
						<span class="label">Category:</span>
						<span class="value category" :style="{ color: categoryColor() }">
							{{ task.category || 'Uncategorized' }}
						</span>
					</div>
					<p v-if="task.description" class="description">{{ task.description }}</p>
				</div>

				<div class="popover-actions">
					<button class="btn edit" @click="handleEdit">Edit</button>
					<button class="btn delete" @click="handleDelete">Delete</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped lang="scss">
.month-task-popover {
	position: fixed;
	z-index: 1000;
	min-width: 200px;
	max-width: 280px;
	background: var(--bg-secondary, #1e1e2e);
	border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
	border-radius: 8px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	overflow: hidden;

	.popover-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);

		.color-bar {
			width: 4px;
			height: 24px;
			border-radius: 2px;
			flex-shrink: 0;
		}

		.title {
			font-size: 0.9rem;
			font-weight: 600;
			color: #fff;
			margin: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.popover-body {
		padding: 0.75rem;

		.info-row {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.375rem;

			.label {
				font-size: 0.75rem;
				color: rgba(255, 255, 255, 0.5);
			}

			.value {
				font-size: 0.8rem;
				color: rgba(255, 255, 255, 0.85);
				font-weight: 500;

				&.category {
					text-transform: uppercase;
					font-size: 0.7rem;
					font-weight: 700;
				}
			}
		}

		.description {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.6);
			margin: 0.5rem 0 0;
			line-height: 1.4;
		}
	}

	.popover-actions {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem 0.75rem;

		.btn {
			flex: 1;
			padding: 0.375rem 0.75rem;
			border: none;
			border-radius: 4px;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;

			&.edit {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: #fff;

				&:hover {
					filter: brightness(1.1);
				}
			}

			&.delete {
				background: rgba(255, 75, 75, 0.15);
				color: #ff4b4b;
				border: 1px solid rgba(255, 75, 75, 0.3);

				&:hover {
					background: rgba(255, 75, 75, 0.25);
				}
			}
		}
	}
}

.popover-enter-active,
.popover-leave-active {
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.popover-enter-from,
.popover-leave-to {
	opacity: 0;
	transform: scale(0.25);
}
</style>
