<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '../components/common/AppIcon.vue'

const isDev = import.meta.env.DEV
const isOpen = ref(false)
const fabRef = ref<HTMLElement | null>(null)

const toggleMenu = () => {
	isOpen.value = !isOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
	if (fabRef.value && !fabRef.value.contains(event.target as Node)) {
		isOpen.value = false
	}
}

onMounted(() => {
	document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
	document.removeEventListener('mousedown', handleClickOutside)
})

const debugLinks = [{ name: 'Color Scheme Debug', path: '/debug/colors', icon: 'palette' }]
</script>

<template>
	<div v-if="isDev" ref="fabRef" class="debug-fab-container" :class="{ 'is-open': isOpen }">
		<button class="debug-fab" @click="toggleMenu" title="Debug Tools">
			<AppIcon name="terminal" size="1.2rem" />
		</button>

		<Transition name="fade-slide">
			<div v-if="isOpen" class="debug-popover">
				<div class="popover-header">
					<h4>Debug Tools</h4>
				</div>
				<div class="popover-content">
					<router-link v-for="link in debugLinks" :key="link.path" :to="link.path" class="debug-item" @click="isOpen = false">
						<AppIcon :name="link.icon" size="1rem" />
						<span>{{ link.name }}</span>
					</router-link>
				</div>
			</div>
		</Transition>
	</div>
</template>

<style scoped lang="scss">
.debug-fab-container {
	position: fixed;
	bottom: -4rem;
	left: -4rem;
	padding: 2rem;
	z-index: 9999;
	transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

	&:hover,
	&.is-open {
		transform: translate(3rem, -3rem);
	}
}

.debug-fab {
	width: 3.5rem;
	height: 3.5rem;
	border-radius: 50%;
	background: var(--accent-gradient);
	border: none;
	color: var(--text-on-accent);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.debug-fab:hover {
	transform: scale(1.1) rotate(5deg);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.is-open .debug-fab {
	transform: rotate(90deg);
}

.debug-popover {
	position: absolute;
	bottom: 5rem;
	left: 2rem;
	width: 200px;
	background: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-xl);
	overflow: hidden;
	backdrop-filter: blur(10px);
}

.popover-header {
	padding: 0.75rem 1rem;
	border-bottom: 1px solid var(--border-color);
	background: rgba(255, 255, 255, 0.05);
}

.popover-header h4 {
	margin: 0;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--text-muted);
}

.popover-header.secondary {
	padding-top: 0.5rem;
	border-bottom: none;
	background: transparent;
}

.popover-divider {
	height: 1px;
	background: var(--border-color);
	margin: 0.25rem 1rem;
}

.popover-content {
	display: flex;
	flex-direction: column;
}

.debug-item {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	color: var(--text-primary);
	text-decoration: none;
	font-size: 0.9rem;
	transition: background 0.2s;

	&.btn {
		background: transparent;
		border: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
	}
}

.debug-item:hover {
	background: var(--surface-hover);
	color: var(--accent);
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
	transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
	opacity: 0;
	transform: translateY(10px) scale(0.95);
}
</style>
