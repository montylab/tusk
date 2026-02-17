export interface Task {
	id: string | number
	text: string
	category: string
	completed: boolean
	startTime: number | null // hour as float (e.g. 9.5 for 9:30)
	duration: number // minutes
	date?: string | null // YYYY-MM-DD for scheduled tasks
	isShortcut?: boolean // Marks shortcut templates
	order?: number // Sorting order in piles
	color?: string | null // Hex
	description?: string
	isDeepWork?: boolean
	isCompleted?: boolean // true when the task's date is in the past
}
export interface Category {
	id: string
	name: string
	color: string
	order: number
	isDeepWork?: boolean
}

export interface CategoryStat {
	totalMinutes: number
	totalCount: number
	completedMinutes: number
	completedCount: number
}

export interface StatDoc {
	totalMinutes: number
	totalCount: number
	completedMinutes: number
	completedCount: number
	deepWorkMinutes: number
	completedDeepWorkMinutes: number
	categories: Record<string, CategoryStat>
}

export interface StatDelta {
	totalMinutes: number
	totalCount: number
	completedMinutes: number
	completedCount: number
	deepWorkMinutes: number
	completedDeepWorkMinutes: number
	categories: Record<string, CategoryStat>
}
