<script setup lang="ts">
import { useTimeStore } from '../../stores/time'

const props = defineProps<{
	start: number
	duration: number
}>()

const timeStore = useTimeStore()

const events = {
	mouseenter: () => {
		timeStore.setHoveredTimeRange({
			start: props.start,
			duration: props.duration
		})
	},
	mouseleave: () => {
		timeStore.setHoveredTimeRange(null)
	}
}
</script>

<template>
	<slot :events="events"></slot>
</template>
