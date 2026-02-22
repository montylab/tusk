import * as firebaseService from './firebaseService'
import { onboardingConfig } from '../logic/onboardingConfig'
import { formatDate } from '../utils/dateUtils'
import { useSettingsStore } from '../stores/settings'

export const runOnboarding = async () => {
	const settingsStore = useSettingsStore()
	console.log('[onboardingService] Starting onboarding...')

	try {
		// 1. Create Categories
		for (const cat of onboardingConfig.categories) {
			await firebaseService.createCategory(cat)
		}

		console.log('[onboardingService] Categories seeded.')

		const now = new Date()
		const todayStr = formatDate(now)

		const yesterdayObj = new Date(now)
		yesterdayObj.setDate(now.getDate() - 1)
		const yesterdayStr = formatDate(yesterdayObj)

		const tomorrowObj = new Date(now)
		tomorrowObj.setDate(now.getDate() + 1)
		const tomorrowStr = formatDate(tomorrowObj)

		// Rounds current time to nearest 15-minute segment as float.
		const baseTime = (Math.round((now.getHours() * 60 + now.getMinutes()) / 15) * 15) / 60

		// 2. Create Scheduled Tasks
		for (const taskConfig of onboardingConfig.scheduledTasks) {
			const offset = taskConfig.startTime || 0
			let startTime = baseTime + offset
			let targetDate = todayStr

			// Special logic for "Current" task (offset 0): center it around baseTime
			if (offset === 0) {
				startTime = baseTime - taskConfig.duration / 120
			}

			// Date shifting with a 8h offset to keep tasks in visible "prime time"
			if (startTime < 0) {
				startTime += 8
				targetDate = yesterdayStr
			} else if (startTime >= 23) {
				startTime -= 8
				targetDate = tomorrowStr
			}

			await firebaseService.createTaskInPath(`calendar/${targetDate}`, {
				...taskConfig,
				startTime,
				date: targetDate
			})
		}

		// 3. Create To-Do Tasks
		for (const task of onboardingConfig.todoTasks) {
			await firebaseService.createTaskInPath('todo', task)
		}

		// 4. Create Shortcut Tasks
		for (let i = 0; i < onboardingConfig.shortcutTasks.length; i++) {
			const task = onboardingConfig.shortcutTasks[i]
			await firebaseService.createTaskInPath('shortcuts', {
				...task,
				order: (i + 1) * 10000,
				isShortcut: true,
				startTime: null,
				date: null,
				completed: false
			})
		}

		// 5. Mark as Onboarded
		await settingsStore.updateSettings({ onboarded: true })
		console.log('[onboardingService] Onboarding complete!')
	} catch (error) {
		console.error('[onboardingService] Error during onboarding:', error)
	}
}
