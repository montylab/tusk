import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import WeekViewPage from '../WeekViewPage.vue'

// Mock route
const mockRouteParams = ref<Record<string, string>>({})
vi.mock('vue-router', () => ({
	useRoute: () => ({ params: mockRouteParams.value }),
	useRouter: () => ({ push: vi.fn() })
}))

// Mock child components
vi.mock('../../components/DayView.vue', () => ({
	default: {
		template: '<div class="day-view-stub"><slot /></div>',
		props: ['dates', 'tasksByDate', 'startHour', 'endHour'],
		methods: {
			scrollToCurrentTime: vi.fn(),
			scrollToDate: vi.fn()
		}
	}
}))

vi.mock('../../components/TaskPageLayout.vue', () => ({
	default: {
		template: '<div class="task-page-layout-stub"><slot /><slot name="popups" /></div>'
	}
}))

vi.mock('../../components/TaskEditorPopup.vue', () => ({
	default: { template: '<div class="editor-popup-stub" />' }
}))

vi.mock('../../components/TrashBasketRound.vue', () => ({
	default: { template: '<div class="trash-stub" />' }
}))

// Mock stores - use reactive so direct property assignment works (component does tasksStore.currentDates = ...)
import { reactive } from 'vue'
const mockTasksStore = reactive({
	currentDates: [] as string[],
	scheduledTasks: {} as Record<string, any[]>,
	addDate: vi.fn()
})

vi.mock('../../stores/tasks', () => ({
	useTasksStore: () => mockTasksStore
}))

// Mock composables
let capturedDayChangeCb: ((date: string) => void) | null = null
vi.mock('../../composables/useTimeBoundaries', () => ({
	useTimeBoundaries: () => ({
		onDayChange: (cb: (date: string) => void) => {
			capturedDayChangeCb = cb
		}
	})
}))

vi.mock('../../composables/useTaskEditor', () => ({
	useTaskEditor: () => ({
		showEditorPopup: ref(false),
		initialStartTime: ref(null),
		taskToEdit: ref(null),
		popupTaskType: ref('scheduled'),
		popupTargetDate: ref(null),
		handleOpenCreatePopup: vi.fn(),
		handleEditTask: vi.fn(),
		handleTaskCreate: vi.fn(),
		handleTaskUpdate: vi.fn(),
		handlePopupClose: vi.fn()
	})
}))

// Mock dateUtils
vi.mock('../../utils/dateUtils', () => ({
	formatDate: (d: Date) => d.toISOString().split('T')[0],
	getMonday: (d: Date) => {
		const date = new Date(d)
		const day = date.getDay()
		const diff = date.getDate() - day + (day === 0 ? -6 : 1)
		date.setDate(diff)
		return date
	},
	getWeekDays: (monday: Date) => {
		const days: string[] = []
		for (let i = 0; i < 7; i++) {
			const d = new Date(monday)
			d.setDate(monday.getDate() + i)
			days.push(d.toISOString().split('T')[0])
		}
		return days
	}
}))

// Need to mock pinia storeToRefs
vi.mock('pinia', async (importOriginal) => {
	const actual = (await importOriginal()) as any
	return {
		...actual,
		storeToRefs: (store: any) => {
			const refs: Record<string, any> = {}
			for (const key in store) {
				if (typeof store[key] !== 'function') {
					refs[key] = store[key]
				}
			}
			return refs
		}
	}
})

describe('WeekViewPage.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
		mockRouteParams.value = {}
		mockTasksStore.currentDates = []
		capturedDayChangeCb = null
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders component structure', () => {
		const wrapper = mount(WeekViewPage)

		expect(wrapper.find('.task-page-layout-stub').exists()).toBe(true)
		expect(wrapper.find('.day-view-stub').exists()).toBe(true)
	})

	it('sets current dates from route param', async () => {
		mockRouteParams.value = { date: '2026-02-16' }
		mount(WeekViewPage)
		await nextTick()

		// Should have set 7 dates starting from the Monday of the week containing Feb 16
		expect(mockTasksStore.currentDates.length).toBe(7)
		expect(mockTasksStore.currentDates[0]).toBe('2026-02-16') // Feb 16, 2026 is a Monday
	})

	it('uses current week when no route param', async () => {
		vi.setSystemTime(new Date('2026-02-17'))
		mount(WeekViewPage)
		await nextTick()

		expect(mockTasksStore.currentDates.length).toBe(7)
	})

	it('registers onDayChange callback', () => {
		mount(WeekViewPage)
		expect(capturedDayChangeCb).toBeTruthy()
	})
})
