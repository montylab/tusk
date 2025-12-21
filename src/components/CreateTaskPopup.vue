<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { useCategoriesStore } from '../stores/categories'
import AutoComplete from 'primevue/autocomplete'; 

const props = defineProps<{
  show: boolean
  initialStartTime?: number | null
  initialDate?: string | null
  taskType?: 'todo' | 'shortcut' | 'scheduled'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { text: string, category: string, color: string, startTime?: number | null, duration?: number }): void
}>()

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

// Form fields
const taskText = ref('')
const categoryInput = ref('')
const selectedColor = ref('')
const duration = ref(60)
const startTime = ref<number | null>(props.initialStartTime ?? null)

// Autocomplete state for PrimeVue
const filteredSuggestions = ref<Array<{ name: string; color: string; isNew?: boolean }>>([]); // Holds suggestions for AutoComplete

// Get existing categories with their colors
const existingCategories = computed(() => {
  const categories = new Map<string, string>()
  
  // 1. Defaults (always suggest these if not present in store)
  const defaults = {
    'Work': 'hsl(210, 70%, 55%)',
    'Personal': 'hsl(160, 60%, 50%)',
    'Urgent': 'hsl(340, 75%, 55%)',
    'Learning': 'hsl(280, 65%, 60%)'
  }
  Object.entries(defaults).forEach(([name, color]) => categories.set(name, color))
  
  // 2. From dedicated categories store (primary - overrides defaults)
  categoriesStore.categoriesArray.forEach(c => {
    categories.set(c.name, c.color)
  })
  
  // 3. Fallback: categories found in existing tasks
  tasksStore.tasks.forEach(task => {
    if (task.category && !categories.has(task.category)) {
      categories.set(task.category, task.color || '#667eea')
    }
  })
  
  return Array.from(categories.entries()).map(([name, color]) => ({ name, color, isNew: false }))
})

// Generate a color for a new category
const generateColorForCategory = (categoryName: string): string => {
  const colors = [
    'hsl(210, 70%, 55%)', // Blue
    'hsl(340, 75%, 55%)', // Pink
    'hsl(160, 60%, 50%)', // Teal
    'hsl(45, 85%, 55%)',  // Yellow
    'hsl(280, 65%, 60%)', // Purple
    'hsl(25, 80%, 55%)',  // Orange
    'hsl(120, 50%, 50%)', // Green
    'hsl(190, 70%, 50%)', // Cyan
  ]
  
  // Simple hash function to pick a color based on category name
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// PrimeVue AutoComplete search method
const searchCategory = (event: { query: string }) => {
  const query = event.query.trim().toLowerCase();
  let _filtered = existingCategories.value.filter(cat => cat.name.toLowerCase().includes(query));
  const exactMatch = _filtered.some(cat => cat.name.toLowerCase() === query);
  
  if (!exactMatch && query) {
    const suggestedColor = generateColorForCategory(event.query);
    _filtered.push({ name: event.query, color: suggestedColor, isNew: true });
  }
  filteredSuggestions.value = _filtered;
};

// Handle selection from AutoComplete
const onCategorySelect = (event: any) => {
  const item = event.value;
  categoryInput.value = item.name;
  selectedColor.value = item.color;
};

// Watch categoryInput to update selectedColor when typing
watch(categoryInput, (newValue) => {
  const foundCategory = existingCategories.value.find(cat => cat.name.toLowerCase() === newValue.toLowerCase());
  if (foundCategory) {
    selectedColor.value = foundCategory.color;
  } else if (newValue.trim()) {
    // If it's a new category being typed, generate a color
    selectedColor.value = generateColorForCategory(newValue);
  } else {
    selectedColor.value = ''; // Clear color if input is empty
  }
});

// Handle form submission
const handleSubmit = async () => {
  if (!taskText.value.trim()) return
  
  const finalCategoryName = categoryInput.value.trim() || 'Default'
  const finalColor = selectedColor.value || '#667eea' // fallback
  
  // Persist category if new
  await categoriesStore.ensureCategoryExists(finalCategoryName, finalColor)
  
  emit('create', {
    text: taskText.value.trim(),
    category: finalCategoryName,
    color: finalColor,
    startTime: props.taskType === 'scheduled' ? (startTime.value ?? 9) : null,
    duration: duration.value
  })
  
  resetForm()
}

const resetForm = () => {
  taskText.value = ''
  categoryInput.value = ''
  selectedColor.value = ''
  duration.value = 60
  startTime.value = props.initialStartTime ?? null
  filteredSuggestions.value = []
}

const handleClose = () => {
  resetForm()
  emit('close')
}

// Focus task text input when popup opens
const taskTextInput = ref<HTMLInputElement | null>(null)
watch(() => props.show, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      taskTextInput.value?.focus()
    }, 100)
  }
})

