<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import type { ExtractedContent, LLMConfig, Message } from '@/types';
import { getSettings, getPrompt, addRecentPath } from '@/utils/storage';
import { buildObsidianURI, generateFrontmatter, openObsidian, downloadMarkdown, copyToClipboard } from '@/utils/obsidian';

// 配置 marked
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

// 状态
const loading = ref(true);
const activeTab = ref<'raw' | 'ai'>('raw');
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

// 计算属性
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
watch(currentPrompt, (newVal) => {
  promptModified.value = true;
});

// 初始化
onMounted(async () => {
  try {
    // 加载设置
    const settings = await getSettings();
    vault.value = settings.obsidian.vault;
    folder.value = settings.obsidian.folder;
    tags.value = settings.obsidian.tags.join(', ');
    recentPaths.value = settings.recentPaths;
    currentPrompt.value = settings.prompt;

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

// 处理消息
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

// 提取内容
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

// 处理提取的内容
function handleContentExtracted(data: ExtractedContent) {
  extractedContent.value = data;
  title.value = data.title;
  rawMarkdown.value = data.markdown;
}

// 切换选取模式
async function togglePickerMode() {
  isPickerMode.value = !isPickerMode.value;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await browser.tabs.sendMessage(tab.id, {
    type: 'TOGGLE_PICKER_MODE',
    data: { enabled: isPickerMode.value },
  });
}

// AI 智能整理
async function processWithAI() {
  if (!canProcess.value) return;

  isProcessing.value = true;
  processingError.value = '';
  aiMarkdown.value = '';
  activeTab.value = 'ai';

  const settings = await getSettings();

  // 发送 AI 处理请求到 background
  browser.runtime.sendMessage({
    type: 'AI_PROCESS',
    data: {
      content: rawMarkdown.value,
      prompt: promptModified.value ? currentPrompt.value : '',
      config: settings.llm,
    },
  });
}

// 重新生成
function regenerate() {
  processWithAI();
}

// 保存到 Obsidian
async function saveToObsidian() {
  const content = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  const url = extractedContent.value?.url || '';
  const author = extractedContent.value?.author;
  const tagList = tags.value.split(',').map(t => t.trim()).filter(Boolean);

  // 生成 frontmatter
  const frontmatter = generateFrontmatter(url, author, tagList);
  const fullContent = frontmatter + content;

  // 构建 URI
  const uri = buildObsidianURI(
    { vault: vault.value, folder: folder.value, tags: tagList },
    title.value,
    fullContent
  );

  // 记录最近路径
  if (folder.value) {
    await addRecentPath(folder.value);
    recentPaths.value = [folder.value, ...recentPaths.value.filter(p => p !== folder.value)].slice(0, 5);
  }

  // 打开 Obsidian
  openObsidian(uri);
  showSaveMenu.value = false;
}

// 下载为 .md 文件
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

// 复制 Markdown
async function copyMd() {
  const content = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
  await copyToClipboard(content);
  showSaveMenu.value = false;
}

// 复制 HTML
async function copyHtml() {
  const content = extractedContent.value?.content || '';
  await copyToClipboard(content);
  showSaveMenu.value = false;
}

// 打开设置
function openSettings() {
  browser.runtime.openOptionsPage();
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
      <button class="icon-btn" @click="openSettings" title="设置">
        ⚙️
      </button>
    </header>

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
          ✨ AI 智能整理
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
          <!-- 处理中 -->
          <div v-if="isProcessing" class="processing">
            <div class="spinner"></div>
            <span>AI 正在整理...</span>
          </div>

          <!-- 错误 -->
          <div v-else-if="processingError" class="error">
            <span>❌ {{ processingError }}</span>
            <button @click="processWithAI">重试</button>
          </div>

          <!-- 渲染结果 -->
          <div
            v-else-if="aiMarkdown"
            class="markdown-preview"
            v-html="renderedMarkdown"
          ></div>

          <!-- 空状态 -->
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
            placeholder="Vault 名称（可选）"
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

          <!-- 下拉菜单 -->
          <div v-if="showSaveMenu" class="save-menu">
            <button @click="downloadAsMd">📥 保存为 .md 文件</button>
            <button @click="copyMd">📋 复制 Markdown</button>
            <button @click="copyHtml">📄 复制 HTML</button>
          </div>
        </div>
      </div>
    </footer>
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
}

.icon-btn:hover {
  background: #f0f0f0;
}

/* Tab 切换 */
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
