import { Howl } from 'howler'
import { nerve, NERVE_EVENTS } from '../services/nerve'

// Define sound assets - key maps to filename in /public/sounds/
const soundAssets = {
	snap: new Howl({ src: ['/sounds/snap.mp3'], volume: 0.5 }),
	trash: new Howl({ src: ['/sounds/trash.mp3'], volume: 0.6 }),
	complete: new Howl({ src: ['/sounds/complete.mp3'], volume: 0.6 }),
	notify: new Howl({ src: ['/sounds/notify.mp3'], volume: 0.7 })
}

export function useSoundSystem() {
	// Initialize listeners
	console.log('🔊 Sound System Initialized')

	nerve.on(NERVE_EVENTS.TASK_MOVED, () => {
		soundAssets.snap.play()
	})

	nerve.on(NERVE_EVENTS.TASK_DELETED, () => {
		soundAssets.trash.play()
	})

	nerve.on(NERVE_EVENTS.TASK_COMPLETED, () => {
		soundAssets.complete.play()
	})

	nerve.on(NERVE_EVENTS.TIME_NOTIFICATION, () => {
		soundAssets.notify.play()
	})
}
