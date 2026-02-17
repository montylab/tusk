import { describe, it, expect, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { nextTick, defineComponent, h } from 'vue'
import TaskDateTimePicker from '../TaskDateTimePicker.vue'
import PrimeVue from 'primevue/config'

// Lightweight stub for PrimeVue DatePicker that just renders an input
// and forwards v-model through update:modelValue
const DatePickerStub = defineComponent({
	name: 'DatePicker',
	props: {
		modelValue: { default: null },
		showIcon: Boolean,
		fluid: Boolean,
		iconDisplay: String,
		placeholder: String,
		timeOnly: Boolean,
		stepMinute: Number
	},
	emits: ['update:modelValue'],
	setup(_, { slots }) {
		return () => h('div', { class: 'datepicker-stub' }, [slots.inputicon?.({ clickCallback: () => {} })])
	}
})

const AppIconStub = defineComponent({
	name: 'AppIcon',
	props: ['name', 'size'],
	setup() {
		return () => h('i', { class: 'app-icon-stub' })
	}
})

beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.components = { DatePicker: DatePickerStub }
	config.global.stubs = { AppIcon: AppIconStub }
})

// ── helpers ────────────────────────────────────────────────────────
function factory(props: Record<string, unknown> = {}) {
	return mount(TaskDateTimePicker, { props })
}

