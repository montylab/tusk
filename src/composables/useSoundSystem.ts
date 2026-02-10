import { Howl } from 'howler'
import { storeToRefs } from 'pinia'
import { nerve, NERVE_EVENTS } from '../services/nerve'
import { useSettingsStore } from '../stores/settings'

// Define sound assets - key maps to filename in /public/assets/sounds/
const soundAssets = {
	taskDeleted: new Howl({ src: ['/assets/sounds/task-deleted.mp3'], volume: 0.6 }),
	taskStarts: new Howl({ src: ['/assets/sounds/schedulled-task-starts.mp3'], volume: 0.7 }),
	taskEnds: new Howl({ src: ['/assets/sounds/schedulled-task-ends.mp3'], volume: 0.7 })
}

export function useSoundSystem() {
	const settingsStore = useSettingsStore()
	const { settings } = storeToRefs(settingsStore)

	// Initialize listeners
	console.log('🔊 Sound System Initialized')

	nerve.on(NERVE_EVENTS.TASK_DELETED, () => {
		if (settings.value.sounds.enabled && settings.value.sounds.taskDeleted) {
			soundAssets.taskDeleted.play()
		}
	})

	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, () => {
		if (settings.value.sounds.enabled && settings.value.sounds.taskStarted) {
			soundAssets.taskStarts.play()
		}
	})

	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_END, () => {
		if (settings.value.sounds.enabled && settings.value.sounds.taskEnded) {
			soundAssets.taskEnds.play()
		}
	})
}
