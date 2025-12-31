<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import MarkdownRender from 'markstream-vue';
import 'markstream-vue/index.css';
import type { AIProcessedContent } from '@/types';

const props = defineProps<{
  currentPrompt: string;
  promptModified: boolean;
  isProcessing: boolean;
  processingError: string;
  aiMarkdown: string;
  aiResult: AIProcessedContent | null;
}>();

const emit = defineEmits<{
  'update:currentPrompt': [value: string];
  regenerate: [];
  retry: [];
}>();

const showPromptEditor = ref(false);
const previewAreaRef = ref<HTMLElement | null>(null);

// 流式渲染时自动滚动到底部
watch(
  () => props.aiResult?.content,
  () => {
    if (props.isProcessing && previewAreaRef.value) {
      nextTick(() => {
        previewAreaRef.value!.scrollTop = previewAreaRef.value!.scrollHeight;
      });
    }
  }
);
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
    <div ref="previewAreaRef" class="preview-area">
      <div v-if="isProcessing && !aiResult" class="processing">
        <div class="spinner"></div>
        <span>AI 正在整理...</span>
      </div>

      <div v-else-if="processingError" class="error">
        <span>❌ {{ processingError }}</span>
        <button @click="emit('retry')">重试</button>
      </div>

      <template v-else-if="aiResult">
        <!-- 结构化结果展示 -->
        <div class="ai-result">
          <!-- 元信息 -->
          <div class="meta-info">
            <span class="category-tag">{{ aiResult.category }}</span>
          </div>

          <!-- 摘要 -->
          <blockquote v-if="aiResult.summary" class="summary">
            {{ aiResult.summary }}
          </blockquote>

          <!-- 正文 - 使用 markstream-vue 流式渲染 -->
          <div class="markdown-preview">
            <MarkdownRender
              :content="aiResult.content"
              :final="!isProcessing"
            />
          </div>
        </div>
      </template>

      <!-- 降级：显示原始 AI 输出 -->
      <div v-else-if="aiMarkdown" class="markdown-preview">
        <MarkdownRender
          :content="aiMarkdown"
          :final="!isProcessing"
        />
      </div>

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

/* 结构化结果样式 */
.ai-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.category-tag {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.summary {
  margin: 0;
  padding: 12px 16px;
  background: #f8f9fa;
  border-left: 3px solid #007aff;
  border-radius: 0 6px 6px 0;
  font-size: 14px;
  color: #444;
  line-height: 1.6;
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
