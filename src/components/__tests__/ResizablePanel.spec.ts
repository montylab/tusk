import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ResizablePanel from '../ResizablePanel.vue'

describe('ResizablePanel.vue', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	const mountComponent = (propsOffset = {}) => {
		return mount(ResizablePanel, {
			props: {
				side: 'right',
				defaultSize: 300,
				...propsOffset
			},
			slots: {
				default: '<div class="content">Content</div>'
			}
		})
	}

	it('renders with default size', () => {
		const wrapper = mountComponent({ defaultSize: 250 })
		expect(wrapper.element.style.width).toBe('250px')
	})

	it('loads size from localStorage on mount', async () => {
		localStorage.setItem('panel-size', '400')
		const wrapper = mountComponent({ storageKey: 'panel-size' })
		// Wait for onMounted
		await nextTick()
		expect(wrapper.element.style.width).toBe('400px')
	})

	it('emits resize on mount', () => {
		const wrapper = mountComponent({ defaultSize: 200 })
		expect(wrapper.emitted('resize')).toBeTruthy()
		expect(wrapper.emitted('resize')![0]).toEqual([200])
	})

	it('resizes on mousemove (right side)', async () => {
		const wrapper = mountComponent({ side: 'right', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		// Start drag at clientX = 400
		await handle.trigger('mousedown', { clientX: 400 })
		expect(wrapper.find('.resize-handle').classes()).toContain('dragging')

		// Move mouse to 450 (+50px)
		const moveEvent = new MouseEvent('mousemove', { clientX: 450 })
		document.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.element.style.width).toBe('350px')
		expect(wrapper.emitted('resize')).toContainEqual([350])
	})

	it('resizes on mousemove (left side)', async () => {
		const wrapper = mountComponent({ side: 'left', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		// Start drag at clientX = 400
		await handle.trigger('mousedown', { clientX: 400 })

		// Move mouse to 450 (+50px)
		// delta = startPos - currentPos = 400 - 450 = -50
		// newSize = 300 - 50 = 250
		const moveEvent = new MouseEvent('mousemove', { clientX: 450 })
		document.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.element.style.width).toBe('250px')
	})

	it('constrains size between minSize and maxSize', async () => {
		const wrapper = mountComponent({
			side: 'right',
			defaultSize: 300,
			minSize: 200,
			maxSize: 400
		})
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })

		// Move to 600 (+200px) -> size 500 -> clamped to 400
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600 }))
		await nextTick()
		expect(wrapper.element.style.width).toBe('400px')

		// Move to 100 (-300px) -> size 0 -> clamped to 200
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }))
		await nextTick()
		expect(wrapper.element.style.width).toBe('200px')
	})

	it('saves size to localStorage on drag end', async () => {
		const wrapper = mountComponent({ storageKey: 'test-key', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }))
		await nextTick()

		document.dispatchEvent(new MouseEvent('mouseup'))
		expect(localStorage.getItem('test-key')).toBe('350')
	})

	it('handles touch events', async () => {
		const wrapper = mountComponent({ side: 'right', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		// touchstart
		await handle.trigger('touchstart', { touches: [{ clientX: 400 }] })

		// touchmove
		const touchMoveEvent = new TouchEvent('touchmove', {
			touches: [{ clientX: 450 } as any]
		})
		document.dispatchEvent(touchMoveEvent)
		await nextTick()
		expect(wrapper.element.style.width).toBe('350px')

		// touchend
		document.dispatchEvent(new TouchEvent('touchend'))
		await nextTick()
		expect(wrapper.find('.resize-handle').classes()).not.toContain('dragging')
	})
})
