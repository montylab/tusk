import { describe, it, expect } from 'vitest'
import { useTaskLayout } from '../useTaskLayout'
import { ref } from 'vue'

describe('useTaskLayout', () => {
	const config = {
		startHour: 8,
		endHour: 20,
		hourHeight: 100
	}

	const mockTasks = [
		{ id: '1', text: 'T1', startTime: 9, duration: 60 },
		{ id: '2', text: 'T2', startTime: 10, duration: 60 }
	]

	it('calculates position for a single task', () => {
		const tasks = ref([mockTasks[0]]) as any
		const { layoutTasks } = useTaskLayout(tasks, ref(null), ref(null), ref(null), config)

		const layout = layoutTasks.value
		expect(layout).toHaveLength(1)
		expect(layout[0].style.top).toBe('100px') // (9-8) * 100
		expect(layout[0].style.height).toBe('99px') // (60/60) * 100 - 1
		expect(layout[0].style.left).toBe('0%')
		expect(layout[0].style.width).toBe('100%')
	})

	it('handles non-overlapping tasks in same column', () => {
		const tasks = ref([
			{ id: '1', startTime: 9, duration: 60 },
			{ id: '2', startTime: 10, duration: 60 }
		] as any)
		const { layoutTasks } = useTaskLayout(tasks, ref(null), ref(null), ref(null), config)

		const layout = layoutTasks.value
		expect(layout[0].style.left).toBe('0%')
		expect(layout[0].style.width).toBe('100%')
		expect(layout[1].style.left).toBe('0%')
		expect(layout[1].style.width).toBe('100%')
	})

	it('stacks overlapping tasks into columns', () => {
		const tasks = ref([
			{ id: '1', startTime: 9, duration: 120 }, // 9 to 11
			{ id: '2', startTime: 10, duration: 60 } // 10 to 11 (overlaps)
		] as any)
		const { layoutTasks } = useTaskLayout(tasks, ref(null), ref(null), ref(null), config)

		const layout = layoutTasks.value
		expect(layout).toHaveLength(2)
		// They should share the width (50% each)
		expect(layout[0].style.width).toBe('50%')
		expect(layout[1].style.width).toBe('50%')
		expect(layout[0].style.left).toBe('0%')
		expect(layout[1].style.left).toBe('50%')
	})

	it('updates position of active task with snap/duration feedback', () => {
		const tasks = ref([mockTasks[0]]) as any
		const activeTaskId = ref('1')
		const currentSnapTime = ref(10.5)
		const currentDuration = ref(120)

		const { layoutTasks } = useTaskLayout(tasks, activeTaskId, currentSnapTime, currentDuration, config)

		const layout = layoutTasks.value
		expect(layout[0].style.top).toBe('250px') // (10.5 - 8) * 100
		expect(layout[0].style.height).toBe('199px') // (120 / 60) * 100 - 1
		expect(layout[0].style.zIndex).toBe(100)
	})

	it('keeps active task in its original cluster for stable layout', () => {
		const tasks = ref([
			{ id: '1', startTime: 9, duration: 120 }, // Cluster A: 9 to 11
			{ id: '2', startTime: 10, duration: 60 }, // Cluster A
			{ id: '3', startTime: 13, duration: 60 } // Cluster B: 13 to 14
		] as any)

		const activeTaskId = ref('1')
		const currentSnapTime = ref(13.5) // Moved to B range

		const { layoutTasks } = useTaskLayout(tasks, activeTaskId, currentSnapTime, ref(null), config)

		// Task 1 should still be laid out as if it were at 9-11
		// so it remains in Cluster A with Task 2.
		// Cluster A should have 50% width.
		const t1 = layoutTasks.value.find((t) => t.id === '1')
		const t2 = layoutTasks.value.find((t) => t.id === '2')
		const t3 = layoutTasks.value.find((t) => t.id === '3')

		expect(t1.style.width).toBe('50%')
		expect(t2.style.width).toBe('50%')
		expect(t3.style.width).toBe('100%')

		// But its display position is updated
		expect(t1.style.top).toBe('550px') // (13.5 - 8) * 100
	})
})
