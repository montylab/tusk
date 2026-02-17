<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	name: string
	color?: string
	size?: string
}>()

const iconUrl = computed(() => {
	// Assumes icons are in /assets/icons/ (served from public)
	return `/assets/icons/${props.name}.svg`
})

const iconStyle = computed(() => ({
	backgroundColor: props.color || 'currentColor',
	width: props.size || '1rem',
	height: props.size || '1rem',
	maskImage: `url(${iconUrl.value})`,
	'-webkit-mask-image': `url(${iconUrl.value})`,
	maskRepeat: 'no-repeat',
	'-webkit-mask-repeat': 'no-repeat',
	maskPosition: 'center',
	'-webkit-mask-position': 'center',
	maskSize: 'contain',
	'-webkit-mask-size': 'contain'
}))
</script>

<template>
	<i class="app-icon" :style="iconStyle"></i>
</template>

<style scoped>
.app-icon {
	display: inline-block;
	flex-shrink: 0;
}
</style>
