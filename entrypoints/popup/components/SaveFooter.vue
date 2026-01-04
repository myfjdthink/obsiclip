<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from '@/utils/i18n';

const { t } = useI18n();

defineProps<{
  folder: string;
  recentPaths: string[];
  canSave: boolean;
  isProcessing?: boolean;
}>();

const emit = defineEmits<{
  'update:folder': [value: string];
  saveToObsidian: [];
  downloadAsMd: [];
  copyMd: [];
  copyHtml: [];
}>();

const showSaveMenu = ref(false);

function handleSaveToObsidian() {
  emit('saveToObsidian');
  showSaveMenu.value = false;
}

function handleDownloadAsMd() {
  emit('downloadAsMd');
  showSaveMenu.value = false;
}

function handleCopyMd() {
  emit('copyMd');
  showSaveMenu.value = false;
}

function handleCopyHtml() {
  emit('copyHtml');
  showSaveMenu.value = false;
}
</script>

<template>
  <footer class="footer">
    <div class="folder-row">
      <label class="folder-label">{{ t('saveFooter.folderLabel') }}</label>
      <input
        :value="folder"
        @input="emit('update:folder', ($event.target as HTMLInputElement).value)"
        class="folder-input"
        list="recent-paths"
      />
      <datalist id="recent-paths">
        <option v-for="path in recentPaths" :key="path" :value="path" />
      </datalist>
    </div>

    <div class="save-row">
      <div class="save-btn-group">
        <button class="save-btn primary" @click="handleSaveToObsidian" :disabled="!canSave || isProcessing">
          {{ t('saveFooter.saveToObsidian') }}
        </button>
        <button class="save-btn dropdown-toggle" @click="showSaveMenu = !showSaveMenu" :disabled="isProcessing">
          ▼
        </button>

        <div v-if="showSaveMenu" class="save-menu">
          <button @click="handleDownloadAsMd">{{ t('saveFooter.saveAsMd') }}</button>
          <button @click="handleCopyMd">{{ t('saveFooter.copyMd') }}</button>
          <button @click="handleCopyHtml">{{ t('saveFooter.copyHtml') }}</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: var(--popup-padding);
  border-top: 1px solid var(--divider-color);
  background: var(--background-primary);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.folder-label {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  white-space: nowrap;
}

.folder-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-s);
  font-size: var(--font-ui-smaller);
  min-width: 0;
  background: var(--background-primary);
  color: var(--text-normal);
}

.folder-input:focus {
  outline: none;
  border-color: var(--interactive-accent);
}

.save-row {
  display: flex;
}

.save-btn-group {
  position: relative;
  display: flex;
  flex: 1;
}

.save-btn {
  padding: 8px 16px;
  border: none;
  background: var(--background-primary);
  font-size: var(--font-ui-small);
  font-weight: 500;
  cursor: pointer;
}

.save-btn.primary {
  flex: 1;
  background: var(--interactive-accent);
  color: #fff;
  border-radius: var(--radius-s) 0 0 var(--radius-s);
}

.save-btn.primary:hover:not(:disabled) {
  background: var(--interactive-accent-hover);
}

.save-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn.dropdown-toggle {
  padding: 8px 10px;
  background: var(--interactive-accent);
  color: #fff;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0 var(--radius-s) var(--radius-s) 0;
}

.save-btn.dropdown-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-s);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.save-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: var(--font-ui-smaller);
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-normal);
}

.save-menu button:hover {
  background: var(--background-modifier-hover);
}
</style>
