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
