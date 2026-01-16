<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'

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

// Autocomplete suggestions
const filteredSuggestions = ref<Array<{ name: string; color: string; isNew?: boolean }>>([])

// Generate a random hex color for a new category
const generateColorForCategory = (): string => {
	return (
		'#' +
		Math.floor(Math.random() * 16777215)
			.toString(16)
			.padStart(6, '0')
			.toUpperCase()
	)
}

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
		const suggestedColor = generateColorForCategory()
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
				colorInput.value = generateColorForCategory()
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

const showHint = ref(false)
let hintTimeout: any = null

const handlePickerClick = () => {
	if (!isNewCategory.value) {
		showHint.value = true
		if (hintTimeout) clearTimeout(hintTimeout)
		hintTimeout = setTimeout(() => {
			showHint.value = false
		}, 3000)
	}
}
</script>

<template>
	<div class="category-input-wrapper">
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

		<div class="color-picker-container" @click="handlePickerClick">
			<ColorPicker v-model="colorInput" :disabled="!isNewCategory" class="color-preview" size="large" />
			<Transition name="hint-fade">
				<div v-if="showHint" class="picker-hint">Only new categories can choose color</div>
			</Transition>
		</div>

		<div class="deep-work-toggle" v-if="isNewCategory">
			<label class="toggle-container" title="Deep Work category">
				<input type="checkbox" :checked="isDeepWork" @change="emit('update:isDeepWork', ($event.target as HTMLInputElement).checked)" />
				<span class="toggle-label">Deep Work</span>
			</label>
		</div>
	</div>
</template>

<style scoped>
.category-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-direction: row;
}

/* PrimeVue AutoComplete specific styling */
.p-autocomplete-root-custom {
	flex: 1;
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

.color-preview {
	margin-left: 1rem;
	--p-colorpicker-preview-width: 3rem;
	--p-colorpicker-preview-height: 3rem;
}

.color-picker-container {
	position: relative;
	display: flex;
	align-items: center;
}

.picker-hint {
	position: absolute;
	bottom: 110%;
	right: 0;
	background: var(--bg-popover);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	padding: var(--spacing-sm) var(--spacing-md);
	border-radius: var(--radius-md);
	font-size: var(--font-xs);
	white-space: nowrap;
	box-shadow: var(--shadow-md);
	z-index: 10002;
	pointer-events: none;
	backdrop-filter: blur(calc(var(--ui-scale) * 10px));
}

.hint-fade-enter-active,
.hint-fade-leave-active {
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
	opacity: 0;
	transform: translateY(calc(var(--ui-scale) * 10px));
}

/* Reusing form-input style from parent or defining it here if needed */
/* Since it's a separate component, it should probably have its own definition or rely on global styles */
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

.deep-work-toggle {
	margin-left: 1rem;
	display: flex;
	align-items: center;
}

.toggle-container {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	font-size: 0.75rem;
	color: var(--text-muted);
	user-select: none;
	white-space: nowrap;
}

.toggle-container input {
	cursor: pointer;
	accent-color: var(--color-urgent);
}

.toggle-label {
	transition: color 0.2s;
}

.toggle-container:hover .toggle-label {
	color: var(--text-primary);
}
</style>
