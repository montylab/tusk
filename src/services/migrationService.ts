import { auth } from '../firebase'
import { getDatabase, ref, get, type DataSnapshot } from 'firebase/database'
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore'
import { initializeApp, getApp } from 'firebase/app'

type MigrationProgress = {
	step: string
	current: number
	total: number
}

/**
 * One-time migration from Firebase Realtime Database to Firestore.
 *
 * Reads all user data from RTDB and writes it to Firestore
 * using the new embedded-map schema.
 *
 * Call from dev console:
 *   import { migrateToFirestore } from './services/migrationService'
 *   await migrateToFirestore(console.log)
 */
export const migrateToFirestore = async (onProgress?: (progress: MigrationProgress) => void): Promise<void> => {
	const user = auth.currentUser
	if (!user) throw new Error('User must be logged in to migrate')

	const app = getApp()
	const rtdb = getDatabase(app)
	const firestore = getFirestore(app, 'tusk-db')

	const report = (step: string, current: number, total: number) => {
		onProgress?.({ step, current, total })
		console.log(`[Migration] ${step}: ${current}/${total}`)
	}

	const userPath = `users/${user.uid}`

	/** Read a single RTDB path, returns null if no data */
	const readSection = async (section: string) => {
		report(`Reading ${section}`, 0, 1)
		const snapshot = await get(ref(rtdb, `${userPath}/${section}`))
		const data = snapshot.val()
		report(`Reading ${section}`, 1, 1)
		return data
	}

	// 1. Read each section individually (avoids permission issues with root read)
	const calendarData = (await readSection('calendar')) || {}
	const todoData = (await readSection('todo')) || {}
	const shortcutsData = (await readSection('shortcuts')) || {}
	const categoriesData = (await readSection('categories')) || {}
	const settingsData = (await readSection('settings')) || {}

	// 2. Migrate calendar (each date becomes a doc with embedded tasks map)
	const calendarDates = Object.keys(calendarData)
	let dateIndex = 0

	for (const date of calendarDates) {
		const tasksMap = calendarData[date] || {}
		const dayDocRef = doc(firestore, `${userPath}/calendar`, date)
		await setDoc(dayDocRef, { tasks: tasksMap }, { merge: true })
		dateIndex++
		report('Migrating calendar', dateIndex, calendarDates.length)
	}

	// 3. Migrate todo list (single doc with tasks map)
	if (Object.keys(todoData).length > 0) {
		const todoDocRef = doc(firestore, `${userPath}/lists`, 'todo')
		await setDoc(todoDocRef, { tasks: todoData }, { merge: true })
		report('Migrating todo', 1, 1)
	}

	// 4. Migrate shortcuts (single doc with tasks map)
	if (Object.keys(shortcutsData).length > 0) {
		const shortcutsDocRef = doc(firestore, `${userPath}/lists`, 'shortcuts')
		await setDoc(shortcutsDocRef, { tasks: shortcutsData }, { merge: true })
		report('Migrating shortcuts', 1, 1)
	}

	// 5. Migrate categories (single doc with items map)
	if (Object.keys(categoriesData).length > 0) {
		const catDocRef = doc(firestore, `${userPath}/meta`, 'categories')
		await setDoc(catDocRef, { items: categoriesData }, { merge: true })
		report('Migrating categories', 1, 1)
	}

	// 6. Migrate settings (single doc, flat)
	if (Object.keys(settingsData).length > 0) {
		const settingsDocRef = doc(firestore, `${userPath}/meta`, 'settings')
		await setDoc(settingsDocRef, settingsData, { merge: true })
		report('Migrating settings', 1, 1)
	}

	const totalItems =
		calendarDates.length +
		(Object.keys(todoData).length > 0 ? 1 : 0) +
		(Object.keys(shortcutsData).length > 0 ? 1 : 0) +
		(Object.keys(categoriesData).length > 0 ? 1 : 0) +
		(Object.keys(settingsData).length > 0 ? 1 : 0)

	report('Migration complete', totalItems, totalItems)
}
