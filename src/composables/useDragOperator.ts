import { ref, readonly } from 'vue'
import type { Task } from '../types'
import { manageTaskRelocation } from '../logic/taskRelocation'

// Zone configuration
export interface ZoneConfig {
	priority?: number
	gridConfig?: {
		snapWidth: number
		snapHeight: number
		startHour: number
		endHour: number
	}
	calculateDropData?: (cursorX: number, cursorY: number, task: Task) => any
	scrollOffset?: { x: number; y: number }
}

interface ZoneInfo {
	bounds: DOMRect
	config: ZoneConfig
}

// Global state
const isDragging = ref(false)
const draggedTask = ref<Task | null>(null)
const activeDraggedTaskId = ref<string | number | null>(null)
const ghostPosition = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })
const currentZone = ref<string | null>(null)
const dropData = ref<any>(null)
const sourceZone = ref<string | null>(null)
const isDestroying = ref(false)

// Zone registry
const zones = new Map<string, ZoneInfo>()

// Track current cursor position globally
const cursorPosition = ref({ x: 0, y: 0 })

if (typeof window !== 'undefined') {
	window.addEventListener('mousemove', (e) => {
		cursorPosition.value = { x: e.clientX, y: e.clientY }
	})
}

// Priority mapping for collision detection
const ZONE_PRIORITIES: Record<string, number> = {
	trash: 100,
	todo: 80,
	shortcut: 80,
	'add-day-zone': 60
	// calendar-day-* will default to 40
}

function getZonePriority(zoneName: string): number {
	if (zoneName.startsWith('calendar-day-')) return 40
	return ZONE_PRIORITIES[zoneName] || 0
}

// Helper to get event coordinates
function getEventCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
	if ('touches' in event && event.touches.length > 0) {
		return {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY
		}
	}
	return {
		x: (event as MouseEvent).clientX,
		y: (event as MouseEvent).clientY
	}
}

// Check if point is inside bounds
function isPointInBounds(x: number, y: number, bounds: DOMRect): boolean {
	return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
}

// Find zone under cursor (priority-based)
function getZoneAtPoint(x: number, y: number): { name: string; info: ZoneInfo } | null {
	let bestMatch: { name: string; info: ZoneInfo; priority: number } | null = null

	for (const [name, info] of zones.entries()) {
		if (isPointInBounds(x, y, info.bounds)) {
			const priority = getZonePriority(name)
			if (!bestMatch || priority > bestMatch.priority) {
				bestMatch = { name, info, priority }
			}
		}
	}

	return bestMatch ? { name: bestMatch.name, info: bestMatch.info } : null
}

// Event handlers
// Event handlers
let cleanupListeners: (() => void) | null = null
const dragStartTimer = ref<ReturnType<typeof setTimeout> | null>(null)
let pendingDragCleanup: (() => void) | null = null

// Cleanup function
function cleanup() {
	if (dragStartTimer.value) {
		clearTimeout(dragStartTimer.value)
		dragStartTimer.value = null
	}
	if (pendingDragCleanup) {
		pendingDragCleanup()
		pendingDragCleanup = null
	}

	isDragging.value = false
	draggedTask.value = null
	activeDraggedTaskId.value = null
	ghostPosition.value = { x: 0, y: 0 }
	dragOffset.value = { x: 0, y: 0 }
	currentZone.value = null
	dropData.value = null
	sourceZone.value = null
	isDestroying.value = false

	if (cleanupListeners) {
		cleanupListeners()
		cleanupListeners = null
	}
}

function handleMove(event: MouseEvent | TouchEvent) {
	if (!isDragging.value) return

	const coords = getEventCoordinates(event)
	ghostPosition.value = coords

	const zone = getZoneAtPoint(coords.x, coords.y)

	if (zone) {
		currentZone.value = zone.name

		// Calculate drop data if zone provides calculator
		if (zone.info.config.calculateDropData && draggedTask.value) {
			dropData.value = zone.info.config.calculateDropData(coords.x, coords.y, draggedTask.value)
		} else {
			dropData.value = null
		}
	} else {
		currentZone.value = null
		dropData.value = null
	}
}

async function handleEnd(event: MouseEvent | TouchEvent) {
	if (!isDragging.value) return

	event.preventDefault()

	const coords = getEventCoordinates(event)
	const zone = getZoneAtPoint(coords.x, coords.y)

	// Process drop
	if (zone && draggedTask.value && sourceZone.value) {
		// Special case: add-day-zone cancels drop
		if (zone.name === 'add-day-zone') {
			cleanup()
			return
		}

		// Recalculate drop data at final position
		if (zone.info.config.calculateDropData) {
			dropData.value = zone.info.config.calculateDropData(coords.x, coords.y, draggedTask.value)
		}

		if (zone.name === 'trash') {
			isDestroying.value = true
			// Perform relocation without blocking the animation start
			manageTaskRelocation(sourceZone.value, zone.name, draggedTask.value, dropData.value)
			// Wait for animation + short pause for "impact" feel
			setTimeout(() => {
				cleanup()
			}, 700)
			return
		}

		// Call logic handler for relocation
		await manageTaskRelocation(sourceZone.value, zone.name, draggedTask.value, dropData.value)
	}

	// Reset state
	if (!isDestroying.value) {
		cleanup()
	}
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		cleanup()
	} else if (event.key === 'Delete' || event.key === 'Backspace') {
		if (isDragging.value && draggedTask.value && sourceZone.value) {
			isDestroying.value = true
			manageTaskRelocation(sourceZone.value, 'trash', draggedTask.value, null)
			setTimeout(() => {
				cleanup()
			}, 700)
		}
	}
}

