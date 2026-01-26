import { Howl } from 'howler'
import { nerve, NERVE_EVENTS } from '../services/nerve'

// Define sound assets - key maps to filename in /public/assets/sounds/
const soundAssets = {
	taskDeleted: new Howl({ src: ['/assets/sounds/task-deleted.mp3'], volume: 0.6 }),
	taskStarts: new Howl({ src: ['/assets/sounds/schedulled-task-starts.mp3'], volume: 0.7 }),
	taskEnds: new Howl({ src: ['/assets/sounds/schedulled-task-ends.mp3'], volume: 0.7 })
}

export function useSoundSystem() {
	// Initialize listeners
	console.log('🔊 Sound System Initialized')

	nerve.on(NERVE_EVENTS.TASK_DELETED, () => {
		soundAssets.taskDeleted.play()
	})

	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, () => {
		soundAssets.taskStarts.play()
	})

	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_END, () => {
		soundAssets.taskEnds.play()
	})
}
