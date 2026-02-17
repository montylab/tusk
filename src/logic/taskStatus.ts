import type { Task } from '../types'
import { formatDate, isTimePast } from '../utils/dateUtils'

export const getTaskStatus = (task: Task | Partial<Task>, now = new Date()): 'past' | 'future' | 'on-air' | null => {
	if (task.startTime === null || task.startTime === undefined || !task.date) return null

	const startTime = task.startTime
	const endTime = startTime + (task.duration ?? 60) / 60

	// Check if finished
	if (isTimePast(task.date, endTime, now)) {
		return 'past'
	}

	// Check if started
	const todayStr = formatDate(now)
	const nowTime = now.getHours() + now.getMinutes() / 60
	const isStarted = task.date < todayStr || (task.date === todayStr && startTime <= nowTime)

	if (isStarted) {
		return 'on-air'
	}

	return 'future'
}
