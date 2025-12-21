<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  active?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:bounds', rect: DOMRect): void
}>()

const basketRef = ref<HTMLElement | null>(null)

const updateBounds = () => {
  if (basketRef.value) {
    emit('update:bounds', basketRef.value.getBoundingClientRect())
  }
}

onMounted(() => {
  updateBounds()
  window.addEventListener('resize', updateBounds)
  
  if (basketRef.value) {
    const resizeObserver = new ResizeObserver(() => updateBounds())
    resizeObserver.observe(basketRef.value)
    ;(basketRef.value as any).__resizeObserver = resizeObserver
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBounds)
  if (basketRef.value && (basketRef.value as any).__resizeObserver) {
    (basketRef.value as any).__resizeObserver.disconnect()
  }
})

defineExpose({
  updateBounds
})
</script>

<template>
  <div 
    ref="basketRef"
    class="trash-basket"
    :class="{ 'active': active }"
  >
    <div class="icon-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trash-icon">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </div>
    <span class="label">Delete</span>
  </div>
</template>

<style scoped>
.trash-basket {
  width: 120px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 67, 67, 0.05);
  border-right: 1px solid rgba(255, 67, 67, 0.2);
  transition: all 0.3s ease;
  color: #ff4343;
  gap: 8px;
}

.trash-basket.active {
  background: rgba(255, 67, 67, 0.2);
  transform: scaleX(1.1);
  box-shadow: 10px 0 20px rgba(255, 67, 67, 0.1);
}

.icon-container {
  padding: 12px;
  border-radius: 50%;
  background: rgba(255, 67, 67, 0.1);
  transition: transform 0.2s ease;
}

.active .icon-container {
  transform: scale(1.2) rotate(5deg);
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.active .label {
  opacity: 1;
}

.trash-icon {
    width: 28px;
    height: 28px;
}
</style>
