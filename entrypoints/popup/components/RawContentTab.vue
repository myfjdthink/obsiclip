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
    <textarea
      :value="rawMarkdown"
      @input="emit('update:rawMarkdown', ($event.target as HTMLTextAreaElement).value)"
      class="markdown-editor"
      placeholder="提取的内容将显示在这里..."
    ></textarea>

    <button class="ai-btn" @click="emit('processWithAI')" :disabled="!canProcess">
      <svg v-if="!hasApiKey" class="btn-icon" viewBox="0 0 24 24">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg v-else class="btn-icon" viewBox="0 0 24 24">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
      {{ hasApiKey ? 'AI 智能整理' : '配置 AI 服务' }}
    </button>
  </div>
</template>

<style scoped>
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--popup-padding);
  overflow: hidden;
}

.markdown-editor {
  flex: 1;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-m);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: var(--font-ui-smaller);
  line-height: 1.5;
  resize: none;
  background: var(--background-primary);
  color: var(--text-normal);
}

.markdown-editor:focus {
  outline: none;
  border-color: var(--interactive-accent);
}

.ai-btn {
  margin-top: 10px;
  padding: 10px;
  background: var(--interactive-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-s);
  font-size: var(--font-ui-small);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ai-btn:hover:not(:disabled) {
  background: var(--interactive-accent-hover);
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 1.75;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