// Public API
export function useDragOperator() {
	function registerZone(name: string, bounds: DOMRect, config: ZoneConfig = {}) {
		zones.set(name, { bounds, config })
	}

	function unregisterZone(name: string) {
		zones.delete(name)
	}

	function updateZoneBounds(name: string, bounds: DOMRect, scrollOffset?: { x: number; y: number }) {
		const zone = zones.get(name)
		if (zone) {
			zone.bounds = bounds
			if (scrollOffset) {
				zone.config.scrollOffset = scrollOffset
			}
		}
	}

	function startDrag(task: Task, source: string, event?: MouseEvent | TouchEvent) {
		if (isDragging.value) return
		if (event) event.preventDefault()

		// Cleanup any pending drag
		if (dragStartTimer.value) {
			clearTimeout(dragStartTimer.value)
			dragStartTimer.value = null
		}
		if (pendingDragCleanup) {
			pendingDragCleanup()
			pendingDragCleanup = null
		}

		// Calculate initial coords and offset immediately
		const startCoords = event ? getEventCoordinates(event) : { ...cursorPosition.value }
		let offsetX = 0
		let offsetY = 0

		if (event) {
			const target = event.target as HTMLElement
			const taskEl = target.closest('.task-item') || target.closest('.task-wrapper-absolute')

			if (taskEl) {
				const rect = taskEl.getBoundingClientRect()
				offsetX = startCoords.x - rect.left
				offsetY = startCoords.y - rect.top
			}
		} else {
			offsetX = 100
			offsetY = 20
		}

		const actualStartDrag = () => {
			dragStartTimer.value = null
			if (pendingDragCleanup) {
				pendingDragCleanup()
				pendingDragCleanup = null
			}

			isDragging.value = true
			draggedTask.value = task
			activeDraggedTaskId.value = task.id
			sourceZone.value = source

			// Update ghost position to current cursor position
			ghostPosition.value = { ...cursorPosition.value }
			dragOffset.value = { x: offsetX, y: offsetY }

			// Attach global listeners
			const handleMouseMove = (e: MouseEvent) => handleMove(e)
			const handleTouchMove = (e: TouchEvent) => handleMove(e)
			const handleMouseUp = (e: MouseEvent) => handleEnd(e)
			const handleTouchEnd = (e: TouchEvent) => handleEnd(e)
			const handleKey = (e: KeyboardEvent) => handleKeyDown(e)

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('touchmove', handleTouchMove)
			document.addEventListener('mouseup', handleMouseUp)
			document.addEventListener('touchend', handleTouchEnd)
			document.addEventListener('keydown', handleKey)

			cleanupListeners = () => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('touchmove', handleTouchMove)
				document.removeEventListener('mouseup', handleMouseUp)
				document.removeEventListener('touchend', handleTouchEnd)
				document.removeEventListener('keydown', handleKey)
			}

			// Trigger initial move
			handleMove({ clientX: cursorPosition.value.x, clientY: cursorPosition.value.y } as MouseEvent)
		}

		// Set timer for 150ms
		dragStartTimer.value = setTimeout(actualStartDrag, 150)

		// Watch for mouse up to cancel
		const cancelHandler = () => {
			if (dragStartTimer.value) {
				clearTimeout(dragStartTimer.value)
				dragStartTimer.value = null
			}
			if (pendingDragCleanup) {
				pendingDragCleanup()
				pendingDragCleanup = null
			}
		}

		document.addEventListener('mouseup', cancelHandler)
		document.addEventListener('touchend', cancelHandler)

		pendingDragCleanup = () => {
			document.removeEventListener('mouseup', cancelHandler)
			document.removeEventListener('touchend', cancelHandler)
		}
	}

	function cancelDrag() {
		cleanup()
	}

	return {
		// State (readonly for consumers)
		isDragging: readonly(isDragging),
		draggedTask: readonly(draggedTask),
		activeDraggedTaskId: readonly(activeDraggedTaskId),
		ghostPosition: readonly(ghostPosition),
		cursorPosition: readonly(cursorPosition),
		dragOffset: readonly(dragOffset),
		currentZone: readonly(currentZone),
		dropData: readonly(dropData),
		isDestroying: readonly(isDestroying),

		// Methods
		registerZone,
		unregisterZone,
		updateZoneBounds,
		startDrag,
		cancelDrag
	}
}