// Format time for display
const formatTime = (time: number) => {
  const hours = Math.floor(time)
  const minutes = Math.round((time % 1) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="show" class="popup-overlay" @click.self="handleClose">
        <div class="popup-container">
          <div class="popup-header">
            <h2>Create New Task</h2>
            <button class="close-btn" @click="handleClose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="popup-form">
            <!-- Task Name -->
            <div class="form-group">
              <label for="task-text">Task Name</label>
              <input
                id="task-text"
                ref="taskTextInput"
                v-model="taskText"
                type="text"
                placeholder="Enter task name..."
                class="form-input"
                required
              />
            </div>
            
            <!-- Category with Autocomplete -->

            <div class="form-group">
              <label for="category">Category</label>
              <div class="category-input-wrapper">
                <AutoComplete
                   id="category"
                   v-model="categoryInput"
                   :suggestions="filteredSuggestions"
                   @complete="searchCategory"
                   @item-select="onCategorySelect"
                   field="name"
                   placeholder="Type to search or create..."
                   :dropdown="true"
                   :forceSelection="false"
                   input-class="form-input"
                   panel-class="p-autocomplete-panel-custom"
                   class="p-autocomplete-root-custom"
                 >
                   <template #option="slotProps">
                     <div class="suggestion-item">
                        <div class="suggestion-color" :style="{ background: slotProps.option.color }"></div>
                        <span class="suggestion-name">{{ slotProps.option.name }}</span>
                        <span v-if="slotProps.option.isNew" class="new-badge">New</span>
                     </div>
                   </template>
                 </AutoComplete>
                
                <!-- Color Preview -->
                <div 
                  v-if="selectedColor" 
                  class="color-preview"
                  :style="{ background: selectedColor }"
                ></div>
              </div>
            </div>
            
            <!-- Duration -->
            <div class="form-group">
              <label for="duration">Duration (minutes)</label>
              <input
                id="duration"
                v-model.number="duration"
                type="number"
                min="15"
                step="15"
                class="form-input"
              />
            </div>
            
            <!-- Start Time (for scheduled tasks) -->
            <div v-if="taskType === 'scheduled'" class="form-group">
              <label for="start-time">Start Time</label>
              <input
                id="start-time"
                v-model.number="startTime"
                type="number"
                min="0"
                max="24"
                step="0.25"
                class="form-input"
              />
              <span v-if="startTime !== null" class="time-preview">
                {{ formatTime(startTime) }}
              </span>
            </div>
            
            <!-- Actions -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="handleClose">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.popup-container {
  background: linear-gradient(135deg, rgba(30, 30, 45, 0.98), rgba(20, 20, 35, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.popup-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.popup-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.category-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* PrimeVue AutoComplete specific styling */
.p-autocomplete-root-custom {
  flex: 1;
  width: 100%;
}

:deep(.p-autocomplete-input) {
  width: 100%;
  padding-right: 3rem;
}

:deep(.p-autocomplete-panel-custom) {
  background: rgba(30, 30, 45, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  max-height: 240px;
  overflow-y: auto;
  z-index: 10001;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  margin-top: 0.5rem;
  padding: 0;
}

:deep(.p-autocomplete-list) {
  padding: 0;
  margin: 0;
  list-style: none;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.suggestion-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.suggestion-name {
  flex: 1;
  color: #fff;
  font-size: 0.9rem;
}

.new-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-preview {
  position: absolute;
  right: 1rem;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.time-preview {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Transitions */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
</style>
