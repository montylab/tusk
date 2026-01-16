<script setup lang="ts">
import TrashBasket from './TrashBasket.vue'
import TaskPile from './TaskPile.vue'
import { useTasksStore } from '../stores/tasks'
import { storeToRefs } from 'pinia'
import type { Task } from '../types'

defineProps<{
	title?: string
}>()

const emit = defineEmits<{
	(e: 'edit', task: Task): void
}>()

const tasksStore = useTasksStore()
const { todoTasks, shortcutTasks } = storeToRefs(tasksStore)

const handleEditTask = (task: Task) => {
	emit('edit', task)
}
</script>

<template>
	<div class="page-layout">
		<aside class="sidebar left" style="display: none">
			<TrashBasket />
		</aside>

		<main class="main-content">
			<slot name="header"></slot>
			<slot></slot>
			<slot name="popups"></slot>
		</main>

		<aside class="sidebar right">
			<div class="pile-container">
				<TaskPile title="Shortcuts" :tasks="shortcutTasks" list-type="shortcut" @edit="handleEditTask" />
				<TaskPile title="To Do" :tasks="todoTasks" list-type="todo" @edit="handleEditTask" />
			</div>
		</aside>
	</div>
</template>

<style scoped>
.page-layout {
	display: flex;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.sidebar.left {
	width: calc(5% + var(--ui-scale) * 5%);
	min-width: 150px;
	max-width: 500px;
}

.sidebar.right {
	width: calc(20% + var(--ui-scale) * 5%);
	min-width: 250px;
	max-width: 500px;
}

.main-content {
	flex: 1;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	overflow: hidden;
}

.pile-container {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.pile-container > * {
	flex: 1;
	min-height: 0;
}
</style>
