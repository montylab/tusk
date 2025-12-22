<script setup lang="ts">
import CategoriesManager from '../components/CategoriesManager.vue'
</script>

<template>
  <div class="settings-page">
    <div class="settings-content-wrapper">
      <header class="page-header">
        <h1>Settings</h1>
        <p>Manage your application preferences and data</p>
      </header>

      <div class="settings-container">
        <section class="settings-section">
          <CategoriesManager />
        </section>

        <!-- Future settings sections can go here -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  color: var(--text-main);
}

.settings-content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.page-header {
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-header p {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.settings-section {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
