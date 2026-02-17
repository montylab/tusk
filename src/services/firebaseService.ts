import { db, auth } from '../firebase'
import { doc, onSnapshot, updateDoc, setDoc, deleteField, writeBatch, collection, type DocumentData } from 'firebase/firestore'
import type { Task } from '../types'

// --- Helpers ---

const getUserRoot = () => {
	const user = auth.currentUser
	if (!user) throw new Error('User must be logged in')
	return `users/${user.uid}`
}

/** Generate a unique Firestore-style ID without creating a document */
const generateId = (): string => {
	return doc(collection(db, '_')).id
}

/**
 * Resolve a logical path (e.g. 'calendar/2025-02-17' or 'todo') to a Firestore doc ref.
 *
 * Mapping:
 *   'calendar/{date}'  → users/{uid}/calendar/{date}
 *   'todo'             → users/{uid}/lists/todo
 *   'shortcuts'        → users/{uid}/lists/shortcuts
 */
const resolveDocRef = (path: string) => {
	const root = getUserRoot()
	if (path.startsWith('calendar/')) {
		const date = path.replace('calendar/', '')
		return doc(db, root, 'calendar', date)
	}
	if (path === 'todo' || path === 'shortcuts') {
		return doc(db, root, 'lists', path)
	}
	throw new Error(`Unknown path: ${path}`)
}

/**
 * Parse embedded tasks map from a Firestore document snapshot into a Task array.
 * Adds `id` and optionally `date` to each task.
 */
const parseTasks = (data: DocumentData | undefined, date?: string): Task[] => {
	if (!data?.tasks) return []
	return Object.entries(data.tasks).map(([id, taskData]) => ({
		...(taskData as object),
		id,
		...(date ? { date } : {})
	})) as Task[]
}

// --- Subscriptions ---

export const subscribeToDate = (date: string, callback: (tasks: Task[]) => void) => {
	const root = getUserRoot()
	const dayDocRef = doc(db, root, 'calendar', date)
	return onSnapshot(dayDocRef, (snapshot) => {
		callback(parseTasks(snapshot.data(), date))
	})
}

export const subscribeToList = (listName: 'todo' | 'shortcuts', callback: (tasks: Task[]) => void) => {
	const root = getUserRoot()
	const listDocRef = doc(db, root, 'lists', listName)
	return onSnapshot(listDocRef, (snapshot) => {
		callback(parseTasks(snapshot.data()))
	})
}

// --- CRUD ---

export const createTaskInPath = async (path: string, task: Omit<Task, 'id'>): Promise<Task> => {
	const docRef = resolveDocRef(path)
	const newId = generateId()
	await setDoc(docRef, { tasks: { [newId]: task } }, { merge: true })
	return { ...task, id: newId }
}

export const updateTaskInPath = async (path: string, taskId: string | number, updates: Partial<Task>): Promise<void> => {
	const docRef = resolveDocRef(path)
	// Build dot-notation updates: tasks.{taskId}.field = value
	const firestoreUpdates: Record<string, any> = {}
	for (const [key, value] of Object.entries(updates)) {
		if (key === 'id') continue // Never write `id` into the stored data
		firestoreUpdates[`tasks.${taskId}.${key}`] = value
	}
	await updateDoc(docRef, firestoreUpdates)
}

export const deleteTaskFromPath = async (path: string, taskId: string | number): Promise<void> => {
	const docRef = resolveDocRef(path)
	await updateDoc(docRef, { [`tasks.${taskId}`]: deleteField() })
}

// --- Complex Operations ---

export const moveTask = async (fromPath: string, toPath: string, task: Task, updatesWithMove: Partial<Task> = {}): Promise<void> => {
	const fromDocRef = resolveDocRef(fromPath)
	const toDocRef = resolveDocRef(toPath)

	const newTaskData = { ...task, ...updatesWithMove }
	const { id, ...dataToSave } = newTaskData

	const batch = writeBatch(db)

	// Delete from source
	batch.update(fromDocRef, { [`tasks.${task.id}`]: deleteField() })

	// Add to target (merge to create doc if it doesn't exist)
	batch.set(toDocRef, { tasks: { [task.id]: dataToSave } }, { merge: true })

	console.log('firebaseService.moveTask', { fromPath, toPath, taskId: task.id })
	await batch.commit()
}

// --- Categories ---

export const subscribeToCategories = (callback: (categories: any[]) => void) => {
	const root = getUserRoot()
	const catDocRef = doc(db, root, 'meta', 'categories')
	return onSnapshot(catDocRef, (snapshot) => {
		const data = snapshot.data()
		if (!data?.items) {
			callback([])
			return
		}
		const categories = Object.entries(data.items).map(([id, catData]) => ({
			...(catData as object),
			id
		}))
		callback(categories)
	})
}

export const createCategory = async (category: Omit<any, 'id'>): Promise<any> => {
	const root = getUserRoot()
	const catDocRef = doc(db, root, 'meta', 'categories')
	const newId = generateId()
	await setDoc(catDocRef, { items: { [newId]: category } }, { merge: true })
	return { ...category, id: newId }
}

export const updateCategory = async (categoryId: string, updates: Partial<any>): Promise<void> => {
	const root = getUserRoot()
	const catDocRef = doc(db, root, 'meta', 'categories')
	const firestoreUpdates: Record<string, any> = {}
	for (const [key, value] of Object.entries(updates)) {
		if (key === 'id') continue
		firestoreUpdates[`items.${categoryId}.${key}`] = value
	}
	await updateDoc(catDocRef, firestoreUpdates)
}

export const deleteCategory = async (categoryId: string): Promise<void> => {
	const root = getUserRoot()
	const catDocRef = doc(db, root, 'meta', 'categories')
	await updateDoc(catDocRef, { [`items.${categoryId}`]: deleteField() })
}

// --- Settings ---

export const subscribeToSettings = (callback: (settings: any) => void) => {
	const root = getUserRoot()
	const settingsDocRef = doc(db, root, 'meta', 'settings')
	return onSnapshot(settingsDocRef, (snapshot) => {
		callback(snapshot.data() || {})
	})
}

export const updateSettings = async (updates: Partial<any>): Promise<void> => {
	const root = getUserRoot()
	const settingsDocRef = doc(db, root, 'meta', 'settings')
	await setDoc(settingsDocRef, updates, { merge: true })
}
