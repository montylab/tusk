<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const currentDate = ref<string>('')

  watch(
    () => route.params.date,
    (newDate) => {
      if (newDate && typeof newDate === 'string') {
        currentDate.value = newDate
      } else {
        const today = new Date().toISOString().split('T')[0]
        currentDate.value = today
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="week-view-page">
    <div class="placeholder-content">
      <h1>Week View</h1>
      <p v-if="currentDate">Showing week for: {{ currentDate }}</p>
      <p class="note">Week view component will be implemented here</p>
    </div>
  </div>
</template>

<style scoped>
  .week-view-page {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-content {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 12px;
  }

  .placeholder-content h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--text-light);
  }

  .placeholder-content p {
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .note {
    font-style: italic;
    font-size: 0.9rem;
  }
</style>
