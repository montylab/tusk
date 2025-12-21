<script setup lang="ts">
// Settings page placeholder
</script>

<template>
  <div class="settings-page">
    <div class="settings-content">
      <h1>Settings</h1>
      <p class="note">Settings configuration will be implemented here</p>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.settings-content {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.settings-content h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--text-light);
}

.note {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.9rem;
}
</style>
