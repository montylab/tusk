import { db } from '../firebase'
import { writeBatch, deleteField, setDoc, updateDoc } from 'firebase/firestore'
import type { Task } from '../types'
import { resolveDocRef, generateId } from './firebaseService'
import { buildDelta, isDateInPast, addStatDeltaToBatch } from './statsService'
import { nerve, NERVE_EVENTS } from './nerve'

// ─── Helpers ────────────────────────────────────────────────────────────────

const TODO_DEFAULTS: Omit<Task, 'id'> = {
	text: 'New To-Do',
	category: 'Default',
	completed: false,
	startTime: null,
	duration: 60,
	isShortcut: false,
	order: 0,
	isDeepWork: false
}

const SHORTCUT_DEFAULTS: Omit<Task, 'id'> = {
	text: 'New Shortcut',
	category: 'Default',
	completed: false,
	startTime: null,
	duration: 60,
	isShortcut: true,
	order: 0,
	date: null,
	isDeepWork: false
}

const SCHEDULED_DEFAULTS: Omit<Task, 'id'> = {
	text: 'New Event',
	category: 'Default',
	completed: false,
	startTime: 9,
	duration: 60,
	isShortcut: false,
	order: 0,
	color: null,
	isDeepWork: false
}

// ─── Non-Calendar Operations (no stats) ─────────────────────────────────────

export const createTodo = async (taskData: Partial<Omit<Task, 'id'>>): Promise<Task> => {
	const finalData = { ...TODO_DEFAULTS, ...taskData }
	const docRef = resolveDocRef('todo')
	const newId = generateId()
	await setDoc(docRef, { tasks: { [newId]: finalData } }, { merge: true })
	nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: newId })
	return { ...finalData, id: newId }
}

export const createShortcut = async (taskData: Partial<Omit<Task, 'id'>>): Promise<Task> => {
	const finalData = { ...SHORTCUT_DEFAULTS, ...taskData }
	const docRef = resolveDocRef('shortcuts')
	const newId = generateId()
	await setDoc(docRef, { tasks: { [newId]: finalData } }, { merge: true })
	return { ...finalData, id: newId }
}

export const updateTodo = async (id: string | number, updates: Partial<Task>): Promise<void> => {
	if (updates.startTime !== undefined && updates.startTime !== null) {
		console.warn('Use moveTodoToCalendar to change startTime')
		return
	}
	const docRef = resolveDocRef('todo')
	const firestoreUpdates: Record<string, any> = {}
	for (const [key, value] of Object.entries(updates)) {
		if (key === 'id') continue
		firestoreUpdates[`tasks.${id}.${key}`] = value
	}
	await updateDoc(docRef, firestoreUpdates)
}

export const updateShortcut = async (id: string | number, updates: Partial<Task>): Promise<void> => {
	const docRef = resolveDocRef('shortcuts')
	const firestoreUpdates: Record<string, any> = {}
	for (const [key, value] of Object.entries(updates)) {
		if (key === 'id') continue
		firestoreUpdates[`tasks.${id}.${key}`] = value
	}
	const { updateDoc } = await import('firebase/firestore')
	await updateDoc(docRef, firestoreUpdates)
}

export const deleteTodo = async (id: string | number): Promise<void> => {
	const docRef = resolveDocRef('todo')
	await updateDoc(docRef, { [`tasks.${id}`]: deleteField() })
	nerve.emit(NERVE_EVENTS.TASK_DELETED)
}

export const deleteShortcut = async (id: string | number): Promise<void> => {
	const docRef = resolveDocRef('shortcuts')
	const { updateDoc } = await import('firebase/firestore')
	await updateDoc(docRef, { [`tasks.${id}`]: deleteField() })
	nerve.emit(NERVE_EVENTS.TASK_DELETED)
}

// ─── Calendar Operations (task + stats atomic) ─────────────────────────────

