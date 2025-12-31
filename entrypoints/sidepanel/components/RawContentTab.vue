<script lang="ts" setup>
defineProps<{
  rawMarkdown: string;
  canProcess: boolean;
  hasApiKey: boolean;
  refreshing?: boolean;
}>();

const emit = defineEmits<{
  'update:rawMarkdown': [value: string];
  processWithAI: [];
  refresh: [];
}>();
</script>

<template>
  <div class="tab-content">
    <div class="editor-header">
      <button
        class="refresh-btn"
        @click="emit('refresh')"
        :disabled="refreshing"
        title="重新检测页面内容"
      >
        <span :class="{ spinning: refreshing }">🔄</span>
        重新检测
      </button>
    </div>

    <textarea
      :value="rawMarkdown"
      @input="emit('update:rawMarkdown', ($event.target as HTMLTextAreaElement).value)"
      class="markdown-editor"
      placeholder="提取的内容将显示在这里..."
    ></textarea>

    <button class="ai-btn" @click="emit('processWithAI')" :disabled="!canProcess">
      <template v-if="!hasApiKey">🔧 配置 AI 服务</template>
      <template v-else>✨ AI 智能整理</template>
    </button>
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

.editor-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e8e8e8;
  color: #333;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn .spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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
</style>
