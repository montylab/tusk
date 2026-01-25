<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'
import { useCategoriesStore } from '../stores/categories'
import AppIcon from './common/AppIcon.vue'

const props = defineProps<{
	task: Task
	isDragging?: boolean
	isShaking?: boolean
	isCompact?: boolean
	status?: 'past' | 'future' | 'on-air' | null
	badgeText?: string
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
	return props.task.startTime + props.task.duration / 60
})

const isAutoCompact = computed(() => props.task.duration <= 30)

const itemStyle = computed(() => {
	const categoryObj = categoriesStore.categoriesArray.find((c) => c.name === props.task.category)
	const color = props.task.color || categoryObj?.color || 'var(--color-default)'
	return { '--category-color': color }
})

const onEditClick = (e: Event) => {
	e.stopPropagation()
	emit('edit', props.task)
}
</script>

<template>
	<div
		class="task-item"
		:class="{
			shaking: isShaking,
			dragging: isDragging,
			'on-air': status === 'on-air',
			'in-past': status === 'past',
			'in-future': status === 'future',
			'is-compact': isCompact,
			'is-auto-compact': isAutoCompact,
			['time-size-' + task.duration]: true
		}"
		:style="itemStyle"
		@dblclick="emit('edit', task)"
	>
		<div v-if="status === 'on-air'" class="on-air-tag">ON AIR</div>
		<div class="color-stripe"></div>
		<div class="content">
			<div class="main-info">
				<h4 class="title">{{ task.text }}</h4>

				<div class="meta">
					<span class="time-badge" v-if="task.startTime !== null && task.startTime !== undefined">
						{{ formatTime(task.startTime) }} - {{ endTime !== null ? formatTime(endTime) : '?' }}
					</span>
					<span class="duration-badge">
						{{ formatDuration(task.duration) }}
					</span>
				</div>

				<p v-if="task.description && !isCompact && !isAutoCompact" class="description-text">
					{{ task.description }}
				</p>
			</div>

			<div class="header-actions">
				<button class="edit-btn" @mousedown.stop @click="onEditClick" title="Edit Task">
					<AppIcon name="pencil" size="0.8rem" />
				</button>
			</div>

			<div class="badges">
				<span class="category-badge badge">{{ task.category || 'Uncategorized' }}</span>
				<span v-if="task.isDeepWork" class="deep-work-badge badge" title="Deep Work task">
					<AppIcon name="brain" size="0.8rem" />
					<span>DEEP</span>
				</span>
			</div>
		</div>
		<div v-if="badgeText" class="shortcut-badge">{{ badgeText }}</div>
	</div>
</template>

