import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import type { StatDoc, Task } from '../types'
import { subscribeToStat, getISOWeekKey, getMonthKey, getYearKey } from '../services/statsService'
import { getTasksForDate } from '../services/firebaseService'
import { formatDate } from '../utils/dateUtils'

type PeriodType = 'day' | 'week' | 'month' | 'year'

export const useStatsStore = defineStore('stats', () => {
	// --- State ---
	const currentPeriodType = ref<PeriodType>('week')
	const currentPeriodKey = ref<string>('')
	const currentStat = ref<StatDoc | null>(null) as Ref<StatDoc | null>
	const loading = ref(false)

	let unsubscribe: (() => void) | null = null

	// Real-time Today Stats (Fetched once, no live updates)
	const todayTasks = ref<Task[]>([])
	const now = ref(new Date()) // Static time at load/refresh
	// let todayUnsub: (() => void) | null = null
	// let timeInterval: any = null

	// --- Helpers ---

	const isTodayInCurrentPeriod = computed(() => {
		const today = formatDate(new Date())
		const key = currentPeriodKey.value
		const type = currentPeriodType.value
		if (!key) return false
		if (type === 'day') return key === today
		if (type === 'week') return key === getISOWeekKey(today)
		if (type === 'month') return key === today.substring(0, 7)
		if (type === 'year') return key === today.substring(0, 4)
		return false
	})

	const todayElapsedStats = computed(() => {
		const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
		let total = { minutes: 0, count: 0, dwMinutes: 0 }
		const categories: Record<string, { minutes: number }> = {}

		todayTasks.value.forEach((task) => {
			const startMins = Math.floor((task.startTime || 0) * 60)
			const duration = task.duration || 0
			const endMins = startMins + duration

			let elapsed = 0
			if (currentMinutes >= endMins) {
				elapsed = duration
			} else if (currentMinutes > startMins) {
				elapsed = currentMinutes - startMins
			}

			if (elapsed > 0) {
				total.minutes += elapsed
				total.count += elapsed >= duration ? 1 : 0
				if (task.isDeepWork) total.dwMinutes += elapsed

				const cat = task.category || 'Default'
				if (!categories[cat]) categories[cat] = { minutes: 0 }
				categories[cat].minutes += elapsed
			}
		})

		return { total, categories }
	})

	const todayExplicitStats = computed(() => {
		let total = { minutes: 0, count: 0, dwMinutes: 0 }
		const categories: Record<string, { minutes: number }> = {}

		todayTasks.value.forEach((t) => {
			if (t.isCompleted) {
				const duration = t.duration || 0
				total.minutes += duration
				total.count++
				if (t.isDeepWork) total.dwMinutes += duration

				const cat = t.category || 'Default'
				if (!categories[cat]) categories[cat] = { minutes: 0 }
				categories[cat].minutes += duration
			}
		})
		return { total, categories }
	})

	// --- Getters ---

	const totalHours = computed(() => (currentStat.value ? Math.round((currentStat.value.totalMinutes / 60) * 10) / 10 : 0))

	const deepWorkHours = computed(() => (currentStat.value ? Math.round((currentStat.value.deepWorkMinutes / 60) * 10) / 10 : 0))

	const taskCount = computed(() => currentStat.value?.totalCount ?? 0)

	const categoryBreakdown = computed(() => {
		if (!currentStat.value?.categories && !todayTasks.value.length) return []

		// Collect all category names
		const allCats = new Set<string>()
		if (currentStat.value?.categories) Object.keys(currentStat.value.categories).forEach((c) => allCats.add(c))
		if (isTodayInCurrentPeriod.value) {
			Object.keys(todayElapsedStats.value.categories).forEach((c) => allCats.add(c))
		}

		return Array.from(allCats)
			.map((name) => {
				const dbCat = currentStat.value?.categories?.[name] || { totalMinutes: 0, totalCount: 0, completedMinutes: 0, completedCount: 0 }
				let completedMins = dbCat.completedMinutes || 0
				const totalMins = dbCat.totalMinutes || 0

				if (isTodayInCurrentPeriod.value) {
					const explicit = todayExplicitStats.value.categories[name]?.minutes || 0
					const elapsed = todayElapsedStats.value.categories[name]?.minutes || 0
					completedMins = completedMins - explicit + elapsed
				}

				completedMins = Math.max(0, Math.min(completedMins, totalMins)) // Clamp
				const plannedMins = Math.max(0, totalMins - completedMins)

				return {
					name,
					minutes: totalMins,
					count: dbCat.totalCount,
					hours: Math.round((totalMins / 60) * 10) / 10,
					completedMinutes: completedMins,
					plannedMinutes: plannedMins,
					totalHours: Math.round((totalMins / 60) * 10) / 10,
					completedHours: Math.round((completedMins / 60) * 10) / 10,
					plannedHours: Math.round((plannedMins / 60) * 10) / 10
				}
			})
			.sort((a, b) => b.minutes - a.minutes)
	})

	const deepWorkRatio = computed(() => {
		if (!currentStat.value || currentStat.value.totalMinutes === 0) return 0
		return Math.round((currentStat.value.deepWorkMinutes / currentStat.value.totalMinutes) * 100)
	})

	const completedHours = computed(() => {
		let mins = currentStat.value?.completedMinutes || 0
		if (isTodayInCurrentPeriod.value) {
			mins = mins - todayExplicitStats.value.total.minutes + todayElapsedStats.value.total.minutes
		}
		return Math.round((mins / 60) * 10) / 10
	})

	const completedCount = computed(() => {
		let cnt = currentStat.value?.completedCount ?? 0
		if (isTodayInCurrentPeriod.value) {
			cnt = cnt - todayExplicitStats.value.total.count + todayElapsedStats.value.total.count
		}
		return cnt
	})

	const completedDeepWorkHours = computed(() => {
		let mins = currentStat.value?.completedDeepWorkMinutes || 0
		if (isTodayInCurrentPeriod.value) {
			mins = mins - todayExplicitStats.value.total.dwMinutes + todayElapsedStats.value.total.dwMinutes
		}
		return Math.round((mins / 60) * 10) / 10
	})

	const plannedHours = computed(() => Math.round((totalHours.value - completedHours.value) * 10) / 10)
	const plannedCount = computed(() => taskCount.value - completedCount.value)
	const plannedDeepWorkHours = computed(() => Math.round((deepWorkHours.value - completedDeepWorkHours.value) * 10) / 10)

	const completionRatio = computed(() => {
		if (!currentStat.value || currentStat.value.totalCount === 0) return 0
		return Math.round(((currentStat.value.completedCount || 0) / currentStat.value.totalCount) * 100)
	})

	// --- Actions ---

	/** Get the period key for "today" based on period type */
	function getCurrentPeriodKey(type: PeriodType): string {
		const today = formatDate(new Date())
		switch (type) {
			case 'day':
				return today
			case 'week':
				return getISOWeekKey(today)
			case 'month':
				return getMonthKey(today)
			case 'year':
				return getYearKey(today)
		}
	}

	/** Navigate to a specific period */
	function setPeriod(type: PeriodType, key?: string) {
		currentPeriodType.value = type
		currentPeriodKey.value = key || getCurrentPeriodKey(type)
		subscribe()
	}

	/** Navigate to previous/next period */
	function navigatePeriod(direction: -1 | 1) {
		const key = currentPeriodKey.value
		const type = currentPeriodType.value
		let newKey: string

		if (type === 'day') {
			const d = new Date(key + 'T00:00:00')
			d.setDate(d.getDate() + direction)
			newKey = formatDate(d)
		} else if (type === 'week') {
			// Parse ISO week: YYYY-Wxx
			const match = key.match(/^(\d{4})-W(\d{2})$/)
			if (!match) return
			// Find Monday of this ISO week, then shift by 7 days
			const year = parseInt(match[1])
			const week = parseInt(match[2])
			const jan4 = new Date(Date.UTC(year, 0, 4))
			const dayOfWeek = jan4.getUTCDay() || 7
			const monday = new Date(jan4)
			monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)
			monday.setUTCDate(monday.getUTCDate() + direction * 7)
			newKey = getISOWeekKey(formatDate(monday))
		} else if (type === 'month') {
			const [y, m] = key.split('-').map(Number)
			const d = new Date(y, m - 1 + direction, 1)
			newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
		} else {
			// year
			newKey = String(parseInt(key) + direction)
		}

		currentPeriodKey.value = newKey
		subscribe()
	}

	/** Subscribe to the current period's stat doc */
	function subscribe() {
		if (unsubscribe) {
			unsubscribe()
			unsubscribe = null
		}
		loading.value = true
		unsubscribe = subscribeToStat(currentPeriodKey.value, (stat) => {
			currentStat.value = stat
			loading.value = false
		})

		// Manage Today data (Fetch once)
		if (isTodayInCurrentPeriod.value) {
			now.value = new Date() // Update "now" to current moment of fetch
			const today = formatDate(now.value)
			getTasksForDate(today).then((tasks) => {
				todayTasks.value = tasks
			})
		} else {
			todayTasks.value = []
		}
	}

	/** Clean up subscription */
	function cleanup() {
		if (unsubscribe) {
			unsubscribe()
			unsubscribe = null
		}
	}

	return {
		// State
		currentPeriodType,
		currentPeriodKey,
		currentStat,
		loading,
		// Getters
		totalHours,
		deepWorkHours,
		taskCount,
		categoryBreakdown,
		deepWorkRatio,
		completedHours,
		completedCount,
		completedDeepWorkHours,
		plannedHours,
		plannedCount,
		plannedDeepWorkHours,
		completionRatio,
		// Actions
		setPeriod,
		navigatePeriod,
		cleanup
	}
})
