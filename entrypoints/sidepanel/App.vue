<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { marked } from 'marked';
import type { ExtractedContent, LLMConfig, LLMProvider, Message } from '@/types';
import {
  getSettings,
  saveSettings,
  addRecentPath,
  PROVIDER_PRESETS,
  DEFAULT_PROMPT,
} from '@/utils/storage';
import { testConnection } from '@/utils/llm';
import { buildObsidianURI, generateFrontmatter, openObsidian, downloadMarkdown, copyToClipboard } from '@/utils/obsidian';

// ==================== 状态 ====================

// 视图状态
const loading = ref(true);
const activeTab = ref<'raw' | 'ai'>('raw');
const showSettings = ref(false);

// 内容状态
const extractedContent = ref<ExtractedContent | null>(null);
const title = ref('');
const rawMarkdown = ref('');
const aiMarkdown = ref('');
const isProcessing = ref(false);
const processingError = ref('');
const isPickerMode = ref(false);

// Prompt 相关
const showPromptEditor = ref(false);
const currentPrompt = ref('');
const promptModified = ref(false);

// Obsidian 配置
const vault = ref('');
const folder = ref('');
const tags = ref('');
const recentPaths = ref<string[]>([]);
const showSaveMenu = ref(false);

// ==================== 设置相关状态 ====================
const settingsProvider = ref<LLMProvider>('openai');
const settingsApiKey = ref('');
const settingsBaseUrl = ref('');
const settingsModel = ref('');
const settingsTesting = ref(false);
const settingsTestResult = ref<{ success: boolean; error?: string } | null>(null);
const settingsSaving = ref(false);
const settingsSaveMessage = ref('');
const settingsSaveSuccess = ref(true);

// 是否已配置 API Key
const hasApiKey = computed(() => settingsApiKey.value.trim().length > 0);

// 推荐的模型列表（根据服务商动态变化）
const suggestedModels = computed(() => {
  return PROVIDER_PRESETS[settingsProvider.value]?.models || [];
});

// Provider 显示名称
const providerOptions: { value: LLMProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: '自定义' },
];

// 监听 provider 变化，自动填充 baseUrl 和默认模型
watch(settingsProvider, (newProvider) => {
  const preset = PROVIDER_PRESETS[newProvider];
  if (preset) {
    if (preset.baseUrl) {
      settingsBaseUrl.value = preset.baseUrl;
    }
    if (preset.models.length > 0) {
      settingsModel.value = preset.models[0];
    }
  }
});

// ==================== 计算属性 ====================

const renderedMarkdown = computed(() => {
  const md = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  try {
    return marked(md);
  } catch {
    return md;
  }
});

const canProcess = computed(() => {
  return rawMarkdown.value.trim().length > 0 && !isProcessing.value;
});

const canSave = computed(() => {
  return (activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value).trim().length > 0;
});

// 监听 prompt 变化
watch(currentPrompt, () => {
  promptModified.value = true;
});

// ==================== 初始化 ====================

onMounted(async () => {
  try {
    const settings = await getSettings();

    // 加载 LLM 设置
    settingsProvider.value = settings.llm.provider;
    settingsApiKey.value = settings.llm.apiKey;
    settingsBaseUrl.value = settings.llm.baseUrl;
    settingsModel.value = settings.llm.model;

    // 加载 Obsidian 设置
    vault.value = settings.obsidian.vault;
    folder.value = settings.obsidian.folder;
    tags.value = settings.obsidian.tags.join(', ');
    recentPaths.value = settings.recentPaths;
    currentPrompt.value = settings.prompt;

    // 如果没有配置 API Key，显示设置面板
    if (!settings.llm.apiKey) {
      showSettings.value = true;
    }

    // 监听来自 content script 和 background 的消息
    browser.runtime.onMessage.addListener(handleMessage);

    // 请求提取内容
    await extractContent();
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    loading.value = false;
  }
});

// ==================== 消息处理 ====================

function handleMessage(message: Message) {
  switch (message.type) {
    case 'CONTENT_EXTRACTED':
      handleContentExtracted(message.data);
      break;

    case 'SELECTION_UPDATED':
      rawMarkdown.value = message.data.markdown;
      break;

    case 'AI_STREAM_CHUNK':
      aiMarkdown.value += message.data.chunk;
      break;

    case 'AI_STREAM_END':
      isProcessing.value = false;
      break;

    case 'AI_ERROR':
      isProcessing.value = false;
      processingError.value = message.data.error;
      break;
  }
}

// ==================== 内容提取 ====================

async function extractContent() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const response = await browser.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
    if (response?.type === 'CONTENT_EXTRACTED') {
      handleContentExtracted(response.data);
    }
  } catch (error) {
    console.error('提取内容失败:', error);
  }
}

