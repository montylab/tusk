import type { Task } from '../types'

export const getTaskStatus = (task: Task | Partial<Task>, now = new Date()): 'past' | 'future' | 'on-air' | null => {
  if (task.startTime === null || task.startTime === undefined || !task.date) return null
  const todayStr = now.toISOString().split('T')[0]
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()
  const taskStartMinutes = task.startTime * 60
  const taskEndMinutes = taskStartMinutes + (task.duration || 60)

  if (task.date > todayStr) return 'future'
  if (task.date < todayStr) return 'past'
  if (currentTotalMinutes < taskStartMinutes) return 'future'
  if (currentTotalMinutes >= taskStartMinutes && currentTotalMinutes < taskEndMinutes) return 'on-air'
  return 'past'
}
