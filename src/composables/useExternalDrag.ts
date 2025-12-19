import { ref } from 'vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'

export function useExternalDrag(dayViewRef: any) {
    const tasksStore = useTasksStore()
    const activeExternalTask = ref<{ source: 'shortcut' | 'todo', task: Task } | null>(null)

    const handleExternalDragStart = (source: 'shortcut' | 'todo', task: Task, event: MouseEvent) => {
        activeExternalTask.value = { source, task }
        // Pass the drag event to DayView so it can initiate the ghost logic
        if (dayViewRef.value) {
            dayViewRef.value.startExternalDrag(event, task)
        }
    }

    const handleExternalTaskDropped = (payload: { taskId: number, startTime: number, duration?: number }) => {
        if (!activeExternalTask.value) return

        const { source, task } = activeExternalTask.value

        // 1. Create task in calendar (id will be auto-generated)
        const { id, ...taskData } = task
        tasksStore.createTask({
            ...taskData,
            startTime: payload.startTime, // Use the drop position from DayView
            duration: payload.duration || task.duration || 60,
            isShortcut: false // Remove shortcut flag when scheduling
        })

        // 2. If it was a ToDo, remove from pile
        if (source === 'todo') {
            tasksStore.deleteTask(task.id)
        }

        activeExternalTask.value = null
    }

    const handleExternalTaskDeleted = () => {
        if (!activeExternalTask.value) return

        const { task } = activeExternalTask.value

        // Remove from pile (To-Do or Shortcut)
        tasksStore.deleteTask(task.id)

        activeExternalTask.value = null
    }

    return {
        activeExternalTask,
        handleExternalDragStart,
        handleExternalTaskDropped,
        handleExternalTaskDeleted
    }
}