function handleContentExtracted(data: ExtractedContent) {
  extractedContent.value = data;
  title.value = data.title;
  rawMarkdown.value = data.markdown;
}

async function togglePickerMode() {
  isPickerMode.value = !isPickerMode.value;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await browser.tabs.sendMessage(tab.id, {
    type: 'TOGGLE_PICKER_MODE',
    data: { enabled: isPickerMode.value },
  });
}

// ==================== AI 处理 ====================

async function processWithAI() {
  if (!canProcess.value) return;

  // 检查是否配置了 API Key
  if (!hasApiKey.value) {
    showSettings.value = true;
    return;
  }

  isProcessing.value = true;
  processingError.value = '';
  aiMarkdown.value = '';
  activeTab.value = 'ai';

  const config: LLMConfig = {
    provider: settingsProvider.value,
    apiKey: settingsApiKey.value,
    baseUrl: settingsBaseUrl.value,
    model: settingsModel.value,
  };

  // 发送 AI 处理请求到 background
  browser.runtime.sendMessage({
    type: 'AI_PROCESS',
    data: {
      content: rawMarkdown.value,
      prompt: promptModified.value ? currentPrompt.value : '',
      config,
    },
  });
}

function regenerate() {
  processWithAI();
}

// ==================== 设置功能 ====================

async function handleTestConnection() {
  settingsTesting.value = true;
  settingsTestResult.value = null;

  const config: LLMConfig = {
    provider: settingsProvider.value,
    apiKey: settingsApiKey.value,
    baseUrl: settingsBaseUrl.value,
    model: settingsModel.value,
  };

  settingsTestResult.value = await testConnection(config);
  settingsTesting.value = false;
}

async function handleSaveSettings() {
  settingsSaving.value = true;
  settingsSaveMessage.value = '';

  try {
    const settings = await getSettings();

    settings.llm = {
      provider: settingsProvider.value,
      apiKey: settingsApiKey.value,
      baseUrl: settingsBaseUrl.value,
      model: settingsModel.value,
    };

    settings.prompt = currentPrompt.value;
    settings.obsidian = {
      vault: vault.value,
      folder: folder.value,
      tags: tags.value.split(',').map(t => t.trim()).filter(Boolean),
    };

    await saveSettings(settings);

    settingsSaveSuccess.value = true;
    settingsSaveMessage.value = '保存成功';
    setTimeout(() => {
      settingsSaveMessage.value = '';
      // 如果是首次配置完成，关闭设置面板
      if (hasApiKey.value) {
        showSettings.value = false;
      }
    }, 1500);
  } catch (error) {
    settingsSaveSuccess.value = false;
    settingsSaveMessage.value = '保存失败';
    console.error('保存设置失败:', error);
  } finally {
    settingsSaving.value = false;
  }
}

function handleResetPrompt() {
  currentPrompt.value = DEFAULT_PROMPT;
  promptModified.value = true;
}

// ==================== 保存功能 ====================

async function saveToObsidian() {
  const content = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  const url = extractedContent.value?.url || '';
  const author = extractedContent.value?.author;
  const tagList = tags.value.split(',').map(t => t.trim()).filter(Boolean);

  const frontmatter = generateFrontmatter(url, author, tagList);
  const fullContent = frontmatter + content;

  const uri = buildObsidianURI(
    { vault: vault.value, folder: folder.value, tags: tagList },
    title.value,
    fullContent
  );

  if (folder.value) {
    await addRecentPath(folder.value);
    recentPaths.value = [folder.value, ...recentPaths.value.filter(p => p !== folder.value)].slice(0, 5);
  }

  openObsidian(uri);
  showSaveMenu.value = false;
}

function downloadAsMd() {
  const content = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  const url = extractedContent.value?.url || '';
  const author = extractedContent.value?.author;
  const tagList = tags.value.split(',').map(t => t.trim()).filter(Boolean);

  const frontmatter = generateFrontmatter(url, author, tagList);
  const fullContent = frontmatter + content;

  downloadMarkdown(title.value, fullContent);
  showSaveMenu.value = false;
}

async function copyMd() {
  const content = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  await copyToClipboard(content);
  showSaveMenu.value = false;
}

async function copyHtml() {
  const content = extractedContent.value?.content || '';
  await copyToClipboard(content);
  showSaveMenu.value = false;
}
</script>

