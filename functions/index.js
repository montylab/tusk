import { setGlobalOptions } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/scheduler'
import { initializeApp } from 'firebase-admin/app'
import { completeYesterdayTasksHandler } from './completeYesterdayTasks.js'

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
