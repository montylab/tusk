<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const props = defineProps<{
	modelValue: string
	disabled?: boolean
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
}>()

const settingsStore = useSettingsStore()
const localColor = ref(props.modelValue)
const showCustomPicker = ref(false)
const pickerRef = ref<HTMLElement | null>(null)

// Preset colors from settings
const presets = computed(() => settingsStore.settings.categoryColors)

watch(
	() => props.modelValue,
	(newVal) => {
		localColor.value = newVal
	}
)

const selectColor = (color: string) => {
	if (props.disabled) return
	localColor.value = color
	emit('update:modelValue', color)
	showCustomPicker.value = false
}

const toggleCustomPicker = () => {
	if (props.disabled) return
	showCustomPicker.value = !showCustomPicker.value
}

const handleCustomUpdate = (value: string) => {
	// Ensure value has # prefix
	const color = value.startsWith('#') ? value : '#' + value
	localColor.value = color
	emit('update:modelValue', color)
}

// Close picker when clicking outside
const handleClickOutside = (event: MouseEvent) => {
	if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
		showCustomPicker.value = false
	}
}

onMounted(() => {
	// If no color is provided, pick a random one from presets
	if (!props.modelValue) {
		emit('update:modelValue', settingsStore.getRandomCategoryColor())
	}
	document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
	<div class="color-picker-input" ref="pickerRef" :class="{ disabled: disabled }">
		<!-- Preset Swatches -->
		<div class="presets-container">
			<button
				v-for="color in presets"
				:key="color"
				type="button"
				class="color-swatch"
				:class="{ active: localColor.toLowerCase() === color.toLowerCase() }"
				:style="{ backgroundColor: color }"
				@click="selectColor(color)"
				:title="color"
				:disabled="disabled"
			>
				<span v-if="localColor.toLowerCase() === color.toLowerCase()" class="check-icon">✓</span>
			</button>

			<!-- Custom Color Trigger -->
			<div class="custom-trigger-wrapper">
				<button
					type="button"
					class="color-swatch custom-swatch"
					:class="{ active: !presets.includes(localColor.toLowerCase()) && localColor }"
					@click="toggleCustomPicker"
					title="Custom Color"
					:disabled="disabled"
				></button>

				<!-- Popup Custom Picker -->
				<Transition name="fade">
					<div v-if="showCustomPicker" class="custom-picker-popup">
						<ColorPicker :modelValue="localColor" @update:modelValue="handleCustomUpdate" inline />
					</div>
				</Transition>
			</div>
		</div>
	</div>
</template>

<style scoped>
.color-picker-input {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.color-picker-input.disabled {
	opacity: 0.6;
	pointer-events: none;
}

.presets-container {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
}

.color-swatch {
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 50%;
	border: 2px solid transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	padding: 0;
	position: relative;
	box-shadow: var(--shadow-sm);
}

.color-swatch:hover {
	transform: scale(1.1);
	z-index: 1;
}

.color-swatch.active {
	border-color: var(--text-primary);
	transform: scale(1.1);
	box-shadow: var(--shadow-md);
}

.check-icon {
	color: white;
	font-size: 0.875rem;
	font-weight: bold;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.custom-swatch {
	background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
	border: 0;
}

.custom-swatch.active {
	border-color: var(--text-primary);
}

.plus-icon {
	color: white;
	font-size: 1.25rem;
	font-weight: bold;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	line-height: 1;
}

.custom-trigger-wrapper {
	position: relative;
}

.custom-picker-popup {
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 0.5rem;
	background: var(--bg-popover);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 0.5rem;
	box-shadow: var(--shadow-lg);
	z-index: 1000;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(-5px);
}
</style>
