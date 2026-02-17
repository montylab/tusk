import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import CategoriesManager from '../CategoriesManager.vue'
import { useCategoriesStore } from '../../stores/categories'
import { useSettingsStore } from '../../stores/settings'

// --- Mock external modules using vi.hoisted ---

const mocks = vi.hoisted(() => {
	const DraggableMock = {
		name: 'Draggable',
		template: `<div class="draggable-mock"><template v-for="el in (modelValue || [])" :key="el.id"><slot name="item" :element="el" /></template></div>`,
		props: ['modelValue', 'list', 'itemKey', 'handle', 'ghostClass'],
		emits: ['update:modelValue']
	}

	const InputTextStub = {
		name: 'InputText',
		template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\', $event)" />',
		props: ['modelValue'],
		emits: ['update:modelValue', 'blur']
	}

	const ButtonStub = {
		name: 'Button',
		template: '<button @click="$emit(\'click\', $event)"><slot/></button>',
		props: ['icon', 'label', 'severity', 'text', 'rounded', 'disabled'],
		emits: ['click']
	}

	const ColorPickerStub = {
		name: 'ColorPicker',
		template: '<div class="color-picker-stub"></div>',
		props: ['modelValue'],
		emits: ['update:modelValue']
	}

	const ColorPickerInputStub = {
		name: 'ColorPickerInput',
		template: '<div class="color-picker-input-stub"></div>',
		props: ['modelValue'],
		emits: ['update:modelValue']
	}

	const AppCheckboxStub = {
		name: 'AppCheckbox',
		template: '<div class="app-checkbox-stub"></div>',
		props: ['modelValue', 'label'],
		emits: ['update:modelValue']
	}

	return {
		DraggableMock,
		InputTextStub,
		ButtonStub,
		ColorPickerStub,
		ColorPickerInputStub,
		AppCheckboxStub
	}
})

vi.mock('vuedraggable', () => ({ default: mocks.DraggableMock }))
vi.mock('primevue/inputtext', () => ({ default: mocks.InputTextStub }))
vi.mock('primevue/button', () => ({ default: mocks.ButtonStub }))
vi.mock('primevue/colorpicker', () => ({ default: mocks.ColorPickerStub }))
vi.mock('../ColorPickerInput.vue', () => ({ default: mocks.ColorPickerInputStub }))
vi.mock('../common/AppCheckbox.vue', () => ({ default: mocks.AppCheckboxStub }))

// Mock firebase to prevent store watch side-effects
vi.mock('../../services/firebaseService', () => ({
	subscribeToCategories: vi.fn(),
	createCategory: vi.fn().mockResolvedValue({ id: 'new-id' }),
	updateCategory: vi.fn().mockResolvedValue(undefined),
	deleteCategory: vi.fn().mockResolvedValue(undefined)
}))

