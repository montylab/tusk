<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useCategoriesStore } from '../stores/categories'
  import draggable from 'vuedraggable'
  import InputText from 'primevue/inputtext'
  import Button from 'primevue/button'
  import ColorPicker from 'primevue/colorpicker'

  const categoriesStore = useCategoriesStore()

  // Local copy for dragging with computed setter
  const localCategories = computed({
    get: () => categoriesStore.categoriesArray,
    set: (newList) => {
      // If we just move items, we need to update their order in Firebase
      newList.forEach((cat, index) => {
        const targetOrder = index * 10
        if (cat.order !== targetOrder) {
          categoriesStore.updateCategory(cat.id, { order: targetOrder })
        }
      })
    }
  })

  const newCategoryName = ref('')
  const newCategoryColor = ref('3b82f6') // Default hex string (without # for PrimeVue ColorPicker)
  const newCategoryIsDeepWork = ref(false)

  const handleAddCategory = async () => {
    if (newCategoryName.value.trim()) {
      const color = newCategoryColor.value.startsWith('#') ? newCategoryColor.value : '#' + newCategoryColor.value
      await categoriesStore.addCategory(newCategoryName.value.trim(), color, newCategoryIsDeepWork.value)
      newCategoryName.value = ''
      newCategoryIsDeepWork.value = false
      // Keep color as is or reset? Let's keep it for now.
    }
  }

  const handleRemoveCategory = async (id: string) => {
    if (
      confirm(
        `Are you sure you want to delete the category? Any tasks using this category will remain, but without the color association.`
      )
    ) {
      await categoriesStore.deleteCategory(id)
    }
  }

  const handleUpdateColor = async (id: string, color: string) => {
    const formattedColor = color.startsWith('#') ? color : '#' + color
    await categoriesStore.updateCategory(id, { color: formattedColor })
  }

  const handleUpdateName = async (id: string, name: string) => {
    if (name.trim()) {
      await categoriesStore.updateCategory(id, { name: name.trim() })
    }
  }

  const handleUpdateDeepWork = async (id: string, isDeepWork: boolean) => {
    await categoriesStore.updateCategory(id, { isDeepWork })
  }

  // Helper to strip # for ColorPicker model
  const stripHex = (hex: string) => hex.replace('#', '')
</script>

<template>
  <div class="categories-manager">
    <div class="header">
      <h3>Manage Categories</h3>
      <p class="subtitle">Customize your task categories, colors, and organization</p>
    </div>

    <div class="add-section">
      <div class="input-group">
        <label>Category Name</label>
        <InputText
          v-model="newCategoryName"
          placeholder="e.g., Deep Work, Health..."
          @keyup.enter="handleAddCategory"
          class="name-input"
        />
      </div>
      <div class="input-group">
        <label>Color</label>
        <div class="color-picker-container">
          <ColorPicker v-model="newCategoryColor" />
          <span class="color-code">#{{ newCategoryColor }}</span>
        </div>
      </div>
      <div class="input-group checkbox-group">
        <label>Deep Work</label>
        <div class="checkbox-container">
          <input type="checkbox" v-model="newCategoryIsDeepWork" />
          <span class="checkbox-hint">Auto-enables for tasks</span>
        </div>
      </div>
      <Button
        label="Add Category"
        icon="pi pi-plus"
        @click="handleAddCategory"
        :disabled="!newCategoryName.trim()"
        class="add-button"
      />
    </div>

    <div class="list-section">
      <div v-if="categoriesStore.loading" class="loading">Loading categories...</div>

      <draggable
        v-else
        v-model="localCategories"
        item-key="id"
        handle=".drag-handle"
        class="categories-list"
        ghost-class="ghost"
      >
        <template #item="{ element }">
          <div class="category-item-card">
            <div class="drag-handle" title="Drag to reorder">
              <i class="pi pi-bars"></i>
            </div>

            <div class="color-swatch-wrapper">
              <div class="color-indicator" :style="{ backgroundColor: element.color }"></div>
              <ColorPicker
                :modelValue="stripHex(element.color)"
                @update:modelValue="(val) => handleUpdateColor(element.id, val)"
                class="inline-picker"
              />
            </div>

            <div class="item-content">
              <InputText
                v-model="element.name"
                @blur="handleUpdateName(element.id, element.name)"
                @keyup.enter="($event.target as HTMLInputElement).blur()"
                class="item-name-input"
              />
            </div>

            <div class="item-deep-work">
              <input
                type="checkbox"
                :checked="element.isDeepWork"
                @change="handleUpdateDeepWork(element.id, ($event.target as HTMLInputElement).checked)"
                title="Deep Work enabled"
              />
              <i class="pi pi-brain" v-if="element.isDeepWork" style="color: #a78bfa; font-size: 0.8rem"></i>
            </div>

            <div class="actions">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                @click="handleRemoveCategory(element.id)"
                title="Delete Category"
              />
            </div>
          </div>
        </template>
      </draggable>

      <div v-if="!categoriesStore.loading && localCategories.length === 0" class="empty-state">
        No categories found. Create your first one above!
      </div>
    </div>
  </div>
</template>

<style scoped>
  .categories-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .header h3 {
    font-size: 1.3rem;
    margin-bottom: 0.15rem;
    color: var(--text-main);
  }

  .subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .add-section {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    flex-wrap: wrap;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .input-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .color-picker-container {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    height: 36px;
  }

  .color-code {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-main);
  }

  .add-button {
    height: 36px;
    font-size: 0.9rem;
  }

  .checkbox-group {
    flex: 0 0 auto;
    min-width: 120px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 36px;
  }

  .checkbox-container input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #a78bfa;
  }

  .checkbox-hint {
    font-size: 0.65rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .list-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .category-item-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.75rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .category-item-card:hover {
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.04);
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .color-swatch-wrapper {
    position: relative;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }

  .inline-picker {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  /* Make ColorPicker invisible but clickable over the indicator */
  :deep(.p-colorpicker-trigger) {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
  }

  .item-content {
    flex: 1;
  }

  .item-name-input {
    width: 100%;
    background: transparent !important;
    border: none !important;
    font-size: 1rem !important;
    padding: 0.2rem 0.4rem !important;
    box-shadow: none !important;
  }

  .item-name-input:focus {
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .item-deep-work {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem;
  }

  .item-deep-work input {
    cursor: pointer;
    accent-color: #a78bfa;
  }

  .actions {
    display: flex;
    align-items: center;
  }

  :deep(.actions .p-button) {
    width: 28px;
    height: 28px;
  }

  .ghost {
    opacity: 0.4;
    background: var(--primary);
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius);
  }

  @media (max-width: 768px) {
    .add-section {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
