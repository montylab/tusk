<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import type { Task } from '../types'
import CategorySelector from './CategorySelector.vue'
import TaskDateTimePicker from './TaskDateTimePicker.vue'
import AppIcon from './common/AppIcon.vue'

const props = defineProps<{
	show: boolean
	initialStartTime?: number | null
	initialDate?: string | null
	taskType?: 'todo' | 'shortcut' | 'scheduled'
	task?: Task | null // Prop for editing
	startCompact?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(
		e: 'create',
		payload: {
			text: string
			description: string
			category: string
			isDeepWork: boolean
			startTime?: number | null
			duration?: number
			date?: string | null
		}
	): void
	(e: 'update', payload: { id: string | number; updates: Partial<Task> }): void
}>()

const categoriesStore = useCategoriesStore()

// Form fields
const taskText = ref('')
const taskDescription = ref('')
const categoryInput = ref('')
const selectedColor = ref('')
const isDeepWork = ref(false)
const duration = ref(1.0) // Store as decimal hours (1.0 = 60 mins)
const isExpanded = ref(false)

const getTodayString = () => {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const startTime = ref<number | null>(props.initialStartTime ?? null)
const taskDate = ref<string | null>(props.initialDate ?? getTodayString())

const isEditMode = computed(() => !!props.task)
const isCompactView = computed(() => props.startCompact && !isExpanded.value && !isEditMode.value)

const formatTime = (time: number) => {
	const h = Math.floor(time)
	const m = Math.round((time % 1) * 60)
	return `${h}:${m.toString().padStart(2, '0')}`
}

const projectedEndTime = computed(() => {
	if (startTime.value === null) return null
	return startTime.value + duration.value
})

const displayDate = computed(() => {
	if (!taskDate.value) return ''
	return new Date(taskDate.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

// Initialize form from props/task
const resetForm = () => {
	isExpanded.value = false
	if (props.task) {
		taskText.value = props.task.text
		taskDescription.value = props.task.description || ''
		categoryInput.value = props.task.category
		selectedColor.value = props.task.color || ''
		duration.value = (props.task.duration || 60) / 60
		startTime.value = props.task.startTime ?? null
		taskDate.value = props.task.date ?? getTodayString()
		isDeepWork.value = !!props.task.isDeepWork
	} else {
		taskText.value = ''
		taskDescription.value = ''
		categoryInput.value = ''
		selectedColor.value = ''
		isDeepWork.value = false
		duration.value = 1.0
		startTime.value = props.initialStartTime ?? (props.taskType === 'scheduled' ? 9 : null)
		taskDate.value = props.initialDate ?? getTodayString()
	}
}

// Handle form submission
const handleSubmit = async () => {
	if (!taskText.value.trim()) return

	const finalCategoryName = categoryInput.value.trim() || 'Default'
	const finalColor = selectedColor.value || '#667eea' // fallback

	// Persist category if new
	await categoriesStore.ensureCategoryExists(finalCategoryName, finalColor, isDeepWork.value)

	if (isEditMode.value && props.task) {
		emit('update', {
			id: props.task.id,
			updates: {
				text: taskText.value.trim(),
				description: taskDescription.value.trim(),
				category: finalCategoryName,
				startTime: startTime.value,
				duration: Math.round(duration.value * 60),
				date: taskDate.value,
				isDeepWork: isDeepWork.value
			}
		})
	} else {
		emit('create', {
			text: taskText.value.trim(),
			description: taskDescription.value.trim(),
			category: finalCategoryName,
			isDeepWork: isDeepWork.value,
			startTime: props.taskType === 'scheduled' ? (startTime.value ?? 9) : null,
			duration: Math.round(duration.value * 60),
			date: taskDate.value
		})
	}

	handleClose()
}

const handleClose = () => {
	emit('close')
}

// Reset form when visibility or task prop changes
watch(
	[() => props.show, () => props.task],
	([newShow], [oldShow]) => {
		if (newShow) {
			resetForm()
			if (newShow && !oldShow) {
				setTimeout(() => {
					taskTextInput.value?.focus()
				}, 100)
			}
		}
	},
	{ immediate: true }
)

const taskTextInput = ref<HTMLInputElement | null>(null)

// Handle Escape key to close popup
const handleKeyDown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && props.show) {
		handleClose()
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
	<Teleport to="body">
		<Transition name="popup">
			<div v-if="show" class="popup-overlay" @mousedown.self="handleClose">
				<div class="popup-container" :class="{ compact: isCompactView }">
					<div class="popup-header">
						<h2>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h2>
						<button class="close-btn" @click="handleClose">
							<AppIcon name="close" size="1.25rem" />
						</button>
					</div>

					<form @submit.prevent="handleSubmit" class="popup-form">
						<!-- Task Name -->
						<div class="form-group">
							<label for="task-text">Task Name</label>
							<input
								id="task-text"
								ref="taskTextInput"
								v-model="taskText"
								type="text"
								placeholder="Enter task name..."
								class="form-input"
								required
							/>
						</div>

						<div class="compact-row" v-if="isCompactView">
							<!-- Category with Autocomplete -->
							<div class="form-group flex-1">
								<label for="category">Category</label>
								<CategorySelector v-model:name="categoryInput" v-model:color="selectedColor" v-model:isDeepWork="isDeepWork" />
							</div>

							<!-- Duration -->
							<div class="form-group duration-group" v-if="taskType !== 'todo'">
								<label for="duration">Duration</label>
								<TaskDateTimePicker v-model:time="duration" view="time-only" />
							</div>
						</div>

						<div v-else>
							<!-- Category with Autocomplete -->
							<div class="form-group">
								<label for="category">Category</label>
								<CategorySelector v-model:name="categoryInput" v-model:color="selectedColor" v-model:isDeepWork="isDeepWork" />
							</div>

							<!-- Duration -->
							<div class="form-group" v-if="taskType !== 'todo' || isEditMode">
								<label for="duration">Duration (HH:mm)</label>
								<TaskDateTimePicker v-model:time="duration" view="time-only" />
							</div>
						</div>

						<!-- Compact Read-only Metadata -->
						<div v-if="isCompactView && taskType === 'scheduled'" class="compact-meta">
							<div class="meta-item">
								<span class="meta-label">Date:</span>
								<span class="meta-value">{{ displayDate }}</span>
							</div>
							<div class="meta-item" v-if="startTime !== null">
								<span class="meta-label">Start:</span>
								<span class="meta-value">{{ formatTime(startTime) }}</span>
							</div>
							<div class="meta-item ml-auto">
								<div class="checkbox-small">
									<input id="deep-work-compact" v-model="isDeepWork" type="checkbox" />
									<label for="deep-work-compact">Deep Work</label>
								</div>
							</div>
						</div>

						<div v-if="!isCompactView && (taskType === 'scheduled' || (isEditMode && startTime !== null))" class="form-group">
							<div class="label-with-preview">
								<label>Date & Time</label>
								<span v-if="projectedEndTime !== null" class="end-time-preview"> Ends at {{ formatTime(projectedEndTime) }} </span>
							</div>
							<TaskDateTimePicker v-model:date="taskDate" v-model:time="startTime" />
						</div>

						<!-- Deep Work Toggle (Full) -->
						<div class="form-group" v-if="!isCompactView">
							<div class="checkbox-group">
								<input id="deep-work" v-model="isDeepWork" type="checkbox" class="form-checkbox" />
								<label for="deep-work" class="checkbox-label">Deep Work</label>
								<div class="deep-work-hint">Focused, uninterrupted work</div>
							</div>
						</div>

						<!-- Task Description -->
						<div class="form-group" v-if="!isCompactView">
							<label for="task-description">Description</label>
							<textarea
								id="task-description"
								v-model="taskDescription"
								placeholder="Add details..."
								class="form-input"
								rows="3"
								style="resize: vertical; min-height: 80px"
							></textarea>
						</div>

						<!-- Expand Button -->
						<div v-if="isCompactView" class="expand-container">
							<button type="button" class="expand-btn" @click="isExpanded = true">Show more options</button>
						</div>

						<!-- Actions -->
						<div class="form-actions">
							<button type="button" class="btn btn-secondary" @click="handleClose">Cancel</button>
							<button type="submit" class="btn btn-primary">
								{{ isEditMode ? 'Save Changes' : 'Create Task' }}
							</button>
						</div>
					</form>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.label-with-preview {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
}

.label-with-preview label {
	margin-bottom: 0;
}

.end-time-preview {
	font-size: 0.75rem;
	color: var(--accent);
	font-weight: 600;
	background: color-mix(in srgb, var(--accent), transparent 90%);
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
}

.popup-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--bg-overlay);
	backdrop-filter: blur(calc(var(--ui-scale) * 8px));
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--spacing-lg);
}

.popup-container {
	background: var(--bg-popover);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-lg);
	width: 100%;
	max-width: 31.25rem;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(calc(var(--ui-scale) * 30px));
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--spacing-lg) var(--spacing-xl);
	border-bottom: 1px solid var(--border-color);
	background: color-mix(in srgb, var(--text-primary), transparent 97%);
	flex-shrink: 0;
}

