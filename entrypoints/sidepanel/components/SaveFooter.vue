<script lang="ts" setup>
import { ref } from 'vue';

defineProps<{
  folder: string;
  tags: string;
  recentPaths: string[];
  canSave: boolean;
}>();

const emit = defineEmits<{
  'update:folder': [value: string];
  'update:tags': [value: string];
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
    <div class="save-config">
      <input
        :value="folder"
        @input="emit('update:folder', ($event.target as HTMLInputElement).value)"
        placeholder="文件夹路径"
        class="config-input"
        list="recent-paths"
      />
      <datalist id="recent-paths">
        <option v-for="path in recentPaths" :key="path" :value="path" />
      </datalist>
      <input
        :value="tags"
        @input="emit('update:tags', ($event.target as HTMLInputElement).value)"
        placeholder="标签（逗号分隔）"
        class="config-input"
      />
    </div>

    <div class="save-actions">
      <div class="save-btn-group">
        <button class="save-btn primary" @click="handleSaveToObsidian" :disabled="!canSave">
          保存到 Obsidian
        </button>
        <button class="save-btn dropdown-toggle" @click="showSaveMenu = !showSaveMenu">
          ▼
        </button>

        <div v-if="showSaveMenu" class="save-menu">
          <button @click="handleDownloadAsMd">📥 保存为 .md 文件</button>
          <button @click="handleCopyMd">📋 复制 Markdown</button>
          <button @click="handleCopyHtml">📄 复制 HTML</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.save-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.config-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.config-input:focus {
  outline: none;
  border-color: #007aff;
}

.save-actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn-group {
  position: relative;
  display: flex;
}

.save-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn.primary {
  background: #007aff;
  color: #fff;
  border-color: #007aff;
  border-radius: 6px 0 0 6px;
}

.save-btn.primary:hover:not(:disabled) {
  background: #0066dd;
}

.save-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn.dropdown-toggle {
  padding: 10px 12px;
  background: #007aff;
  color: #fff;
  border-color: #007aff;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0 6px 6px 0;
}

.save-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.save-menu button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.save-menu button:hover {
  background: #f5f5f5;
}
</style>
