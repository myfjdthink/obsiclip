<script lang="ts" setup>
defineProps<{
  title: string;
  sourceUrl: string;
  refreshing?: boolean;
}>();

const emit = defineEmits<{
  'update:title': [value: string];
  refresh: [];
  openSettings: [];
}>();

function handleOpenSettings() {
  browser.tabs.create({
    url: browser.runtime.getURL('settings.html')
  });
  emit('openSettings');
}
</script>

<template>
  <header class="header">
    <div class="header-top">
      <span class="logo">ObsiClip</span>
      <div class="header-actions">
        <button
          class="clickable-icon"
          @click="emit('refresh')"
          :disabled="refreshing"
          title="刷新内容"
        >
          <svg :class="['icon', { spinning: refreshing }]" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
        <button
          class="clickable-icon"
          @click="handleOpenSettings"
          title="设置"
        >
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
    <div class="source-info">
      <span class="source-url" :title="sourceUrl">{{ sourceUrl }}</span>
    </div>
    <input
      :value="title"
      @input="emit('update:title', ($event.target as HTMLInputElement).value)"
      class="title-input"
      placeholder="笔记标题"
    />
  </header>
</template>

<style scoped>
.header {
  padding: var(--popup-padding);
  border-bottom: 1px solid var(--divider-color);
  background: var(--background-primary);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.logo {
  font-size: var(--font-ui-medium);
  font-weight: 600;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  gap: 2px;
}

.clickable-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.source-info {
  margin-bottom: 6px;
  font-size: var(--font-ui-smaller);
}

.source-url {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.title-input {
  width: 100%;
  border: none;
  font-size: var(--font-ui-medium);
  font-weight: 600;
  padding: 6px 8px;
  background: var(--background-secondary);
  border-radius: var(--radius-s);
  color: var(--text-normal);
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
}
</style>