.popup-header h2 {
	margin: 0;
	font-size: var(--font-xl);
	font-weight: 700;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.close-btn {
	background: transparent;
	border: none;
	color: var(--text-meta);
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
}

.close-btn:hover {
	background: var(--surface-hover);
	color: var(--text-primary);
}

.popup-form {
	padding: var(--spacing-xl);
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
	overflow-y: auto;
	flex: 1;

	/* Custom Scrollbar */
	&::-webkit-scrollbar {
		width: 6px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--text-primary), transparent 90%);
		border-radius: 10px;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--text-primary), transparent 80%);
	}
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	position: relative;
}

.form-group label {
	font-size: var(--font-sm);
	font-weight: 600;
	color: var(--text-meta);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.form-input {
	background: var(--bg-input);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 0.75rem var(--spacing-md);
	color: var(--text-primary);
	font-size: var(--font-base);
	transition: all 0.2s ease;
	outline: none;
}

.form-input:focus {
	background: color-mix(in srgb, var(--text-primary), transparent 92%);
	border-color: color-mix(in srgb, var(--accent), transparent 50%);
	box-shadow: 0 0 0 calc(var(--ui-scale) * 3px) color-mix(in srgb, var(--accent), transparent 90%);
}

.form-input::placeholder {
	color: var(--text-muted);
	opacity: 0.4;
}

.time-preview {
	font-size: 0.875rem;
	color: var(--text-meta);
	margin-top: 0.25rem;
}

.checkbox-group {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	background: var(--bg-input);
	padding: 0.75rem var(--spacing-md);
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
	transition: all 0.2s ease;
}

.checkbox-group:hover {
	background: var(--surface-hover);
	border-color: color-mix(in srgb, var(--accent), transparent 70%);
}

.checkbox-group:has(.form-checkbox:checked) {
	background: color-mix(in srgb, var(--accent), transparent 90%);
	border-color: color-mix(in srgb, var(--accent), transparent 60%);
}

.form-checkbox {
	width: 1.375rem;
	height: 1.375rem;
	cursor: pointer;
	accent-color: #7c3aed;
	border-radius: 0.375rem;
	transition: all 0.2s ease;
}

.checkbox-label {
	font-size: 1rem;
	font-weight: 600;
	color: var(--text-primary);
	cursor: pointer;
	margin: 0 !important;
	text-transform: none !important;
}

.deep-work-hint {
	margin-left: auto;
	font-size: 0.75rem;
	color: var(--text-muted);
	opacity: 0.6;
	font-style: italic;
}

.form-actions {
	display: flex;
	gap: 1rem;
	margin-top: 1rem;
}

.btn {
	flex: 1;
	padding: 0.875rem var(--spacing-lg);
	border: none;
	border-radius: var(--radius-md);
	font-size: var(--font-base);
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.btn-secondary {
	background: var(--surface-hover);
	color: var(--text-primary);
	border: 1px solid var(--border-color);
}

.btn-secondary:hover {
	background: color-mix(in srgb, var(--text-primary), transparent 90%);
	border-color: var(--accent);
}

.btn-primary {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: var(--text-on-accent);
	box-shadow: 0 4px calc(var(--ui-scale) * 15px) rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
	box-shadow: 0 6px calc(var(--ui-scale) * 20px) rgba(102, 126, 234, 0.4);
	transform: translateY(calc(var(--ui-scale) * -1px));
}

.btn-primary:active {
	transform: translateY(0);
}

/* Compact View Styles */
.popup-container.compact {
	max-width: 28.125rem;
}

.popup-container.compact .popup-header {
	padding: 1rem 1.5rem;
}

.popup-container.compact .popup-form {
	padding: 1.5rem;
	gap: 1rem;
}

.compact-row {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}

.flex-1 {
	flex: 1;
}

.duration-group {
	width: 120px;
}

.compact-meta {
	display: flex;
	align-items: center;
	gap: var(--spacing-lg);
	background: color-mix(in srgb, var(--text-primary), transparent 97%);
	padding: 0.625rem var(--spacing-sm);
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 0.375rem;
}

.meta-label {
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--text-meta);
	text-transform: uppercase;
}

.meta-value {
	font-size: 0.8125rem;
	color: var(--text-primary);
	font-weight: 500;
}

.ml-auto {
	margin-left: auto;
}

.checkbox-small {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.checkbox-small input {
	width: 1rem;
	height: 1rem;
	cursor: pointer;
	accent-color: #7c3aed;
}

.checkbox-small label {
	font-size: 0.8125rem;
	color: var(--text-meta);
	cursor: pointer;
	text-transform: none !important;
	font-weight: 500 !important;
	margin: 0 !important;
}

.expand-container {
	display: flex;
	justify-content: center;
	margin: 0.25rem 0;
}

.expand-btn {
	background: transparent;
	border: none;
	color: var(--color-primary, #667eea);
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	transition: all 0.2s ease;
}

.expand-btn:hover {
	background: rgba(102, 126, 234, 0.1);
	text-decoration: underline;
}

/* Transitions */
.popup-enter-active,
.popup-leave-active {
	transition: opacity 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
	opacity: 0;
}
</style>
