import { nerve, NERVE_EVENTS } from '../services/nerve'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { onUnmounted } from 'vue'

export function useNotificationSystem() {
	const settingsStore = useSettingsStore()
	const { settings } = storeToRefs(settingsStore)

	console.log('🔔 Notification System Initialized')

	// Request permission immediately on load (or could be deferred to a button click if preferred)
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission()
	}

	const showNotification = (title: string, body?: string) => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notification')
			return
		}

		if (Notification.permission === 'granted') {
			new Notification(title, {
				body: body || 'Task Update',
				icon: '/favicon.ico'
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
	}

	const onTaskStart = ({ title, body }: { title: string; body?: string }) => {
		if (settings.value.notifications.enabled && settings.value.notifications.taskStarted) {
			showNotification(title, body)
		}
	}

	const onTaskEnd = ({ title, body }: { title: string; body?: string }) => {
		if (settings.value.notifications.enabled && settings.value.notifications.taskEnded) {
			showNotification(title, body)
		}
	}

	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, onTaskStart)
	nerve.on(NERVE_EVENTS.SCHEDULED_TASK_END, onTaskEnd)

	onUnmounted(() => {
		nerve.off(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, onTaskStart)
		nerve.off(NERVE_EVENTS.SCHEDULED_TASK_END, onTaskEnd)
	})
}
