import mitt from 'mitt'

export const NERVE_EVENTS = {
	// Task Life Cycle
	TASK_CREATED: 'task:created',
	TASK_DELETED: 'task:deleted',
	TASK_MOVED: 'task:moved',
	TASK_COMPLETED: 'task:completed',
	TASK_UNCOMPLETED: 'task:uncompleted',

	// Time & Notifications
	TIME_NOTIFICATION: 'time:notification',

	// App State
	APP_ERROR: 'app:error'
} as const

type ApplicationEvents = {
	[NERVE_EVENTS.TASK_CREATED]: { taskId: string }
	[NERVE_EVENTS.TASK_DELETED]: void
	[NERVE_EVENTS.TASK_MOVED]: void
	[NERVE_EVENTS.TASK_COMPLETED]: { taskId: string }
	[NERVE_EVENTS.TASK_UNCOMPLETED]: { taskId: string }
	[NERVE_EVENTS.TIME_NOTIFICATION]: { title: string; body?: string }
	[NERVE_EVENTS.APP_ERROR]: { message: string }
}

export const nerve = mitt<ApplicationEvents>()
