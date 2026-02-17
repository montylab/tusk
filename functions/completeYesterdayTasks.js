import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import logger from 'firebase-functions/logger'
import { getStatPeriods, getYesterday } from './utils.js'

const DB_NAME = 'tusk-db'

/**
 * Scans all users' tasks from yesterday, sets isCompleted = true,
 * and increments completedMinutes/completedCount in stat docs.
 */
export async function completeYesterdayTasksHandler() {
	const db = getFirestore(DB_NAME)
	const yesterday = getYesterday()
	const periodKeys = getStatPeriods(yesterday)

	logger.info(`[completeYesterdayTasks] Processing date: ${yesterday}`)

	const usersSnap = await db.collection('users').listDocuments()
	let totalProcessed = 0
	let totalCompleted = 0

	for (const userDocRef of usersSnap) {
		const uid = userDocRef.id
		const calendarDocRef = db.doc(`users/${uid}/calendar/${yesterday}`)
		const calendarSnap = await calendarDocRef.get()

		if (!calendarSnap.exists) continue

		const data = calendarSnap.data()
		if (!data?.tasks) continue

		// Find tasks not yet completed
		const taskUpdates = {}
		const completionDelta = { completedMinutes: 0, completedCount: 0 }
		const categoryDeltas = {}

		for (const [taskId, task] of Object.entries(data.tasks)) {
			if (task.isCompleted) continue

			taskUpdates[`tasks.${taskId}.isCompleted`] = true
			completionDelta.completedMinutes += task.duration || 0
			completionDelta.completedCount += 1

			const cat = task.category || 'Default'
			if (!categoryDeltas[cat]) {
				categoryDeltas[cat] = { completedMinutes: 0, completedCount: 0 }
			}
			categoryDeltas[cat].completedMinutes += task.duration || 0
			categoryDeltas[cat].completedCount += 1

			totalCompleted++
		}

		if (Object.keys(taskUpdates).length === 0) continue

		// Batch: update calendar doc + all stat period docs
		const batch = db.batch()
		batch.update(calendarDocRef, taskUpdates)

		for (const period of periodKeys) {
			const statRef = db.doc(`users/${uid}/stats/${period}`)
			const statUpdates = {
				completedMinutes: FieldValue.increment(completionDelta.completedMinutes),
				completedCount: FieldValue.increment(completionDelta.completedCount)
			}

			for (const [cat, delta] of Object.entries(categoryDeltas)) {
				statUpdates[`categories.${cat}.completedMinutes`] = FieldValue.increment(delta.completedMinutes)
				statUpdates[`categories.${cat}.completedCount`] = FieldValue.increment(delta.completedCount)
			}

			batch.set(statRef, statUpdates, { merge: true })
		}

		await batch.commit()
		totalProcessed++
	}

	logger.info(`[completeYesterdayTasks] Done. ${totalProcessed} users processed, ${totalCompleted} tasks completed.`)
}
