<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import { useSettingsStore } from '../stores/settings'
import ColorPickerInput from './ColorPickerInput.vue'
import AppCheckbox from './common/AppCheckbox.vue'

const props = defineProps<{
	name: string
	color: string
	isDeepWork: boolean
}>()

const emit = defineEmits<{
	(e: 'update:name', value: string): void
	(e: 'update:color', value: string): void
	(e: 'update:isDeepWork', value: boolean): void
}>()

const categoriesStore = useCategoriesStore()
const settingsStore = useSettingsStore()

// Autocomplete suggestions
const filteredSuggestions = ref<Array<{ name: string; color: string; isNew?: boolean }>>([])

// PrimeVue AutoComplete search method
const searchCategory = (event: { query: string }) => {
	const query = (event.query || '').trim().toLowerCase()

	// Filter categories from store
	let _filtered = categoriesStore.categoriesArray
		.filter((cat) => cat.name.toLowerCase().includes(query))
		.map((cat) => ({
			name: cat.name,
			color: cat.color,
			isNew: false
		}))

	const exactMatch = _filtered.some((cat) => cat.name.toLowerCase() === query)

	if (!exactMatch && query) {
		const suggestedColor = settingsStore.getRandomCategoryColor()
		_filtered.push({ name: event.query, color: suggestedColor, isNew: true })
	}

	filteredSuggestions.value = _filtered
}

// Handle selection from AutoComplete
const onCategorySelect = (event: any) => {
	const item = event.value
	emit('update:name', item.name)
	emit('update:color', item.color)

	// Find the actual category to get its isDeepWork value
	const fullCat = categoriesStore.categoriesArray.find((c) => c.name === item.name)
	if (fullCat) {
		emit('update:isDeepWork', !!fullCat.isDeepWork)
	} else {
		emit('update:isDeepWork', false)
	}
}

// Internal model for AutoComplete
const nameInput = ref<string | any>(props.name)
watch(
	() => props.name,
	(newValue) => {
		nameInput.value = newValue
	}
)

watch(nameInput, (newValue) => {
	const nameStr = typeof newValue === 'string' ? newValue : newValue?.name || ''

	emit('update:name', nameStr)

	if (!nameStr) {
		emit('update:color', '')
		emit('update:isDeepWork', false)
		return
	}

	const query = nameStr.toLowerCase()
	const foundCategory = categoriesStore.categoriesArray.find((cat) => cat.name.toLowerCase() === query)

	if (foundCategory) {
		emit('update:color', foundCategory.color)
		emit('update:isDeepWork', !!foundCategory.isDeepWork)
	} else if (nameStr.trim()) {
		emit('update:isDeepWork', false)
	} else {
		emit('update:color', '')
		emit('update:isDeepWork', false)
	}
})

const colorInput = ref(props.color)
watch(
	() => props.color,
	(newValue) => {
		if (!newValue) {
			// Check if current name already exists in store
			const val = nameInput.value
			const nameStr = typeof val === 'string' ? val : val?.name || ''
			const existing = categoriesStore.categoriesArray.find((c) => c.name.toLowerCase() === nameStr.toLowerCase())

			if (existing) {
				colorInput.value = existing.color
			} else {
				colorInput.value = settingsStore.getRandomCategoryColor()
			}
			emit('update:color', colorInput.value)
		} else {
			colorInput.value = newValue
		}
	},
	{ immediate: true }
)
watch(colorInput, (newValue) => {
	if (!newValue) {
		emit('update:color', '')
		return
	}
	const finalColor = newValue.startsWith('#') ? newValue : '#' + newValue
	emit('update:color', finalColor)
})

const isNewCategory = computed(() => {
	const val = nameInput.value
	const nameStr = typeof val === 'string' ? val : val?.name || ''
	const query = nameStr.trim().toLowerCase()
	if (!query) return false
	return !categoriesStore.categoriesArray.some((cat) => cat.name.toLowerCase() === query)
})
</script>

<template>
	<div class="category-selector-container">
		<div class="category-input-row">
			<div class="autocomplete-wrapper">
				<AutoComplete
					v-model="nameInput"
					:suggestions="filteredSuggestions"
					option-label="name"
					@complete="searchCategory"
					@item-select="onCategorySelect"
					placeholder="Type to search or create..."
					dropdown
					input-class="form-input"
					panel-class="p-autocomplete-panel-custom"
					class="p-autocomplete-root-custom"
				>
					<template #option="slotProps">
						<div class="autocomplete-option">
							<div>
								{{ slotProps.option.name }}
							</div>
							<div v-if="!isNewCategory" class="option-color-preview" :style="{ background: slotProps.option.color }"></div>
						</div>
					</template>
				</AutoComplete>
			</div>

			<div class="deep-work-toggle" v-if="isNewCategory">
				<AppCheckbox
					inputId="new-cat-deep-work-selector"
					:modelValue="isDeepWork"
					@update:modelValue="(val: boolean) => emit('update:isDeepWork', val)"
					label="Deep Work"
				/>
			</div>
		</div>

		<div class="color-picker-row" v-if="isNewCategory">
			<label class="sub-label">Choose Color:</label>
			<ColorPickerInput v-model="colorInput" />
		</div>
	</div>
</template>

<style scoped>
.category-selector-container {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
}

.category-input-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.autocomplete-wrapper {
	flex: 1;
	width: 100%;
}

/* PrimeVue AutoComplete specific styling */
.p-autocomplete-root-custom {
	width: 100%;
}

:deep(.p-autocomplete-input) {
	width: 100%;
	padding-right: 3rem;
}

:deep(.p-autocomplete-panel-custom) {
	background: var(--bg-popover) !important;
	border: 1px solid var(--border-color) !important;
	border-radius: var(--radius-md) !important;
	max-height: 15rem;
	overflow-y: auto;
	z-index: 10001;
	box-shadow: var(--shadow-lg);
	backdrop-filter: blur(calc(var(--ui-scale) * 10px));
	margin-top: var(--spacing-sm);
	padding: 0;
}

:deep(.p-autocomplete-list) {
	padding: 0;
	margin: 0;
	list-style: none;
}

.autocomplete-option {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}

.option-color-preview {
	width: 1.5rem;
	height: 1.5rem;
	border-radius: var(--radius-sm);
	border: 2px solid var(--border-color);
	pointer-events: none;
	box-shadow: var(--shadow-sm);
}

/* Deep Work Toggle */
.deep-work-toggle {
	display: flex;
	align-items: center;
	white-space: nowrap;
}

/* Color Picker Row */
.color-picker-row {
	background: color-mix(in srgb, var(--bg-popover), transparent 50%);
	border-radius: var(--radius-md);
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	animation: fadeIn 0.3s ease;
}

.sub-label {
	font-size: 0.75rem;
	text-transform: uppercase;
	color: var(--text-meta);
	font-weight: 600;
	letter-spacing: 0.5px;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-5px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* Reusing form-input style from parent or defining it here if needed */
:deep(.form-input) {
	background: var(--bg-input);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 0.75rem var(--spacing-md);
	color: var(--text-primary);
	font-size: var(--font-base);
	transition: all 0.2s ease;
	outline: none;
	width: 100%;
}

:deep(.form-input:focus) {
	background: color-mix(in srgb, var(--text-primary), transparent 92%);
	border-color: color-mix(in srgb, var(--accent), transparent 50%);
	box-shadow: 0 0 0 calc(var(--ui-scale) * 3px) color-mix(in srgb, var(--accent), transparent 90%);
}

:deep(.form-input::placeholder) {
	color: var(--text-muted);
	opacity: 0.4;
}
</style>