export const createScheduledTask = async (taskData: Partial<Omit<Task, 'id'>>, date: string): Promise<Task> => {
	const finalData = {
		...SCHEDULED_DEFAULTS,
		...taskData,
		date,
		isCompleted: isDateInPast(date)
	}

	const docRef = resolveDocRef(`calendar/${date}`)
	const newId = generateId()

	// Atomic: task + stats in one batch
	const batch = writeBatch(db)
	batch.set(docRef, { tasks: { [newId]: finalData } }, { merge: true })
	addStatDeltaToBatch(batch, date, buildDelta(finalData))
	await batch.commit()

	nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: newId })
	return { ...finalData, id: newId }
}

export const updateScheduledTask = async (id: string | number, date: string, updates: Partial<Task>, existingTask: Task): Promise<void> => {
	if (updates.date && updates.date !== date) {
		console.warn('Use moveScheduledTask to change date')
		return
	}
	if (updates.startTime === null) {
		console.warn('Use moveCalendarToTodo to unschedule')
		return
	}

	const batch = writeBatch(db)

	// Task update
	const docRef = resolveDocRef(`calendar/${date}`)
	const firestoreUpdates: Record<string, any> = {}
	for (const [key, value] of Object.entries(updates)) {
		if (key === 'id') continue
		firestoreUpdates[`tasks.${id}.${key}`] = value
	}

	// Stat adjustment for changes that affect stats
	const durationChanged = updates.duration !== undefined && updates.duration !== existingTask.duration
	const categoryChanged = updates.category !== undefined && updates.category !== existingTask.category
	const completedChanged = updates.completed !== undefined && updates.completed !== existingTask.completed
	const deepWorkChanged = updates.isDeepWork !== undefined && updates.isDeepWork !== existingTask.isDeepWork

	if (durationChanged || categoryChanged || completedChanged || deepWorkChanged) {
		// Subtract old, add new — in the same batch
		addStatDeltaToBatch(batch, date, buildDelta(existingTask, -1))
		const newTask = { ...existingTask, ...updates }
		addStatDeltaToBatch(batch, date, buildDelta(newTask, 1))
	}

	// Atomic: commit stat batch + task update together
	// (batch.update works perfectly with dot-notation as long as the doc exists, which it does for an existing task)
	batch.update(docRef, firestoreUpdates)
	await batch.commit()

	if (updates.completed === true) {
		nerve.emit(NERVE_EVENTS.TASK_COMPLETED, { taskId: String(id) })
	} else if (updates.completed === false) {
		nerve.emit(NERVE_EVENTS.TASK_UNCOMPLETED, { taskId: String(id) })
	}
}

export const deleteScheduledTask = async (id: string | number, date: string, existingTask: Task | undefined): Promise<void> => {
	const batch = writeBatch(db)

	// Delete task
	const docRef = resolveDocRef(`calendar/${date}`)
	batch.update(docRef, { [`tasks.${id}`]: deleteField() })

	// Subtract stats
	if (existingTask) {
		addStatDeltaToBatch(batch, date, buildDelta(existingTask, -1))
	}

	await batch.commit()
	nerve.emit(NERVE_EVENTS.TASK_DELETED)
}

// ─── Move / Transfer Operations ─────────────────────────────────────────────

export const moveTodoToCalendar = async (task: Task, date: string, startTime: number, duration: number): Promise<void> => {
	const updates = { startTime, duration, date, isShortcut: false, isCompleted: isDateInPast(date) }
	const mergedTask = { ...task, ...updates }
	const { id, ...dataToSave } = mergedTask

	const batch = writeBatch(db)
	const fromDocRef = resolveDocRef('todo')
	const toDocRef = resolveDocRef(`calendar/${date}`)

	batch.update(fromDocRef, { [`tasks.${task.id}`]: deleteField() })
	batch.set(toDocRef, { tasks: { [task.id]: dataToSave } }, { merge: true })
	addStatDeltaToBatch(batch, date, buildDelta(mergedTask))

	await batch.commit()
	nerve.emit(NERVE_EVENTS.TASK_MOVED)
}

