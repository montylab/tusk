import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import type { StatDoc } from '../types'
import { subscribeToStat, getISOWeekKey, getMonthKey, getYearKey } from '../services/statsService'
import { formatDate } from '../utils/dateUtils'

type PeriodType = 'day' | 'week' | 'month' | 'year'

export const useStatsStore = defineStore('stats', () => {
	// --- State ---
	const currentPeriodType = ref<PeriodType>('week')
	const currentPeriodKey = ref<string>('')
	const currentStat = ref<StatDoc | null>(null) as Ref<StatDoc | null>
	const loading = ref(false)

	let unsubscribe: (() => void) | null = null

	// --- Getters ---

	const totalHours = computed(() => (currentStat.value ? Math.round((currentStat.value.totalMinutes / 60) * 10) / 10 : 0))

	const deepWorkHours = computed(() => (currentStat.value ? Math.round((currentStat.value.deepWorkMinutes / 60) * 10) / 10 : 0))

	const taskCount = computed(() => currentStat.value?.totalCount ?? 0)

	const categoryBreakdown = computed(() => {
		if (!currentStat.value?.categories) return []
		return Object.entries(currentStat.value.categories)
			.map(([name, stat]) => ({
				name,
				minutes: stat.totalMinutes,
				count: stat.totalCount,
				hours: Math.round((stat.totalMinutes / 60) * 10) / 10
			}))
			.sort((a, b) => b.minutes - a.minutes)
	})

	const deepWorkRatio = computed(() => {
		if (!currentStat.value || currentStat.value.totalMinutes === 0) return 0
		return Math.round((currentStat.value.deepWorkMinutes / currentStat.value.totalMinutes) * 100)
	})

	const completedHours = computed(() => (currentStat.value ? Math.round(((currentStat.value.completedMinutes || 0) / 60) * 10) / 10 : 0))

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
		completionRatio,
		// Actions
		setPeriod,
		navigatePeriod,
		cleanup
	}
})
