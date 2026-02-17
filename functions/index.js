import { setGlobalOptions } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/scheduler'
import { onCall } from 'firebase-functions/https'
import { initializeApp } from 'firebase-admin/app'
import { completeYesterdayTasksHandler } from './completeYesterdayTasks.js'
import { recalculateStatsHandler } from './recalculateStats.js'

initializeApp()
setGlobalOptions({ maxInstances: 10 })

export const completeYesterdayTasks = onSchedule(
	{
		schedule: 'every day 00:05',
		timeZone: 'Europe/Berlin',
		region: 'europe-west1'
	},
	completeYesterdayTasksHandler
)

export const recalculateStats = onCall({ region: 'europe-west1' }, recalculateStatsHandler)