describe('CategoriesManager.vue', () => {
	const initialCategories = [
		{ id: '1', name: 'Work', color: '#ff0000', order: 0, isDeepWork: false },
		{ id: '2', name: 'Health', color: '#00ff00', order: 10, isDeepWork: true }
	]

	const mountComponent = async (overrides: Record<string, any> = {}) => {
		const categoriesMap = initialCategories.reduce(
			(acc, cat) => {
				acc[cat.id] = cat
				return acc
			},
			{} as Record<string, any>
		)

		const wrapper = mount(CategoriesManager, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							categories: {
								categoriesMap,
								loading: false,
								...overrides.categories
							},
							settings: {
								...overrides.settings
							}
						}
					})
				],
				components: {
					ColorPickerInput: mocks.ColorPickerInputStub,
					AppCheckbox: mocks.AppCheckboxStub
				}
			}
		})

		// Re-populate the map since the store watch clears it
		const categoriesStore = useCategoriesStore()
		categoriesStore.categoriesMap = { ...categoriesMap, ...overrides.categories?.categoriesMap }
		if (overrides.categories?.loading !== undefined) {
			categoriesStore.loading = overrides.categories.loading
		}

		// Configure settings store
		const settingsStore = useSettingsStore()
		settingsStore.getRandomCategoryColor = vi.fn().mockReturnValue('#abcdef')

		await nextTick()
		return wrapper
	}

	it('renders list of categories', async () => {
		const wrapper = await mountComponent()

		const items = wrapper.findAll('.category-item-card')
		expect(items).toHaveLength(2)

		// Input values don't appear in wrapper.text(), check the input elements directly
		const inputs = items.map((item) => item.findComponent(mocks.InputTextStub))
		expect(inputs[0].props('modelValue')).toBe('Work')
		expect(inputs[1].props('modelValue')).toBe('Health')
	})

	it('adds a new category', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		// Find the add-section input (first InputText in the add section)
		const addSection = wrapper.find('.add-section')
		const nameInput = addSection.findComponent(mocks.InputTextStub)
		await nameInput.vm.$emit('update:modelValue', 'New Cat')
		await nextTick()

		// Set color
		const colorInput = addSection.findComponent(mocks.ColorPickerInputStub)
		await colorInput.vm.$emit('update:modelValue', '#123456')
		await nextTick()

		// Click add button
		const addBtn = wrapper.find('.add-button')
		await addBtn.trigger('click')
		await flushPromises()

		expect(categoriesStore.addCategory).toHaveBeenCalledWith('New Cat', '#123456', false)
	})

	it('updates category name on blur', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		// Find item inputs (skip the add-section input, get category list inputs)
		const categoryCards = wrapper.findAll('.category-item-card')
		expect(categoryCards.length).toBeGreaterThan(0)

		const firstCardInput = categoryCards[0].findComponent(mocks.InputTextStub)
		await firstCardInput.vm.$emit('update:modelValue', 'Work Updated')
		await firstCardInput.trigger('blur')
		await flushPromises()

		expect(categoriesStore.updateCategory).toHaveBeenCalledWith('1', { name: 'Work Updated' })
	})

	it('updates category color via ColorPicker', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		// Find the first ColorPicker inside category items
		const categoryCards = wrapper.findAll('.category-item-card')
		const firstPicker = categoryCards[0].findComponent(mocks.ColorPickerStub)
		await firstPicker.vm.$emit('update:modelValue', '0000ff')
		await flushPromises()

		expect(categoriesStore.updateCategory).toHaveBeenCalledWith('1', { color: '#0000ff' })
	})

	it('deletes a category after confirmation', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		vi.spyOn(window, 'confirm').mockReturnValue(true)

		const categoryCards = wrapper.findAll('.category-item-card')
		const deleteBtn = categoryCards[0].find('.actions').findComponent(mocks.ButtonStub)
		await deleteBtn.trigger('click')
		await flushPromises()

		expect(window.confirm).toHaveBeenCalled()
		expect(categoriesStore.deleteCategory).toHaveBeenCalledWith('1')
	})

	it('does not delete if confirmation is cancelled', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		vi.spyOn(window, 'confirm').mockReturnValue(false)

		const categoryCards = wrapper.findAll('.category-item-card')
		const deleteBtn = categoryCards[0].find('.actions').findComponent(mocks.ButtonStub)
		await deleteBtn.trigger('click')
		await flushPromises()

		expect(window.confirm).toHaveBeenCalled()
		expect(categoriesStore.deleteCategory).not.toHaveBeenCalled()
	})

	it('shows loading state', async () => {
		const wrapper = mount(CategoriesManager, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							categories: { loading: true, categoriesMap: {} },
							settings: {}
						}
					})
				],
				components: {
					ColorPickerInput: mocks.ColorPickerInputStub,
					AppCheckbox: mocks.AppCheckboxStub
				}
			}
		})

		const categoriesStore = useCategoriesStore()
		categoriesStore.loading = true
		await nextTick()

		expect(wrapper.text()).toContain('Loading categories...')
	})

	it('shows empty state when no categories', async () => {
		const wrapper = mount(CategoriesManager, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							categories: { loading: false, categoriesMap: {} },
							settings: {}
						}
					})
				],
				components: {
					ColorPickerInput: mocks.ColorPickerInputStub,
					AppCheckbox: mocks.AppCheckboxStub
				}
			}
		})
		await nextTick()

		expect(wrapper.text()).toContain('No categories found')
	})

	it('toggles deep work via AppCheckbox', async () => {
		const wrapper = await mountComponent()
		const categoriesStore = useCategoriesStore()

		const categoryCards = wrapper.findAll('.category-item-card')
		const firstCheckbox = categoryCards[0].findComponent(mocks.AppCheckboxStub)
		await firstCheckbox.vm.$emit('update:modelValue', true)
		await flushPromises()

		expect(categoriesStore.updateCategory).toHaveBeenCalledWith('1', { isDeepWork: true })
	})
})
