import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import logger from 'firebase-functions/logger'
import { getStatPeriods } from './utils.js'

const DB_NAME = 'tusk-db'

/**
 * Build date range helper.
 */
function buildRange(start, end) {
	const dates = []
	const cursor = new Date(start)
	while (cursor <= end) {
		dates.push(cursor.toISOString().slice(0, 10))
		cursor.setDate(cursor.getDate() + 1)
	}
	return dates
}

/**
 * Past range: 1st of previous month → yesterday (inclusive).
 */
function getPastDateRange() {
	const now = new Date()
	const end = new Date(now)
	end.setDate(end.getDate() - 1)
	const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
	return buildRange(start, end)
}

/**
 * Future range: tomorrow → last day of current month (inclusive).
 */
function getFutureDateRange() {
	const now = new Date()
	const start = new Date(now)
	// start.setDate(start.getDate() + 1) // Include today in future
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of month
	if (start > end) return []
	return buildRange(start, end)
}

/**
 * Compare old stat doc with newly computed stats.
 * Returns array of diff descriptions, or empty if identical.
 */
function diffStats(periodKey, oldDoc, newDoc) {
	const diffs = []
	const topFields = ['totalMinutes', 'totalCount', 'completedMinutes', 'completedCount', 'deepWorkMinutes']

	for (const field of topFields) {
		const oldVal = oldDoc?.[field] || 0
		const newVal = newDoc[field] || 0
		if (oldVal !== newVal) {
			diffs.push(`${periodKey}: ${field} old=${oldVal} new=${newVal}`)
		}
	}

	// Compare categories
	const allCats = new Set([...Object.keys(oldDoc?.categories || {}), ...Object.keys(newDoc.categories || {})])
	const catFields = ['totalMinutes', 'totalCount', 'completedMinutes', 'completedCount']

	for (const cat of allCats) {
		const oldCat = oldDoc?.categories?.[cat] || {}
		const newCat = newDoc.categories?.[cat] || {}
		for (const field of catFields) {
			const oldVal = oldCat[field] || 0
			const newVal = newCat[field] || 0
			if (oldVal !== newVal) {
				diffs.push(`${periodKey}: categories.${cat}.${field} old=${oldVal} new=${newVal}`)
			}
		}
	}

	return diffs
}

/**
 * Callable function: recalculate stats.
 * Past (1st prev month → yesterday): mark uncompleted → completed, rebuild stats fully.
 * Future (tomorrow → end of month): mark completed → uncompleted, rebuild stats with completed=0.
 * Compares old vs new and logs differences.
 */
