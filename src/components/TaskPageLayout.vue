<script setup lang="ts">
import TaskPile from './TaskPile.vue'
import ResizablePanel from './ResizablePanel.vue'
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
		<main class="main-content">
			<slot name="header"></slot>
			<slot></slot>
			<slot name="popups"></slot>
		</main>

		<ResizablePanel side="left" :min-size="250" :max-size="1600" :default-size="300" storage-key="right-sidebar-width">
			<aside class="sidebar right">
				<div class="pile-container">
					<ResizablePanel side="bottom" :min-size="200" :default-size="400" storage-key="shortcuts-pile-height">
						<TaskPile title="Shortcuts" :tasks="shortcutTasks" list-type="shortcut" @edit="handleEditTask" />
					</ResizablePanel>
					<TaskPile title="To Do" :tasks="todoTasks" list-type="todo" @edit="handleEditTask" />
				</div>
			</aside>
		</ResizablePanel>
	</div>
</template>

<style scoped>
.page-layout {
	display: flex;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.sidebar.right {
	height: 100%;
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
	min-height: 0;
}
</style>
