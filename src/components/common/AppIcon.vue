<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	name: string
	color?: string
	size?: string
}>()

const iconUrl = computed(() => {
	// Simple mapping or assume icons are in /assets/icons/
	return `/src/assets/icons/${props.name}.svg`
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
	'-webkit-mask-size': 'contain',
	hey: '2'
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
