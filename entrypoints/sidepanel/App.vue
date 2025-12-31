<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useSettings } from './composables/useSettings';
import { useContent } from './composables/useContent';
import { useObsidian } from './composables/useObsidian';
import SettingsPanel from './components/SettingsPanel.vue';
import RawContentTab from './components/RawContentTab.vue';
import AiPreviewTab from './components/AiPreviewTab.vue';
import SaveFooter from './components/SaveFooter.vue';

// 视图状态
const showSettings = ref(false);

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

// 初始化
onMounted(async () => {
  try {
    const loadedSettings = await settings.loadSettings();
    if (!loadedSettings.llm.apiKey) {
      showSettings.value = true;
    }

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
    showSettings.value = true;
    return;
  }
  content.processWithAI(
    settings.getLLMConfig(),
    settings.getFinalPrompt(),
    settings.promptModified.value
  );
}

// 保存设置成功后关闭面板
function handleSaveSettings() {
  settings.handleSaveSettings(() => {
    showSettings.value = false;
  });
}
</script>

<template>
  <div class="sidepanel">
    <!-- 顶部导航 -->
    <header class="header">
      <input v-model="content.title.value" class="title-input" placeholder="笔记标题" />
      <button
        class="icon-btn"
        :class="{ active: showSettings }"
        @click="showSettings = !showSettings"
        title="设置"
      >
        ⚙️
      </button>
    </header>

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      v-model:provider="settings.provider.value"
      v-model:apiKey="settings.apiKey.value"
      v-model:baseUrl="settings.baseUrl.value"
      v-model:model="settings.model.value"
      v-model:currentPrompt="settings.currentPrompt.value"
      :testing="settings.testing.value"
      :testResult="settings.testResult.value"
      :saving="settings.saving.value"
      :saveMessage="settings.saveMessage.value"
      :saveSuccess="settings.saveSuccess.value"
      :hasApiKey="settings.hasApiKey.value"
      :suggestedModels="settings.suggestedModels.value"
      :providerOptions="settings.providerOptions"
      @close="showSettings = false"
      @testConnection="settings.handleTestConnection"
      @saveSettings="handleSaveSettings"
      @resetPrompt="settings.handleResetPrompt"
    />

    <!-- 主内容区 -->
    <template v-if="!showSettings">
      <!-- Tab 切换 -->
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

      <!-- 加载状态 -->
      <div v-if="content.loading.value" class="loading">
        <div class="spinner"></div>
        <span>提取内容中...</span>
      </div>

      <!-- 主内容区 -->
      <main v-else class="content">
        <RawContentTab
          v-if="content.activeTab.value === 'raw'"
          v-model:rawMarkdown="content.rawMarkdown.value"
          :isPickerMode="content.isPickerMode.value"
          :canProcess="content.canProcess.value"
          :hasApiKey="settings.hasApiKey.value"
          @togglePickerMode="content.togglePickerMode"
          @processWithAI="handleProcessWithAI"
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

      <!-- 底部保存区 -->
      <SaveFooter
        v-model:folder="settings.folder.value"
        v-model:tags="settings.tags.value"
        :recentPaths="settings.recentPaths.value"
        :canSave="content.canSave.value"
        @saveToObsidian="obsidian.saveToObsidian"
        @downloadAsMd="obsidian.downloadAsMd"
        @copyMd="obsidian.copyMd"
        @copyHtml="obsidian.copyHtml"
      />
    </template>
  </div>
</template>

<style scoped>
.sidepanel {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  gap: 8px;
}

.title-input {
  flex: 1;
  border: none;
  font-size: 16px;
  font-weight: 600;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.title-input:focus {
  outline: none;
  background: #e8e8e8;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-size: 18px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

.icon-btn.active {
  background: #007aff;
  border-radius: 6px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.tab.active {
  color: #007aff;
  border-bottom: 2px solid #007aff;
  font-weight: 500;
}

.tab:hover:not(.active) {
  background: #f5f5f5;
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top-color: #007aff;
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
