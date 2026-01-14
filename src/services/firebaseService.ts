import { db, auth } from '../firebase'
import { ref, onValue, push, update, remove, set } from 'firebase/database'
import type { Task } from '../types'

// Helper to get user ref
const getUserRoot = () => {
  const user = auth.currentUser
  if (!user) throw new Error('User must be logged in')
  return `users/${user.uid}`
}

// --- Subscriptions ---

export const subscribeToDate = (date: string, callback: (tasks: Task[]) => void) => {
  const root = getUserRoot()
  const tasksRef = ref(db, `${root}/calendar/${date}`)
  return onValue(tasksRef, (snapshot) => {
    const data = snapshot.val()
    const tasks: Task[] = []
    if (data) {
      Object.keys(data).forEach((key) => {
        tasks.push({ ...data[key], id: key, date })
      })
    }
    callback(tasks)
  })
}

export const subscribeToList = (listName: 'todo' | 'shortcuts', callback: (tasks: Task[]) => void) => {
  const root = getUserRoot()
  const tasksRef = ref(db, `${root}/${listName}`)
  return onValue(tasksRef, (snapshot) => {
    const data = snapshot.val()
    const tasks: Task[] = []
    if (data) {
      Object.keys(data).forEach((key) => {
        tasks.push({ ...data[key], id: key })
      })
    }
    callback(tasks)
  })
}

// --- CRUD ---

export const createTaskInPath = async (path: string, task: Omit<Task, 'id'>): Promise<Task> => {
  const root = getUserRoot()
  const tasksRef = ref(db, `${root}/${path}`)
  const newTaskRef = push(tasksRef)
  await set(newTaskRef, task)
  return { ...task, id: newTaskRef.key! }
}

export const updateTaskInPath = async (
  path: string,
  taskId: string | number,
  updates: Partial<Task>
): Promise<void> => {
  const root = getUserRoot()
  const taskRef = ref(db, `${root}/${path}/${taskId}`)
  await update(taskRef, updates)
}

export const deleteTaskFromPath = async (path: string, taskId: string | number): Promise<void> => {
  const root = getUserRoot()
  const taskRef = ref(db, `${root}/${path}/${taskId}`)
  await remove(taskRef)
}

// --- Complex Operations ---

// Atomic move: Delete from old path, Create in new path
export const moveTask = async (
  fromPath: string,
  toPath: string,
  task: Task,
  updatesWithMove: Partial<Task> = {}
): Promise<void> => {
  const root = getUserRoot()
  // Scoping updates to the user root to avoid root-level permission issues
  const userRootRef = ref(db, root)
  const userUpdates: Record<string, any> = {}

  const newTaskData = { ...task, ...updatesWithMove }
  const { id, ...dataToSave } = newTaskData

  userUpdates[`${fromPath}/${task.id}`] = null
  userUpdates[`${toPath}/${task.id}`] = dataToSave

  console.log('firebaseService.moveTask', { fromPath, toPath, taskId: task.id, userUpdates })
  await update(userRootRef, userUpdates)
}
// --- Categories ---

export const subscribeToCategories = (callback: (categories: any[]) => void) => {
  const root = getUserRoot()
  const categoriesRef = ref(db, `${root}/categories`)
  return onValue(categoriesRef, (snapshot) => {
    const data = snapshot.val()
    const categories: any[] = []
    if (data) {
      Object.keys(data).forEach((key) => {
        categories.push({ ...data[key], id: key })
      })
    }
    callback(categories)
  })
}

export const createCategory = async (category: Omit<any, 'id'>): Promise<any> => {
  const root = getUserRoot()
  const categoriesRef = ref(db, `${root}/categories`)
  const newCategoryRef = push(categoriesRef)
  await set(newCategoryRef, category)
  return { ...category, id: newCategoryRef.key! }
}

export const updateCategory = async (categoryId: string, updates: Partial<any>): Promise<void> => {
  const root = getUserRoot()
  const categoryRef = ref(db, `${root}/categories/${categoryId}`)
  await update(categoryRef, updates)
}

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const root = getUserRoot()
  const categoryRef = ref(db, `${root}/categories/${categoryId}`)
  await remove(categoryRef)
}

// --- Settings ---

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const root = getUserRoot()
  const settingsRef = ref(db, `${root}/settings`)
  return onValue(settingsRef, (snapshot) => {
    const data = snapshot.val() || {}
    callback(data)
  })
}

export const updateSettings = async (updates: Partial<any>): Promise<void> => {
  const root = getUserRoot()
  const settingsRef = ref(db, `${root}/settings`)
  await update(settingsRef, updates)
}
