import { db, auth } from '../firebase'
import { doc, onSnapshot, increment, writeBatch } from 'firebase/firestore'
import type { Task, StatDelta, StatDoc } from '../types'
import { formatDate } from '../utils/dateUtils'

// --- Helpers ---

const getUserRoot = () => {
	const user = auth.currentUser
	if (!user) throw new Error('User must be logged in')
	return `users/${user.uid}`
}

/**
 * Get ISO week number for a date.
 * Returns string like '2025-W08'
 */
export const getISOWeekKey = (dateStr: string): string => {
	const date = new Date(dateStr + 'T00:00:00')
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
	return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get month key from date string.
 * Returns string like '2025-02'
 */
export const getMonthKey = (dateStr: string): string => dateStr.substring(0, 7)

/**
 * Get year key from date string.
 * Returns string like '2025'
 */
export const getYearKey = (dateStr: string): string => dateStr.substring(0, 4)

/**
 * Compute all period keys for a given date.
 * Returns [day, week, month, year] keys.
 */
export const computeStatPeriods = (dateStr: string): string[] => {
	return [dateStr, getISOWeekKey(dateStr), getMonthKey(dateStr), getYearKey(dateStr)]
}

/**
 * Check if a date string is in the past (before today).
 */
export const isDateInPast = (dateStr: string): boolean => {
	const today = formatDate(new Date())
	return dateStr < today
}

/**
 * Build a StatDelta from a task (positive = add, use -1 sign for subtract).
 * If the task is completed, completion counters are also included.
 */
export const buildDelta = (task: Pick<Task, 'duration' | 'category' | 'isDeepWork' | 'isCompleted'>, sign: 1 | -1 = 1): StatDelta => {
	const minutes = (task.duration || 0) * sign
	const count = sign
	const deepWork = task.isDeepWork ? minutes : 0
	const completed = task.isCompleted === true
	const completedMin = completed ? minutes : 0
	const completedCnt = completed ? count : 0

	return {
		totalMinutes: minutes,
		totalCount: count,
		completedMinutes: completedMin,
		completedCount: completedCnt,
		deepWorkMinutes: deepWork,
		categories: {
			[task.category]: {
				totalMinutes: minutes,
				totalCount: count,
				completedMinutes: completedMin,
				completedCount: completedCnt
			}
		}
	}
}

/**
 * Apply a stat delta to all period docs for a given date atomically.
 * Uses Firestore increment() for safe concurrent updates.
 */
export const applyStatDelta = async (dateStr: string, delta: StatDelta): Promise<void> => {
	const root = getUserRoot()
	const periods = computeStatPeriods(dateStr)
	const batch = writeBatch(db)

	for (const period of periods) {
		const statRef = doc(db, root, 'stats', period)
		const updates: Record<string, any> = {
			totalMinutes: increment(delta.totalMinutes),
			totalCount: increment(delta.totalCount),
			completedMinutes: increment(delta.completedMinutes),
			completedCount: increment(delta.completedCount),
			deepWorkMinutes: increment(delta.deepWorkMinutes)
		}

		// Per-category increments
		for (const [cat, catDelta] of Object.entries(delta.categories)) {
			updates[`categories.${cat}.totalMinutes`] = increment(catDelta.totalMinutes)
			updates[`categories.${cat}.totalCount`] = increment(catDelta.totalCount)
			updates[`categories.${cat}.completedMinutes`] = increment(catDelta.completedMinutes)
			updates[`categories.${cat}.completedCount`] = increment(catDelta.completedCount)
		}

		batch.set(statRef, updates, { merge: true })
	}

	await batch.commit()
}

/**
 * Subscribe to a stat document for a given period.
 */
export const subscribeToStat = (period: string, callback: (stat: StatDoc | null) => void) => {
	const root = getUserRoot()
	const statRef = doc(db, root, 'stats', period)
	return onSnapshot(statRef, (snapshot) => {
		const data = snapshot.data()
		if (!data) {
			callback(null)
			return
		}
		callback(data as StatDoc)
	})
}