export async function recalculateStatsHandler(request) {
	if (!request.auth) {
		throw new Error('Unauthenticated')
	}

	const uid = request.auth.uid
	const today = request.data.today // Expect 'YYYY-MM-DD' from client
	if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
		throw new Error('Missing or invalid "today" date')
	}

	const db = getFirestore(DB_NAME)

	// Build date range helper
	function iterateDates(start, end, callback) {
		const cursor = new Date(start)
		const endDate = new Date(end)
		while (cursor <= endDate) {
			callback(cursor.toISOString().slice(0, 10))
			cursor.setDate(cursor.getDate() + 1)
		}
	}

	// 1. Calculate Ranges relative to 'today'
	// Past: 1st of previous month -> yesterday
	const pastStart = new Date(today)
	pastStart.setMonth(pastStart.getMonth() - 1)
	pastStart.setDate(1)
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	// Future: tomorrow -> end of current (+1) month
	// Actually, let's keep it simple: Current month end
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	const futureEnd = new Date(today)
	futureEnd.setMonth(futureEnd.getMonth() + 1)
	futureEnd.setDate(0) // Last day of current month

	const allDates = []
	const pastDateSet = new Set()
	const futureDateSet = new Set()

	// Past
	if (pastStart <= yesterday) {
		iterateDates(pastStart, yesterday, (d) => {
			allDates.push(d)
			pastDateSet.add(d)
		})
	}

	// Today
	allDates.push(today)

	// Future
	if (tomorrow <= futureEnd) {
		iterateDates(tomorrow, futureEnd, (d) => {
			allDates.push(d)
			futureDateSet.add(d)
		})
	}

	if (allDates.length === 0) {
		return { daysProcessed: 0, tasksCompleted: 0, tasksUncompleted: 0, diffs: [] }
	}

	logger.info(`[recalculateStats] uid=${uid}, today=${today}, totalDays=${allDates.length}`)

	// 2. Collect all unique stat period keys
	const periodKeysSet = new Set()
	for (const dateStr of allDates) {
		for (const key of getStatPeriods(dateStr)) {
			periodKeysSet.add(key)
		}
	}
	const allPeriodKeys = [...periodKeysSet]

	// 3. Read old stat docs (snapshot before changes)
	const oldStats = {}
	for (const period of allPeriodKeys) {
		const snap = await db.doc(`users/${uid}/stats/${period}`).get()
		if (snap.exists) {
			oldStats[period] = snap.data()
		}
	}

	// 4. Delete old stat docs
	const deleteBatch = db.batch()
	for (const period of allPeriodKeys) {
		deleteBatch.delete(db.doc(`users/${uid}/stats/${period}`))
	}
	await deleteBatch.commit()

	// 5. Iterate all calendar days, fix completion flags, rebuild stats
	const newStats = {} // periodKey -> aggregated stat object
	let totalTasksCompleted = 0
	let totalTasksUncompleted = 0
	let daysProcessed = 0

	for (const dateStr of allDates) {
		const isPast = pastDateSet.has(dateStr)
		const isFuture = futureDateSet.has(dateStr)
		const isToday = dateStr === today

		if (!isPast && !isFuture && !isToday) continue // Should not happen based on construction

		const calendarRef = db.doc(`users/${uid}/calendar/${dateStr}`)
		const calendarSnap = await calendarRef.get()

		if (!calendarSnap.exists) continue

		const data = calendarSnap.data()
		if (!data?.tasks) continue

		daysProcessed++
		const taskUpdates = {}

		for (const [taskId, task] of Object.entries(data.tasks)) {
			let shouldCountAsCompleted = false

			if (isPast) {
				// Past: Force Complete
				if (!task.isCompleted) {
					taskUpdates[`tasks.${taskId}.isCompleted`] = true
					totalTasksCompleted++
				}
				shouldCountAsCompleted = true
			} else if (isFuture) {
				// Future: Force Uncomplete
				if (task.isCompleted) {
					taskUpdates[`tasks.${taskId}.isCompleted`] = false
					totalTasksUncompleted++
				}
				shouldCountAsCompleted = false
			} else if (isToday) {
				// Today: Preserve Status, But Update Stats
				// We do NOT change task.isCompleted
				// User wants "Today" stats to effectively be "Planned" only in the DB
				// so the frontend can add "Elapsed" on top correctly.
				// Thus: Add to Total, but NEVER add to Completed (count as 0).
				shouldCountAsCompleted = false
			}

			// Aggregate into stat periods
			const duration = task.duration || 0
			const cat = task.category || 'Default'
			const isDeepWork = !!task.isDeepWork

			for (const periodKey of getStatPeriods(dateStr)) {
				if (!newStats[periodKey]) {
					newStats[periodKey] = {
						totalMinutes: 0,
						totalCount: 0,
						completedMinutes: 0,
						completedCount: 0,
						deepWorkMinutes: 0,
						completedDeepWorkMinutes: 0,
						categories: {}
					}
				}
				const s = newStats[periodKey]
				s.totalMinutes += duration
				s.totalCount += 1
				if (shouldCountAsCompleted) {
					s.completedMinutes += duration
					s.completedCount += 1
				}
				if (isDeepWork) {
					s.deepWorkMinutes += duration
					if (shouldCountAsCompleted) {
						s.completedDeepWorkMinutes = (s.completedDeepWorkMinutes || 0) + duration
					}
				}

				if (!s.categories[cat]) {
					s.categories[cat] = {
						totalMinutes: 0,
						totalCount: 0,
						completedMinutes: 0,
						completedCount: 0
					}
				}
				s.categories[cat].totalMinutes += duration
				s.categories[cat].totalCount += 1
				if (shouldCountAsCompleted) {
					s.categories[cat].completedMinutes += duration
					s.categories[cat].completedCount += 1
				}
			}
		}

		// Update calendar doc if any tasks were changed
		if (Object.keys(taskUpdates).length > 0) {
			await calendarRef.update(taskUpdates)
		}
	}

	// 6. Write new stat docs
	const writeBatch = db.batch()
	for (const [periodKey, stats] of Object.entries(newStats)) {
		writeBatch.set(db.doc(`users/${uid}/stats/${periodKey}`), stats)
	}
	await writeBatch.commit()

	// 7. Compare old vs new and log differences
	const allDiffs = []
	for (const periodKey of allPeriodKeys) {
		const diffs = diffStats(
			periodKey,
			oldStats[periodKey] || null,
			newStats[periodKey] || {
				totalMinutes: 0,
				totalCount: 0,
				completedMinutes: 0,
				completedCount: 0,
				deepWorkMinutes: 0,
				completedDeepWorkMinutes: 0,
				categories: {}
			}
		)
		for (const diff of diffs) {
			// logger.info(`[recalculateStats] DIFF ${diff}`) // Change to info to avoid error spam
			allDiffs.push(diff)
		}
	}

	const summary = {
		daysProcessed,
		tasksCompleted: totalTasksCompleted,
		tasksUncompleted: totalTasksUncompleted,
		diffs: allDiffs
	}

	logger.info(`[recalculateStats] Done.`, summary)
	return summary
}
