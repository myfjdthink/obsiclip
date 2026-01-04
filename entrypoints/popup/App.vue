<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useSettings } from './composables/useSettings';
import { useContent } from './composables/useContent';
import { useObsidian } from './composables/useObsidian';
import HeaderMenu from './components/HeaderMenu.vue';
import RawContentTab from './components/RawContentTab.vue';
import AiPreviewTab from './components/AiPreviewTab.vue';
import SaveFooter from './components/SaveFooter.vue';

// 视图状态
const refreshing = ref(false);

// Composables
const settings = useSettings();
const content = useContent();
const obsidian = useObsidian({
  vault: settings.vault,
  folder: settings.folder,
  tags: settings.tags,
  recentPaths: settings.recentPaths,
  title: content.title,
  currentContent: content.currentContent,
  extractedContent: content.extractedContent,
});

// 来源 URL
const sourceUrl = computed(() => content.extractedContent.value?.url || '');

// 初始化
onMounted(async () => {
  try {
    await settings.loadSettings();
    browser.runtime.onMessage.addListener(content.handleMessage);
    await content.extractContent();
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    content.loading.value = false;
  }
});

// AI 处理
function handleProcessWithAI() {
  if (!settings.hasApiKey.value) {
    browser.tabs.create({
      url: browser.runtime.getURL('settings.html')
    });
    return;
  }
  content.processWithAI(
    settings.getLLMConfig(),
    settings.getFinalPrompt(),
    settings.promptModified.value
  );
}

// 监听 AI 结果，自动填写文件夹路径
watch(
  () => content.aiResult.value?.category,
  (category) => {
    if (category) {
      settings.folder.value = category;
    }
  }
);

// 刷新内容
async function handleRefresh() {
  refreshing.value = true;
  content.activeTab.value = 'raw';
  try {
    await content.extractContent();
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div class="popup">
    <HeaderMenu
      v-model:title="content.title.value"
      :sourceUrl="sourceUrl"
      :refreshing="refreshing"
      @refresh="handleRefresh"
    />

    <div class="tabs">
      <button
        :class="['tab', { active: content.activeTab.value === 'raw' }]"
        @click="content.activeTab.value = 'raw'"
      >
        原始内容
      </button>
      <button
        :class="['tab', { active: content.activeTab.value === 'ai' }]"
        @click="content.activeTab.value = 'ai'"
      >
        AI 整理
      </button>
    </div>

    <div v-if="content.loading.value" class="loading">
      <div class="spinner"></div>
      <span>提取内容中...</span>
    </div>

    <main v-else class="content">
      <RawContentTab
        v-if="content.activeTab.value === 'raw'"
        v-model:rawMarkdown="content.rawMarkdown.value"
        :canProcess="content.canProcess.value"
        :hasApiKey="settings.hasApiKey.value"
        :refreshing="refreshing"
        @processWithAI="handleProcessWithAI"
        @refresh="handleRefresh"
      />

      <AiPreviewTab
        v-if="content.activeTab.value === 'ai'"
        v-model:currentPrompt="settings.currentPrompt.value"
        :promptModified="settings.promptModified.value"
        :isProcessing="content.isProcessing.value"
        :processingError="content.processingError.value"
        :aiMarkdown="content.aiMarkdown.value"
        :aiResult="content.aiResult.value"
        @regenerate="handleProcessWithAI"
        @retry="handleProcessWithAI"
      />
    </main>

    <SaveFooter
      v-model:folder="settings.folder.value"
      :recentPaths="settings.recentPaths.value"
      :canSave="content.canSave.value"
      @saveToObsidian="obsidian.saveToObsidian"
      @downloadAsMd="obsidian.downloadAsMd"
      @copyMd="obsidian.copyMd"
      @copyHtml="obsidian.copyHtml"
    />
  </div>
</template>

<style scoped>
.popup {
  width: var(--popup-width);
  height: var(--popup-height);
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
  color: var(--text-normal);
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted, #666);
  transition: all 0.2s;
}

.tab.active {
  color: var(--interactive-accent, #007aff);
  border-bottom: 2px solid var(--interactive-accent, #007aff);
  font-weight: 500;
}

.tab:hover:not(.active) {
  background: var(--background-secondary, #f5f5f5);
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted, #666);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-top-color: var(--interactive-accent, #007aff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