<style scoped lang="scss">
.task-item {
	// 1. Typography & Colors
	--category-color: var(--color-default);
	--font-size-title: var(--font-lg);
	--font-size-description: var(--font-base);
	--font-size-badge: var(--font-sm);
	--font-size-meta: var(--font-sm);
	--font-size-tag: var(--font-xs);

	background: var(--bg-task-item);
	border-radius: var(--radius-md);
	cursor: grab;
	user-select: none;
	display: flex;
	border: 1px solid var(--category-color);
	width: 100%;
	height: 100%;
	box-shadow: var(--shadow-sm);
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;

	&:hover {
		background: var(--surface-hover);
		.shortcut-badge {
			opacity: 1;
			visibility: visible;
		}
	}

	// 2. Base Components
	.color-stripe {
		width: 0.35rem;
		height: 100%;
		flex-shrink: 0;
		background: var(--category-color);
		border-radius: var(--radius-md) 0 0 var(--radius-md);
	}

	.content {
		padding: var(--spacing-sm) var(--spacing-sm);
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		overflow: hidden;

		.main-info {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			justify-content: center;
			row-gap: 0;
			flex: 1;
			min-width: 0; // Allow shrinking for ellipsis

			.title {
				font-size: var(--font-size-title);
				line-height: 1.25;
				font-weight: 600;
				color: var(--text-primary);
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				width: 100%;
			}

			.meta {
				display: flex;
				gap: 0.75rem;
				white-space: nowrap;

				.time-badge,
				.duration-badge {
					font-size: var(--font-size-meta);
					color: var(--text-meta);
					font-weight: 500;
				}
			}

			.description-text {
				font-size: var(--font-size-description);
				color: var(--text-description);
				margin: 0;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				line-height: 1.2;
				width: 100%;
			}
		}

		.header-actions {
			display: flex;
			align-items: center;
			margin-left: auto;
			gap: var(--spacing-xs);
			opacity: 0.25;
			transition: opacity 0.2s ease;

			.edit-btn {
				background: var(--bg-action-btn);
				border: 1px solid var(--border-color);
				border-radius: var(--radius-sm);
				color: var(--text-primary);
				width: 1.25rem;
				height: 1.25rem;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.2s ease;
				margin: 0 0.5rem;

				&:hover {
					background: var(--category-color);
					border-color: #fff;
					transform: scale(1.1);
				}
			}
		}

		.badges {
			display: flex;
			align-items: center;
			gap: var(--spacing-sm);

			.badge {
				font-size: var(--font-size-badge);
				border-radius: var(--radius-sm);
				padding: 0 var(--spacing-xs);
				font-weight: 700;
				white-space: nowrap;
				text-transform: uppercase;
				flex-shrink: 0;

				&.category-badge {
					opacity: 0.9;
					border: 1px solid var(--category-color);
					color: var(--category-color);
				}

				&.deep-work-badge {
					display: flex;
					align-items: center;
					gap: 3px;
					background: var(--bg-deep-work);
					color: var(--text-on-accent);
					letter-spacing: 0.5px;
				}
			}
		}
	}

	.on-air-tag {
		position: absolute;
		top: calc(var(--spacing-sm) * -1);
		right: var(--spacing-sm);
		background: var(--bg-on-air);
		color: var(--text-on-accent);
		font-size: var(--font-size-tag);
		font-weight: 800;
		padding: 0.125rem var(--spacing-sm);
		border-radius: var(--radius-sm);
		z-index: 1000;
		letter-spacing: 0.5px;
		box-shadow: 0 0 20px -5px color-mix(in srgb, var(--bg-page), transparent 25%);
		pointer-events: none;
	}

	// 3. State-based Overrides
	&.is-compact {
		--font-size-title: 0.875rem;
		--font-size-meta: 0.75rem;
		--font-size-badge: 0.7rem;

		.content {
			padding: 0.375rem 0.5rem;

			.main-info {
				.meta {
					gap: 0.4rem;
					.time-badge {
						display: none;
					}
				}
			}

			.badges {
				margin-left: auto;
				gap: 0.25rem;
			}
		}
	}

	&.time-size-30,
	&.is-auto-compact {
		--font-size-title: 0.8rem;
		--font-size-meta: 0.75rem;
		--font-size-tag: 0.625rem;

		.content .main-info {
			row-gap: 0;
		}
	}

	&.time-size-15 {
		--font-size-title: 0.8rem;
		--font-size-meta: 0.75rem;
		--font-size-tag: 0.625rem;

		.content {
			padding: 0 0 0 10px;
			position: relative;
			overflow: hidden;
			border-radius: 5px;

			.main-info {
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				gap: 0.5rem;
				flex: none;

				.meta {
					margin-left: auto;
				}
			}

			.edit-btn {
				transform: scale(0.8);
			}
		}
	}

	// 4. Interactions
	&.dragging {
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		cursor: grabbing;
	}

	&.shaking {
		animation: shake 0.4s infinite ease-in-out;
	}

	&:active {
		cursor: grabbing;
	}

	&:hover {
		.content .header-actions {
			opacity: 1;
		}
	}
	.shortcut-badge {
		position: absolute;
		top: 0;
		right: 0;
		transform: translateY(-100%);
		background: var(--category-color);
		color: var(--text-on-accent);
		font-size: 0.7rem;
		line-height: 1.4;
		font-weight: 700;
		padding: 0px 4px;
		border-radius: 4px 4px 0 0;
		z-index: 10;
		pointer-events: none;
		text-transform: uppercase;
		border: 1px solid var(--category-color);
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}
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

/* ==========================================================================
	   SCHEMES
	   ========================================================================== */

// --- Solid (Default) ---
[data-scheme='solid'] .task-item {
	&.in-past {
		background: color-mix(in srgb, var(--category-color), var(--bg-page) 70%);
	}

	&.on-air {
		background: var(--category-color);
		color: var(--text-on-accent, #fff);
	}

	&.in-future {
		background: color-mix(in srgb, var(--category-color), var(--bg-page) 30%);
	}
}

// --- Neo (Option 1 - previously Contrast) ---
[data-scheme='neo'] .task-item {
	&.in-past {
		filter: grayscale(0.5);
		opacity: 0.5;
		background: var(--bg-card);
		border-style: solid;
	}

	&.on-air {
		background: var(--category-color);
		color: #fff;
		z-index: 10;
		border-color: rgba(255, 255, 255, 0.4);
	}

	&.in-future {
		background: transparent;
		border: 2px dashed var(--category-color);
		opacity: 0.8;
	}
}

// --- Glass (Option 2) ---
[data-scheme='glass'] .task-item {
	&.in-past {
		background: rgba(255, 255, 255, 0.02);
		border-color: color-mix(in srgb, var(--category-color), transparent 50%);
		opacity: 0.8;
	}

	&.on-air {
		background: color-mix(in srgb, var(--category-color), transparent 20%);
		.badge.category-badge {
			color: var(--text-on-accent, #fff);
			background: var(--category-color);
		}
	}

	&.in-future {
		background: color-mix(in srgb, var(--category-color), transparent 70%);
		// border: 1px solid color-mix(in srgb, var(--category-color), transparent 50%);
	}
}

// --- Ink (Option 3 - previously Minimal) ---
[data-scheme='ink'] .task-item {
	&.in-past {
		background: color-mix(in srgb, var(--bg-card), transparent 20%);
		border-color: color-mix(in srgb, var(--category-color), transparent 50%);
		opacity: 0.8;
	}

	&.on-air {
		background: var(--category-color);

		.badge.category-badge {
			color: var(--text-on-accent, #fff);
			border-color: var(--text-on-accent, #fff);
		}
	}

	&.in-future {
		// background-image: repeating-linear-gradient(
		// 	45deg,
		// 	transparent,
		// 	transparent 10px,
		// 	color-mix(in srgb, var(--category-color), transparent 95%) 10px,
		// 	color-mix(in srgb, var(--category-color), transparent 95%) 20px
		// );
		background: color-mix(in srgb, var(--category-color), transparent 15%);
		border: 1px solid color-mix(in srgb, var(--category-color), transparent 40%);

		.badge.category-badge {
			color: var(--text-on-accent, #fff);
			border-color: var(--text-on-accent, #fff);
		}
	}
}
</style>
