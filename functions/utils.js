/**
 * Get ISO week key for a date string (YYYY-MM-DD → YYYY-Wxx)
 */
export function getISOWeekKey(dateStr) {
	const date = new Date(dateStr + 'T00:00:00Z')
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
	return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get all 4 stat period keys for a date string.
 * Returns [day, week, month, year].
 */
export function getStatPeriods(dateStr) {
	return [dateStr, getISOWeekKey(dateStr), dateStr.substring(0, 7), dateStr.substring(0, 4)]
}

/**
 * Get yesterday's date as YYYY-MM-DD string.
 */
export function getYesterday() {
	const d = new Date()
	d.setDate(d.getDate() - 1)
	return d.toISOString().slice(0, 10)
}

/**
 * Formats minutes into H:MM format
 */
export function formatMinutesToTime(minutes) {
	const h = Math.floor(minutes / 60)
	const m = Math.round(minutes % 60)
	return `${h}:${String(m).padStart(2, '0')}`
}
