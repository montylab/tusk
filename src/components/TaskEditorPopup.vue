<script
  setup
  lang="ts"
>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import type { Task } from '../types'
import CategorySelector from './CategorySelector.vue'
import TaskDateTimePicker from './TaskDateTimePicker.vue'

const props = defineProps<{
  show: boolean
  initialStartTime?: number | null
  initialDate?: string | null
  taskType?: 'todo' | 'shortcut' | 'scheduled'
  task?: Task | null // Prop for editing
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { text: string, description: string, category: string, isDeepWork: boolean, startTime?: number | null, duration?: number, date?: string | null }): void
  (e: 'update', payload: { id: string | number, updates: Partial<Task> }): void
}>()

const categoriesStore = useCategoriesStore()

// Form fields
const taskText = ref('')
const taskDescription = ref('')
const categoryInput = ref('')
const selectedColor = ref('')
const isDeepWork = ref(false)
const duration = ref(1.0) // Store as decimal hours (1.0 = 60 mins)

const getTodayString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const startTime = ref<number | null>(props.initialStartTime ?? null)
const taskDate = ref<string | null>(props.initialDate ?? getTodayString())

const isEditMode = computed(() => !!props.task)

// Initialize form from props/task
const resetForm = () => {
  if (props.task) {
    taskText.value = props.task.text
    taskDescription.value = props.task.description || ''
    categoryInput.value = props.task.category
    selectedColor.value = props.task.color || ''
    duration.value = (props.task.duration || 60) / 60
    startTime.value = props.task.startTime ?? null
    taskDate.value = props.task.date ?? getTodayString()
    isDeepWork.value = !!props.task.isDeepWork
  } else {
    taskText.value = ''
    taskDescription.value = ''
    categoryInput.value = ''
    selectedColor.value = ''
    isDeepWork.value = false
    duration.value = 1.0
    startTime.value = props.initialStartTime ?? (props.taskType === 'scheduled' ? 9 : null)
    taskDate.value = props.initialDate ?? getTodayString()
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!taskText.value.trim()) return

  const finalCategoryName = categoryInput.value.trim() || 'Default'
  const finalColor = selectedColor.value || '#667eea' // fallback

  // Persist category if new
  await categoriesStore.ensureCategoryExists(finalCategoryName, finalColor, isDeepWork.value)

  if (isEditMode.value && props.task) {
    emit('update', {
      id: props.task.id,
      updates: {
        text: taskText.value.trim(),
        description: taskDescription.value.trim(),
        category: finalCategoryName,
        startTime: startTime.value,
        duration: Math.round(duration.value * 60),
        date: taskDate.value,
        isDeepWork: isDeepWork.value
      }
    })
  } else {
    emit('create', {
      text: taskText.value.trim(),
      description: taskDescription.value.trim(),
      category: finalCategoryName,
      isDeepWork: isDeepWork.value,
      startTime: props.taskType === 'scheduled' ? (startTime.value ?? 9) : null,
      duration: Math.round(duration.value * 60),
      date: taskDate.value
    })
  }

  handleClose()
}

const handleClose = () => {
  emit('close')
}

// Reset form when visibility or task prop changes
watch([() => props.show, () => props.task], ([newShow], [oldShow]) => {
  if (newShow) {
    resetForm()
    if (newShow && !oldShow) {
      setTimeout(() => {
        taskTextInput.value?.focus()
      }, 100)
    }
  }
}, { immediate: true })

const taskTextInput = ref<HTMLInputElement | null>(null)

// Handle Escape key to close popup
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="show"
           class="popup-overlay"
           @mousedown.self="handleClose">
        <div class="popup-container">
          <div class="popup-header">
            <h2>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h2>
            <button class="close-btn"
                    @click="handleClose">
              <svg width="20"
                   height="20"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit"
                class="popup-form">
            <!-- Task Name -->
            <div class="form-group">
              <label for="task-text">Task Name</label>
              <input id="task-text"
                     ref="taskTextInput"
                     v-model="taskText"
                     type="text"
                     placeholder="Enter task name..."
                     class="form-input"
                     required />
            </div>

            <!-- Category with Autocomplete -->
            <div class="form-group">
              <label for="category">Category</label>
              <CategorySelector v-model:name="categoryInput"
                                v-model:color="selectedColor"
                                v-model:isDeepWork="isDeepWork" />
            </div>

            <!-- Duration -->
            <div class="form-group"
                 v-if="taskType !== 'todo' || isEditMode">
              <label for="duration">Duration (HH:mm)</label>
              <TaskDateTimePicker v-model:time="duration"
                                  view="time-only" />
            </div>

            <!-- Date & Time (for scheduled tasks) -->
            <div v-if="taskType === 'scheduled' || (isEditMode && startTime !== null)"
                 class="form-group">
              <label>Date & Time</label>
              <TaskDateTimePicker v-model:date="taskDate"
                                  v-model:time="startTime" />
            </div>

            <!-- Deep Work Toggle -->
            <div class="form-group">
              <div class="checkbox-group">
                <input id="deep-work"
                       v-model="isDeepWork"
                       type="checkbox"
                       class="form-checkbox" />
                <label for="deep-work"
                       class="checkbox-label">Deep Work</label>
                <div class="deep-work-hint">Focused, uninterrupted work</div>
              </div>
            </div>

            <!-- Task Description -->
            <div class="form-group">
              <label for="task-description">Description</label>
              <textarea id="task-description"
                        v-model="taskDescription"
                        placeholder="Add details..."
                        class="form-input"
                        rows="3"
                        style="resize: vertical; min-height: 80px;"></textarea>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button"
                      class="btn btn-secondary"
                      @click="handleClose">
                Cancel
              </button>
              <button type="submit"
                      class="btn btn-primary">
                {{ isEditMode ? 'Save Changes' : 'Create Task' }}
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
  z-index: 1000;
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


.time-preview {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.checkbox-group:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(124, 58, 237, 0.3);
}

.checkbox-group:has(.form-checkbox:checked) {
  background: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.4);
}

.form-checkbox {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #7c3aed;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  margin: 0 !important;
  text-transform: none !important;
}

.deep-work-hint {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
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
