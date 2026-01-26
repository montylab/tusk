import { nerve, NERVE_EVENTS } from '../services/nerve'

export function useNotificationSystem() {
	console.log('🔔 Notification System Initialized')

	// Request permission immediately on load (or could be deferred to a button click if preferred)
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission()
	}

	nerve.on(NERVE_EVENTS.TIME_NOTIFICATION, ({ title, body }) => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notification')
			return
		}

		if (Notification.permission === 'granted') {
			new Notification(title, {
				body: body || 'Task Update',
				icon: '/favicon.ico' // Optional: use app icon
			})
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission().then((permission) => {
				if (permission === 'granted') {
					new Notification(title, {
						body: body || 'Task Update',
						icon: '/favicon.ico'
					})
				}
			})
		}
	})
}
