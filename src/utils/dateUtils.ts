/**
 * Formats a Date object to YYYY-MM-DD string in local time
 */
export const formatDate = (date: Date): string => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * Returns true if the given date string (YYYY-MM-DD) matches today's date
 */
export const isToday = (dateStr: string): boolean => {
	return dateStr === formatDate(new Date())
}

/**
 * Returns the next day as a YYYY-MM-DD string
 */
export const getNextDay = (dateStr: string): string => {
	const date = new Date(dateStr)
	date.setDate(date.getDate() + 1)
	return formatDate(date)
}

/**
 * Returns the Monday of the week containing the given date
 */
export const getMonday = (date: Date): Date => {
	const d = new Date(date)
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : 1)
	return new Date(d.setDate(diff))
}

/**
 * Returns an array of 7 date strings representing the week starting from the given Monday
 */
export const getWeekDays = (monday: Date): string[] => {
	const days: string[] = []
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday)
		d.setDate(monday.getDate() + i)
		days.push(formatDate(d))
	}
	return days
}

/**
 * Returns a 6x7 or 5x7 grid of date strings for a month calendar view
 * Weeks start on Monday. Includes padding days from prev/next months.
 */
export const getMonthCalendarGrid = (year: number, month: number): string[][] => {
	const firstDay = new Date(year, month, 1)

	// Get day of week for first day (0=Sun, 1=Mon, ..., 6=Sat)
	// Convert to Monday-start (0=Mon, 1=Tue, ..., 6=Sun)
	let startDayOfWeek = firstDay.getDay() - 1
	if (startDayOfWeek < 0) startDayOfWeek = 6

	const grid: string[][] = []
	let currentDate = new Date(firstDay)
	currentDate.setDate(currentDate.getDate() - startDayOfWeek)

	for (let week = 0; week < 6; week++) {
		if (week === 5 && currentDate.getMonth() !== month) {
			break
		}

		const weekDays: string[] = []
		for (let day = 0; day < 7; day++) {
			weekDays.push(formatDate(currentDate))
			currentDate.setDate(currentDate.getDate() + 1)
		}
		grid.push(weekDays)
	}

	return grid
}

/**
 * Returns the month (0-11) from a date string
 */
export const getMonthFromDate = (dateStr: string): number => {
	return new Date(dateStr).getMonth()
}

/**
 * Parse year/month from a date string
 */
export const getYearMonth = (dateStr: string): { year: number; month: number } => {
	const d = new Date(dateStr)
	return { year: d.getFullYear(), month: d.getMonth() }
}

/**
 * Get short day name (Mon, Tue, etc.)
 */
export const getShortDayName = (dayIndex: number): string => {
	const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
	return names[dayIndex]
}

/**
 * Get month name
 */
export const getMonthName = (month: number): string => {
	const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	return names[month]
}
/**
 * Get current time in decimal hours, snapped to the nearest interval
 */
export const getTimeSnapped = (date: Date = new Date(), intervalMinutes: number = 15): number => {
	const hours = date.getHours()
	const minutes = date.getMinutes()
	const totalMinutes = hours * 60 + minutes
	const snappedMinutes = Math.round(totalMinutes / intervalMinutes) * intervalMinutes
	return snappedMinutes / 60
}

/**
 * Returns true if a given time slot (in decimal hours) on a specific date is in the past
 */
export const isTimePast = (dateStr: string, hour: number, now = new Date()): boolean => {
	const todayStr = formatDate(now)
	if (dateStr < todayStr) return true
	if (dateStr > todayStr) return false
	const nowHour = now.getHours() + now.getMinutes() / 60
	return hour < nowHour
}