<template>
  <div class="sidepanel">
    <!-- 顶部导航 -->
    <header class="header">
      <input
        v-model="title"
        class="title-input"
        placeholder="笔记标题"
      />
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
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h3>⚙️ 设置</h3>
        <button class="close-btn" @click="showSettings = false">✕</button>
      </div>

      <div class="settings-content">
        <!-- 未配置提示 -->
        <div v-if="!hasApiKey" class="setup-notice">
          <span>👋</span>
          <p>首次使用需要配置 AI 服务</p>
        </div>

        <!-- API 配置区（紧凑布局） -->
        <div class="api-config-section">
          <div class="compact-row">
            <div class="compact-field">
              <label>服务商</label>
              <select v-model="settingsProvider">
                <option v-for="opt in providerOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="compact-field">
              <label>模型</label>
              <select v-if="suggestedModels.length > 0" v-model="settingsModel">
                <option v-for="m in suggestedModels" :key="m" :value="m">{{ m }}</option>
              </select>
              <input v-else v-model="settingsModel" type="text" placeholder="模型名称" />
            </div>
          </div>

          <div class="compact-field">
            <label>API Key <span class="hint-inline">🔒 本地加密</span></label>
            <input
              v-model="settingsApiKey"
              type="password"
              placeholder="输入 API Key"
              autocomplete="off"
            />
          </div>

          <div class="compact-field">
            <label>Base URL</label>
            <input v-model="settingsBaseUrl" type="text" placeholder="API 地址" />
          </div>

          <div class="button-row">
            <button
              @click="handleTestConnection"
              :disabled="settingsTesting || !settingsApiKey"
              class="test-btn"
            >
              {{ settingsTesting ? '测试中...' : '🔗 测试' }}
            </button>
            <button
              @click="handleSaveSettings"
              :disabled="settingsSaving"
              class="save-settings-btn"
            >
              {{ settingsSaving ? '保存中...' : '💾 保存' }}
            </button>
          </div>

          <div v-if="settingsTestResult" :class="['test-result', settingsTestResult.success ? 'is-success' : 'is-error']">
            {{ settingsTestResult.success ? '✓ 连接成功' : `✗ ${settingsTestResult.error}` }}
          </div>

          <div v-if="settingsSaveMessage" :class="['save-message', settingsSaveSuccess ? 'is-success' : 'is-error']">
            {{ settingsSaveMessage }}
          </div>
        </div>

        <!-- Prompt 设置（占据更多空间） -->
        <div class="prompt-config-section">
          <div class="prompt-header">
            <label>系统提示词</label>
            <button class="reset-btn" @click="handleResetPrompt">重置默认</button>
          </div>
          <textarea
            v-model="currentPrompt"
            class="prompt-textarea"
            placeholder="AI 处理内容时使用的提示词..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 主内容区（设置面板关闭时显示） -->
    <template v-if="!showSettings">
      <!-- Tab 切换 -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'raw' }]"
          @click="activeTab = 'raw'"
        >
          原始内容
        </button>
        <button
          :class="['tab', { active: activeTab === 'ai' }]"
          @click="activeTab = 'ai'"
        >
          AI 预览
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>提取内容中...</span>
      </div>

      <!-- 主内容区 -->
      <main v-else class="content">
        <!-- 原始内容 Tab -->
        <div v-if="activeTab === 'raw'" class="tab-content">
          <div class="toolbar">
            <label class="picker-toggle">
              <input type="checkbox" v-model="isPickerMode" @change="togglePickerMode" />
              <span>手动调整选区</span>
            </label>
          </div>

          <textarea
            v-model="rawMarkdown"
            class="markdown-editor"
            placeholder="提取的内容将显示在这里..."
          ></textarea>

          <button
            class="ai-btn"
            @click="processWithAI"
            :disabled="!canProcess"
          >
            <template v-if="!hasApiKey">🔧 配置 AI 服务</template>
            <template v-else>✨ AI 智能整理</template>
          </button>
        </div>

        <!-- AI 预览 Tab -->
        <div v-if="activeTab === 'ai'" class="tab-content">
          <!-- Prompt 设置区 -->
          <div class="prompt-section">
            <button
              class="prompt-toggle"
              @click="showPromptEditor = !showPromptEditor"
            >
              {{ showPromptEditor ? '收起' : '展开' }} Prompt 设置
            </button>

            <div v-if="showPromptEditor" class="prompt-editor">
              <textarea
                v-model="currentPrompt"
                rows="6"
                placeholder="系统提示词..."
              ></textarea>
              <button
                v-if="promptModified"
                class="regenerate-btn"
                @click="regenerate"
                :disabled="isProcessing"
              >
                🔄 重新生成
              </button>
            </div>
          </div>

          <!-- 预览区 -->
          <div class="preview-area">
            <div v-if="isProcessing" class="processing">
              <div class="spinner"></div>
              <span>AI 正在整理...</span>
            </div>

            <div v-else-if="processingError" class="error">
              <span>❌ {{ processingError }}</span>
              <button @click="processWithAI">重试</button>
            </div>

            <div
              v-else-if="aiMarkdown"
              class="markdown-preview"
              v-html="renderedMarkdown"
            ></div>

            <div v-else class="empty">
              <span>点击「AI 智能整理」开始处理</span>
            </div>
          </div>
        </div>
      </main>

      <!-- 底部保存区 -->
      <footer class="footer">
        <div class="save-config">
          <div class="config-row">
            <input
              v-model="vault"
              placeholder="Vault（可选）"
              class="config-input"
            />
            <input
              v-model="folder"
              placeholder="文件夹路径"
              class="config-input"
              list="recent-paths"
            />
            <datalist id="recent-paths">
              <option v-for="path in recentPaths" :key="path" :value="path" />
            </datalist>
          </div>
          <input
            v-model="tags"
            placeholder="标签（逗号分隔）"
            class="config-input tags-input"
          />
        </div>

        <div class="save-actions">
          <div class="save-btn-group">
            <button
              class="save-btn primary"
              @click="saveToObsidian"
              :disabled="!canSave"
            >
              保存到 Obsidian
            </button>
            <button
              class="save-btn dropdown-toggle"
              @click="showSaveMenu = !showSaveMenu"
            >
              ▼
            </button>

            <div v-if="showSaveMenu" class="save-menu">
              <button @click="downloadAsMd">📥 保存为 .md 文件</button>
              <button @click="copyMd">📋 复制 Markdown</button>
              <button @click="copyHtml">📄 复制 HTML</button>
            </div>
          </div>
        </div>
      </footer>
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

