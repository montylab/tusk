<script setup lang="ts">
import Checkbox from 'primevue/checkbox'
import { computed } from 'vue'

const props = withDefaults(
	defineProps<{
		modelValue: boolean
		label?: string
		description?: string
		inputId?: string
		binary?: boolean
		disabled?: boolean
	}>(),
	{
		binary: true
	}
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
}>()

const internalId = computed(() => props.inputId || `app-checkbox-${Math.random().toString(36).slice(2, 9)}`)

const handleUpdate = (value: any) => {
	emit('update:modelValue', !!value)
}
</script>

<template>
	<div class="app-checkbox-wrapper" :class="{ 'is-disabled': disabled }">
		<Checkbox
			:modelValue="modelValue"
			@update:modelValue="handleUpdate"
			:binary="binary"
			:inputId="internalId"
			:disabled="disabled"
			class="app-checkbox-inner"
		/>
		<div v-if="label || description" class="label-group">
			<label :for="internalId" v-if="label" class="app-checkbox-label">
				{{ label }}
			</label>
			<p v-if="description" class="app-checkbox-description">
				{{ description }}
			</p>
		</div>
	</div>
</template>

<style scoped>
.app-checkbox-wrapper {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-sm, 0.75rem);
	cursor: pointer;
	user-select: none;
	padding: 0.25rem 0;
	transition: opacity 0.2s ease;
}

.app-checkbox-wrapper.is-disabled {
	cursor: not-allowed;
	opacity: 0.6;
}

.label-group {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	line-height: 1.2;
}

.app-checkbox-label {
	font-size: var(--font-base, 0.95rem);
	font-weight: 500;
	color: var(--text-primary);
	cursor: pointer;
}

.app-checkbox-description {
	font-size: 0.75rem;
	color: var(--text-muted);
	margin: 0;
	font-style: italic;
}

.app-checkbox-wrapper:hover .app-checkbox-label {
	color: var(--accent, #6366f1);
}

:deep(.p-checkbox) {
	width: 1.25rem;
	height: 1.25rem;
}

:deep(.p-checkbox .p-checkbox-box) {
	border-radius: var(--radius-sm, 4px);
	border: 2px solid var(--border-color, #e2e8f0);
	background: var(--bg-input, #ffffff);
	transition: all 0.2s ease;
}

:deep(.p-checkbox:not(.p-disabled):not(.p-checkbox-checked):hover .p-checkbox-box) {
	border-color: var(--accent);
}

:deep(.p-checkbox.p-checkbox-checked .p-checkbox-box) {
	background: var(--accent);
	border-color: var(--accent);
}

:deep(.p-checkbox .p-checkbox-box .p-icon) {
	color: var(--text-on-accent, #ffffff);
	width: 0.75rem;
	height: 0.75rem;
}

:deep(.p-checkbox.p-checkbox-checked:not(.p-disabled):hover .p-checkbox-box) {
	background: color-mix(in srgb, var(--accent), white 10%);
	border-color: color-mix(in srgb, var(--accent), white 10%);
}

:deep(.p-checkbox.p-focus .p-checkbox-box) {
	box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--accent), transparent 85%);
}
</style>
