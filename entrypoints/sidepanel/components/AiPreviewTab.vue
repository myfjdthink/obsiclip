<script lang="ts" setup>
import { ref } from 'vue';

defineProps<{
  currentPrompt: string;
  promptModified: boolean;
  isProcessing: boolean;
  processingError: string;
  aiMarkdown: string;
  renderedMarkdown: string;
}>();

const emit = defineEmits<{
  'update:currentPrompt': [value: string];
  regenerate: [];
  retry: [];
}>();

const showPromptEditor = ref(false);
</script>

<template>
  <div class="tab-content">
    <!-- Prompt 设置区 -->
    <div class="prompt-section">
      <button class="prompt-toggle" @click="showPromptEditor = !showPromptEditor">
        {{ showPromptEditor ? '收起' : '展开' }} Prompt 设置
      </button>

      <div v-if="showPromptEditor" class="prompt-editor">
        <textarea
          :value="currentPrompt"
          @input="emit('update:currentPrompt', ($event.target as HTMLTextAreaElement).value)"
          rows="6"
          placeholder="系统提示词..."
        ></textarea>
        <button
          v-if="promptModified"
          class="regenerate-btn"
          @click="emit('regenerate')"
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
        <button @click="emit('retry')">重试</button>
      </div>

      <div v-else-if="aiMarkdown" class="markdown-preview" v-html="renderedMarkdown"></div>

      <div v-else class="empty">
        <span>点击「AI 智能整理」开始处理</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

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
  box-sizing: border-box;
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

.preview-area {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.processing,
.error,
.empty {
  height: 100%;
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
</style>
