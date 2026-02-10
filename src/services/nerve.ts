import mitt from 'mitt'

export const NERVE_EVENTS = {
	// Task Life Cycle
	TASK_CREATED: 'TASK_CREATED',
	TASK_DELETED: 'TASK_DELETED',
	TASK_MOVED: 'TASK_MOVED',
	TASK_COMPLETED: 'TASK_COMPLETED',
	TASK_UNCOMPLETED: 'TASK_UNCOMPLETED',

	// Time & Scheduled Notifications
	SCHEDULED_TASK_BEGIN: 'SCHEDULED_TASK_BEGIN',
	SCHEDULED_TASK_END: 'SCHEDULED_TASK_END',
	MINUTE_TICK: 'MINUTE_TICK',

	// App State
	APP_ERROR: 'APP_ERROR'
} as const

type ApplicationEvents = {
	[NERVE_EVENTS.TASK_CREATED]: { taskId: string }
	[NERVE_EVENTS.TASK_DELETED]: void
	[NERVE_EVENTS.TASK_MOVED]: void
	[NERVE_EVENTS.TASK_COMPLETED]: { taskId: string }
	[NERVE_EVENTS.TASK_UNCOMPLETED]: { taskId: string }
	[NERVE_EVENTS.SCHEDULED_TASK_BEGIN]: { title: string; body?: string }
	[NERVE_EVENTS.SCHEDULED_TASK_END]: { title: string; body?: string }
	[NERVE_EVENTS.MINUTE_TICK]: { date: Date }
	[NERVE_EVENTS.APP_ERROR]: { message: string }
}

export const nerve = mitt<ApplicationEvents>()
