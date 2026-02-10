import { nerve, NERVE_EVENTS } from '../services/nerve'
import { useTasksStore } from '../stores/tasks'
import { formatDate } from '../utils/dateUtils'

export function useTaskMonitor() {
	// Track notified tasks to simulate "edge-trigger" (only notify once per task instance)
	const notifiedEntryTasks = new Set<string>()
	const notifiedExitTasks = new Set<string>()

	nerve.on(NERVE_EVENTS.MINUTE_TICK, ({ date }) => {
		const tasksStore = useTasksStore()
		const todayStr = formatDate(date)
		const scheduled = tasksStore.scheduledTasks[todayStr] || []
		const currentDecimal = date.getHours() + date.getMinutes() / 60
		scheduled.forEach((task) => {
			if (typeof task.startTime !== 'number') return
			const id = String(task.id)
			const uniqueTaskId = id + task.startTime

			// --- BEGIN Check ---
			const startDiff = Math.abs(task.startTime - currentDecimal)
			if (startDiff < 0.005) {
				if (!notifiedEntryTasks.has(uniqueTaskId)) {
					nerve.emit(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, {
						title: 'Task Started',
						body: `It's time for: ${task.text}`
					})
					notifiedEntryTasks.add(uniqueTaskId)
				}
			}

			// --- END Check ---
			if (task.duration) {
				const endTime = task.startTime + task.duration / 60
				const endDiff = Math.abs(endTime - currentDecimal)
				if (endDiff < 0.005) {
					if (!notifiedExitTasks.has(uniqueTaskId)) {
						nerve.emit(NERVE_EVENTS.SCHEDULED_TASK_END, {
							title: 'Task Finished',
							body: `${task.text} should be finished now.`
						})
						notifiedExitTasks.add(uniqueTaskId)
					}
				}
			}
		})
	})
}