export const moveCalendarToTodo = async (task: Task, date: string, order: number): Promise<void> => {
	const updates = { startTime: null, date: null, isShortcut: false, order } as any
	const mergedTask = { ...task, ...updates }
	const { id, ...dataToSave } = mergedTask

	const batch = writeBatch(db)
	const fromDocRef = resolveDocRef(`calendar/${date}`)
	const toDocRef = resolveDocRef('todo')

	batch.update(fromDocRef, { [`tasks.${task.id}`]: deleteField() })
	batch.set(toDocRef, { tasks: { [task.id]: dataToSave } }, { merge: true })
	addStatDeltaToBatch(batch, date, buildDelta(task, -1))

	await batch.commit()
}

export const moveTodoToShortcut = async (task: Task, order: number): Promise<void> => {
	const updates = { startTime: null, date: null, isShortcut: true, completed: false, order } as any
	const mergedTask = { ...task, ...updates }
	const { id, ...dataToSave } = mergedTask

	const batch = writeBatch(db)
	batch.update(resolveDocRef('todo'), { [`tasks.${task.id}`]: deleteField() })
	batch.set(resolveDocRef('shortcuts'), { tasks: { [task.id]: dataToSave } }, { merge: true })

	await batch.commit()
}

export const moveCalendarToShortcut = async (task: Task, date: string, order: number): Promise<void> => {
	const updates = { startTime: null, date: null, isShortcut: true, completed: false, order } as any
	const mergedTask = { ...task, ...updates }
	const { id, ...dataToSave } = mergedTask

	const batch = writeBatch(db)
	batch.update(resolveDocRef(`calendar/${date}`), { [`tasks.${task.id}`]: deleteField() })
	batch.set(resolveDocRef('shortcuts'), { tasks: { [task.id]: dataToSave } }, { merge: true })
	addStatDeltaToBatch(batch, date, buildDelta(task, -1))

	await batch.commit()
}

export const moveScheduledTask = async (task: Task, fromDate: string, toDate: string, updates: Partial<Task>): Promise<void> => {
	const moveUpdates = { ...updates, date: toDate, isShortcut: false }
	const mergedTask = { ...task, ...moveUpdates }
	const { id, ...dataToSave } = mergedTask

	const batch = writeBatch(db)
	batch.update(resolveDocRef(`calendar/${fromDate}`), { [`tasks.${task.id}`]: deleteField() })
	batch.set(resolveDocRef(`calendar/${toDate}`), { tasks: { [task.id]: dataToSave } }, { merge: true })

	// Subtract from old date, add to new date
	addStatDeltaToBatch(batch, fromDate, buildDelta(task, -1))
	addStatDeltaToBatch(batch, toDate, buildDelta(mergedTask))

	await batch.commit()
	nerve.emit(NERVE_EVENTS.TASK_MOVED)
}

// ─── Copy Operations ────────────────────────────────────────────────────────

export const copyShortcutToTodo = async (shortcut: Task, order: number): Promise<Task> => {
	const { id: _, ...data } = shortcut
	const taskData = { ...data, isShortcut: false, startTime: null, date: null, order }
	const docRef = resolveDocRef('todo')
	const newId = generateId()
	await setDoc(docRef, { tasks: { [newId]: taskData } }, { merge: true })
	nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: newId })
	return { ...taskData, id: newId }
}

export const copyShortcutToCalendar = async (shortcut: Task, date: string, startTime: number, duration: number): Promise<Task> => {
	const { id: _, ...data } = shortcut
	const taskData = { ...data, isShortcut: false, date, startTime, duration, isCompleted: isDateInPast(date) }

	const docRef = resolveDocRef(`calendar/${date}`)
	const newId = generateId()

	const batch = writeBatch(db)
	batch.set(docRef, { tasks: { [newId]: taskData } }, { merge: true })
	addStatDeltaToBatch(batch, date, buildDelta(taskData))
	await batch.commit()

	nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: newId })
	return { ...taskData, id: newId }
}
