import { ref } from 'vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'

export function useExternalDrag(dayViewRef: any) {
  const tasksStore = useTasksStore()
  const activeExternalTask = ref<{ source: 'shortcut' | 'todo'; task: Task } | null>(null)

  const handleExternalDragStart = (source: 'shortcut' | 'todo', task: Task, event: MouseEvent) => {
    // Pass a callback to DayView so it only sets activeExternalTask when real drag starts
    if (dayViewRef.value) {
      dayViewRef.value.startExternalDrag(event, task, () => {
        activeExternalTask.value = { source, task }
      })
    }
  }

  const handleExternalTaskDropped = (payload: {
    taskId: string | number
    startTime: number
    duration?: number
    date: string
  }) => {
    if (!activeExternalTask.value) return

    const { source, task } = activeExternalTask.value

    if (source === 'todo') {
      // Unlink from todo and move to calendar
      tasksStore.moveTodoToCalendar(task.id, payload.date, payload.startTime, payload.duration || task.duration || 60)
    } else {
      // Shortcut -> Calendar (Copy)
      tasksStore.copyShortcutToCalendar(
        task.id,
        payload.date,
        payload.startTime,
        payload.duration || task.duration || 60
      )
    }

    activeExternalTask.value = null
  }

  const handleExternalTaskDeleted = () => {
    if (!activeExternalTask.value) return

    const { task } = activeExternalTask.value

    // Remove from pile (To-Do or Shortcut)
    if (activeExternalTask.value.source === 'todo') {
      tasksStore.deleteTodo(task.id)
    } else {
      tasksStore.deleteShortcut(task.id)
    }

    activeExternalTask.value = null
  }

  return {
    activeExternalTask,
    handleExternalDragStart,
    handleExternalTaskDropped,
    handleExternalTaskDeleted
  }
}
