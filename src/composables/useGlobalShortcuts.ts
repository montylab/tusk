import { onMounted, onUnmounted } from 'vue'
import { useAppearanceStore, type ThemeType } from '../stores/appearance'
import { useTasksStore } from '../stores/tasks'
import { useDragOperator } from './useDragOperator'

export function useGlobalShortcuts() {
	const appearanceStore = useAppearanceStore()
	const tasksStore = useTasksStore()
	const { startDrag } = useDragOperator()

	const scales: Record<string, number> = { '1': 100, '2': 150, '3': 200 }

	const handleKeyDown = (e: KeyboardEvent) => {
		// Prevent handling shortcuts if focusing an input or textarea
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

		if (e.repeat) return

		// Theme & Scale (Alt + ...)
		if (e.altKey) {
			if (scales[e.key]) {
				appearanceStore.interfaceScale = scales[e.key]
				e.preventDefault()
			} else if (e.code === 'Backquote') {
				const themes: ThemeType[] = ['dark', 'light', 'pinky', 'vivid']
				const currentTheme = appearanceStore.theme
				const currentIndex = themes.indexOf(currentTheme)
				const nextTheme = themes[(currentIndex + 1) % themes.length]
				appearanceStore.theme = nextTheme
				e.preventDefault()
			}
		}
		// Shortcut Pile Instantiation (Ctrl + 1-9)
		else if (e.ctrlKey && !isNaN(parseInt(e.key))) {
			const num = parseInt(e.key)
			if (num >= 1 && num <= 9) {
				const shortcutList = tasksStore.shortcutTasks
				const index = num - 1
				if (shortcutList[index]) {
					const task = shortcutList[index]
					const taskCopy = {
						...task,
						id: tasksStore.generateTempId(),
						isShortcut: false
					}
					startDrag(taskCopy, 'shortcut')
					e.preventDefault()
				}
			}
		}
	}

	onMounted(() => window.addEventListener('keydown', handleKeyDown))
	onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
}