/* 顶部 */
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

/* ==================== 设置面板 ==================== */
.settings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.settings-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e0e0e0;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.setup-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 6px;
  margin-bottom: 12px;
}

.setup-notice span {
  font-size: 20px;
}

.setup-notice p {
  margin: 0;
  font-size: 13px;
  color: #333;
}

/* API 配置区（紧凑布局） */
.api-config-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.compact-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.compact-field {
  flex: 1;
  margin-bottom: 8px;
}

.compact-field:last-child {
  margin-bottom: 0;
}

.compact-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #555;
}

.hint-inline {
  font-weight: 400;
  color: #888;
  font-size: 11px;
}

.compact-field input,
.compact-field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 13px;
  box-sizing: border-box;
}

.compact-field input:focus,
.compact-field select:focus {
  outline: none;
  border-color: #007aff;
}

.button-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.test-btn,
.save-settings-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn {
  background: #fff;
}

.test-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.save-settings-btn {
  background: #007aff;
  color: #fff;
  border-color: #007aff;
}

.save-settings-btn:hover:not(:disabled) {
  background: #0066dd;
}

.test-btn:disabled,
.save-settings-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-result,
.save-message {
  padding: 8px;
  border-radius: 5px;
  font-size: 12px;
  margin-top: 4px;
  display: block;
  width: 100%;
  box-sizing: border-box;
  height: auto;
  min-height: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.test-result.is-success,
.save-message.is-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.test-result.is-error,
.save-message.is-error {
  background: #ffebee;
  color: #c62828;
}

/* Prompt 配置区（占据剩余空间） */
.prompt-config-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prompt-header label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.reset-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
}

.reset-btn:hover {
  background: #f5f5f5;
}

.prompt-textarea {
  flex: 1;
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  line-height: 1.5;
  resize: none;
  box-sizing: border-box;
}

.prompt-textarea:focus {
  outline: none;
  border-color: #007aff;
}

/* ==================== Tab 切换 ==================== */
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

/* 加载状态 */
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
  to { transform: rotate(360deg); }
}

/* 主内容区 */
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  margin-bottom: 12px;
}

.picker-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.picker-toggle input {
  cursor: pointer;
}

/* Markdown 编辑器 */
.markdown-editor {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
}

.markdown-editor:focus {
  outline: none;
  border-color: #007aff;
}

/* AI 按钮 */
.ai-btn {
  margin-top: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Prompt 区域 */
.prompt-section {
  margin-bottom: 12px;
}

.prompt-toggle {
  font-size: 13px;
  color: #666;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.prompt-toggle:hover {
  color: #007aff;
}

.prompt-editor {
  margin-top: 8px;
}

.prompt-editor textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
}

.regenerate-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.regenerate-btn:disabled {
  opacity: 0.5;
}

/* 预览区 */
.preview-area {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.processing, .error, .empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
}

.error {
  color: #dc3545;
}

.error button {
  padding: 8px 16px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.markdown-preview {
  font-size: 14px;
  line-height: 1.7;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin: 1em 0 0.5em;
}

.markdown-preview :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-preview :deep(code) {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 13px;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #007aff;
  padding-left: 12px;
  color: #666;
  margin: 1em 0;
}

/* 底部保存区 */
.footer {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.save-config {
  margin-bottom: 12px;
}

.config-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
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

.tags-input {
  width: 100%;
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
  border-left: 1px solid rgba(255,255,255,0.3);
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
