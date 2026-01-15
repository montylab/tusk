import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'

/**
 * Handles the business logic for moving tasks between zones.
 * It determines the intent (Move, Copy, Schedule, Unschedule, Delete)
 * and calls the appropriate atomic actions on the store.
 */
export async function manageTaskRelocation(source: string, dest: string, task: Task, dropData: any) {
	// Destination: null or invalid (cancel)
	if (!dest) return

	const store = useTasksStore()

	// Destination: Trash
	if (dest === 'trash') {
		if (source.startsWith('calendar-day-')) {
			const date = source.replace('calendar-day-', '')
			await store.deleteScheduledTask(task.id, date)
		} else if (source === 'todo') {
			await store.deleteTodo(task.id)
		} else if (source === 'shortcut') {
			await store.deleteShortcut(task.id)
		}
		return
	}

	// Destination: Calendar
	if (dest.startsWith('calendar-day-')) {
		const date = dest.replace('calendar-day-', '')
		const { time, duration } = dropData || {}

		// Check for Ctrl+Click duplicate or keyboard shortcut copy
		if (task.id.toString().startsWith('temp-')) {
			const { id, ...taskData } = task
			await store.createScheduledTask({
				...taskData,
				date,
				startTime: time,
				duration,
				isShortcut: false
			})
			return
		}

		if (source.startsWith('calendar-day-')) {
			// Scheduled → Calendar: Move/Update
			const oldDate = source.replace('calendar-day-', '')
			if (oldDate === date) {
				await store.updateScheduledTask(task.id, date, { startTime: time, duration })
			} else {
				await store.moveScheduledTask(task.id, oldDate, date, { startTime: time, duration })
			}
		} else if (source === 'todo') {
			// Todo → Calendar: Move (schedule)
			await store.moveTodoToCalendar(task.id, date, time, duration)
		} else if (source === 'shortcut') {
			// Shortcut → Calendar: Copy (instantiate)
			await store.copyShortcutToCalendar(task.id, date, time, duration)
		}
	}

	// Destination: Todo
	else if (dest === 'todo') {
		const { order, index } = dropData || {}

		if (task.id.toString().startsWith('temp-')) {
			const { id, ...taskData } = task
			await store.createTodo({
				...taskData,
				order,
				isShortcut: false,
				startTime: null,
				date: null
			})
			return
		}

		if (source.startsWith('calendar-day-')) {
			// Calendar → Todo: Move (unschedule)
			const date = source.replace('calendar-day-', '')
			await store.moveCalendarToTodo(task.id, date, order)
		} else if (source === 'todo') {
			// Todo → Todo: Reorder
			if (index !== undefined) {
				await store.reorderTodo(task.id, index)
			}
		} else if (source === 'shortcut') {
			// Shortcut → Todo: Copy
			await store.copyShortcutToTodo(task.id, order)
		}
	}

	// Destination: Shortcut
	else if (dest === 'shortcut') {
		const { order, index } = dropData || {}

		if (source.startsWith('calendar-day-')) {
			// Calendar → Shortcut: Move (templatize)
			const date = source.replace('calendar-day-', '')
			await store.moveCalendarToShortcut(task.id, date, order)
		} else if (source === 'todo') {
			// Todo → Shortcut: Move (promote)
			await store.moveTodoToShortcut(task.id, order)
		} else if (source === 'shortcut') {
			// Shortcut → Shortcut: Reorder
			if (index !== undefined) {
				await store.reorderShortcut(task.id, index)
			}
		}
	}
}
