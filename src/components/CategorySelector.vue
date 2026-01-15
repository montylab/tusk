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
const nameInput = ref(props.name)
watch(
	() => props.name,
	(newValue) => {
		nameInput.value = newValue
	}
)

watch(nameInput, (newValue) => {
	if (typeof newValue !== 'string') return
	emit('update:name', newValue)

	if (!newValue) {
		emit('update:color', '')
		emit('update:isDeepWork', false)
		return
	}

	const query = newValue.toLowerCase()
	const foundCategory = categoriesStore.categoriesArray.find((cat) => cat.name.toLowerCase() === query)

	if (foundCategory) {
		emit('update:color', foundCategory.color)
		emit('update:isDeepWork', !!foundCategory.isDeepWork)
	} else if (newValue.trim()) {
		//emit('update:color', generateColorForCategory());
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
		if (!props.color) {
			colorInput.value = generateColorForCategory()
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
	//if (!nameInput.value || typeof nameInput.value !== 'string') return false
	const query = nameInput.value?.trim().toLowerCase()
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
	background: rgba(30, 30, 45, 0.98) !important;
	border: 1px solid rgba(255, 255, 255, 0.1) !important;
	border-radius: 0.5rem !important;
	max-height: 15rem;
	overflow-y: auto;
	z-index: 10001;
	box-shadow: 0 calc(var(--ui-scale) * 10px) calc(var(--ui-scale) * 30px) rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(calc(var(--ui-scale) * 10px));
	margin-top: 0.5rem;
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
	border-radius: 0.375rem;
	border: 2px solid rgba(255, 255, 255, 0.2);
	pointer-events: none;
	box-shadow: 0 2px calc(var(--ui-scale) * 8px) rgba(0, 0, 0, 0.3);
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
	background: rgba(30, 30, 45, 0.98);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #fff;
	padding: 0.5rem 0.75rem;
	border-radius: 0.5rem;
	font-size: 0.75rem;
	white-space: nowrap;
	box-shadow: 0 calc(var(--ui-scale) * 10px) calc(var(--ui-scale) * 25px) rgba(0, 0, 0, 0.5);
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
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	color: #fff;
	font-size: 1rem;
	transition: all 0.2s ease;
	outline: none;
	width: 100%;
}

:deep(.form-input:focus) {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(102, 126, 234, 0.5);
	box-shadow: 0 0 0 calc(var(--ui-scale) * 3px) rgba(102, 126, 234, 0.1);
}

:deep(.form-input::placeholder) {
	color: rgba(255, 255, 255, 0.3);
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
	color: #fff;
}
</style>