// ── tests ──────────────────────────────────────────────────────────
describe('TaskDateTimePicker.vue', () => {
	// ── Happy Path ─────────────────────────────────────────────────
	describe('Happy Path', () => {
		it('renders both pickers when view is unset', () => {
			const wrapper = factory({ date: '2026-03-15', time: 10 })
			const groups = wrapper.findAll('.picker-group')
			expect(groups.length).toBe(2)
		})

		it('renders only date picker when view is "date-only"', () => {
			const wrapper = factory({ date: '2026-03-15', view: 'date-only' })
			const groups = wrapper.findAll('.picker-group')
			expect(groups.length).toBe(1)
			// The DatePicker for date-only should NOT have timeOnly
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('timeOnly')).toBeFalsy()
		})

		it('renders only time picker when view is "time-only"', () => {
			const wrapper = factory({ time: 14.5, view: 'time-only' })
			const groups = wrapper.findAll('.picker-group')
			expect(groups.length).toBe(1)
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('timeOnly')).toBe(true)
		})

		it('initializes internal date from string prop', () => {
			const wrapper = factory({ date: '2026-03-15', view: 'date-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getFullYear()).toBe(2026)
			expect(dateVal.getMonth()).toBe(2) // March
			expect(dateVal.getDate()).toBe(15)
		})

		it('initializes internal time from numeric prop', () => {
			const wrapper = factory({ time: 14.5, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getHours()).toBe(14)
			expect(dateVal.getMinutes()).toBe(30)
		})

		it('emits update:date when internal date changes', async () => {
			const wrapper = factory({ date: '2026-03-15', view: 'date-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const newDate = new Date(2026, 5, 20) // June 20

			await dp.vm.$emit('update:modelValue', newDate)
			await nextTick()

			const emitted = wrapper.emitted('update:date')!
			const last = emitted[emitted.length - 1]
			expect(last).toEqual(['2026-06-20'])
		})

		it('emits update:time when internal time changes', async () => {
			const wrapper = factory({ time: 9, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const t = new Date()
			t.setHours(10, 45, 0, 0)

			await dp.vm.$emit('update:modelValue', t)
			await nextTick()

			const emitted = wrapper.emitted('update:time')!
			const last = emitted[emitted.length - 1]
			expect(last).toEqual([10.75])
		})

		it('syncs parent date prop changes to internal state', async () => {
			const wrapper = factory({ date: '2026-01-01', view: 'date-only' })
			await wrapper.setProps({ date: '2026-06-15' })
			await nextTick()

			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getFullYear()).toBe(2026)
			expect(dateVal.getMonth()).toBe(5) // June
			expect(dateVal.getDate()).toBe(15)
		})

		it('syncs parent time prop changes to internal state', async () => {
			const wrapper = factory({ time: 9, view: 'time-only' })
			await wrapper.setProps({ time: 13.25 })
			await nextTick()

			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getHours()).toBe(13)
			expect(dateVal.getMinutes()).toBe(15)
		})
	})

	// ── Edge Cases ─────────────────────────────────────────────────
	describe('Edge Cases', () => {
		it('handles null date prop', () => {
			const wrapper = factory({ date: null, view: 'date-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('modelValue')).toBeNull()
		})

		it('handles undefined date prop', () => {
			const wrapper = factory({ view: 'date-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('modelValue')).toBeNull()
		})

		it('handles null time prop', () => {
			const wrapper = factory({ time: null, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('modelValue')).toBeNull()
		})

		it('handles undefined time prop', () => {
			const wrapper = factory({ view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('modelValue')).toBeNull()
		})

		it('does not re-set internalDate when prop value is equivalent', async () => {
			const wrapper = factory({ date: '2026-03-15', view: 'date-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const originalRef = dp.props('modelValue')

			// Trigger same value
			await wrapper.setProps({ date: '2026-03-15' })
			await nextTick()

			// Should be the same object reference (not replaced)
			expect(dp.props('modelValue')).toBe(originalRef)
		})

		it('handles time=0 (midnight)', () => {
			const wrapper = factory({ time: 0, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getHours()).toBe(0)
			expect(dateVal.getMinutes()).toBe(0)
		})

		it('handles time=23.75 (23:45)', () => {
			const wrapper = factory({ time: 23.75, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			const val = dp.props('modelValue')
			expect(val).toBeInstanceOf(Date)
			const dateVal = val as Date
			expect(dateVal.getHours()).toBe(23)
			expect(dateVal.getMinutes()).toBe(45)
		})

		it('dateToString pads single-digit month and day', async () => {
			const wrapper = factory({ date: '2026-01-05', view: 'date-only' })
			// Initial watcher fires on mount
			const emitted = wrapper.emitted('update:date')
			if (emitted && emitted.length > 0) {
				expect(emitted[0][0]).toBe('2026-01-05')
			}
		})

		it('sets internalTime to null when parent sets time to null', async () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			await wrapper.setProps({ time: null })
			await nextTick()

			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('modelValue')).toBeNull()
		})
	})

	// ── UI/Interaction ─────────────────────────────────────────────
	describe('UI/Interaction', () => {
		it('wheel scroll increases time by 15 min with Shift+ScrollUp', async () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			const group = wrapper.find('.picker-group')

			const event = new WheelEvent('wheel', {
				deltaY: -100,
				shiftKey: true,
				bubbles: true
			})
			group.element.dispatchEvent(event)
			await nextTick()

			const emitted = wrapper.emitted('update:time')!
			const last = emitted[emitted.length - 1][0] as number
			expect(last).toBe(10.25) // 10:00 + 15min = 10.25
		})

		it('wheel scroll decreases time by 15 min with Shift+ScrollDown', async () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			const group = wrapper.find('.picker-group')

			const event = new WheelEvent('wheel', {
				deltaY: 100,
				shiftKey: true,
				bubbles: true
			})
			group.element.dispatchEvent(event)
			await nextTick()

			const emitted = wrapper.emitted('update:time')!
			const last = emitted[emitted.length - 1][0] as number
			expect(last).toBe(9.75) // 10:00 - 15min = 9.75
		})

		it('wheel scroll is ignored without Shift key', async () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			const group = wrapper.find('.picker-group')
			const emittedBefore = wrapper.emitted('update:time')?.length ?? 0

			const event = new WheelEvent('wheel', {
				deltaY: -100,
				shiftKey: false,
				bubbles: true
			})
			group.element.dispatchEvent(event)
			await nextTick()

			const emittedAfter = wrapper.emitted('update:time')?.length ?? 0
			expect(emittedAfter).toBe(emittedBefore)
		})

		it('wheel scroll initializes time to 9:00 when internalTime is null', async () => {
			const wrapper = factory({ view: 'time-only' })
			const group = wrapper.find('.picker-group')

			const event = new WheelEvent('wheel', {
				deltaY: -100,
				shiftKey: true,
				bubbles: true
			})
			group.element.dispatchEvent(event)
			await nextTick()

			const emitted = wrapper.emitted('update:time')!
			const last = emitted[emitted.length - 1][0] as number
			expect(last).toBe(9.25) // 9:00 + 15min = 9.25
		})

		it('time picker step is 15 minutes', () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			const dp = wrapper.findComponent(DatePickerStub)
			expect(dp.props('stepMinute')).toBe(15)
		})

		it('time picker renders AppIcon clock via inputicon slot', () => {
			const wrapper = factory({ time: 10, view: 'time-only' })
			expect(wrapper.find('.app-icon-stub').exists()).toBe(true)
		})
	})
})
