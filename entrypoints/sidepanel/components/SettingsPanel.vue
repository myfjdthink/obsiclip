<script lang="ts" setup>
import type { LLMProvider } from '@/types';

const props = defineProps<{
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  currentPrompt: string;
  testing: boolean;
  testResult: { success: boolean; error?: string } | null;
  saving: boolean;
  saveMessage: string;
  saveSuccess: boolean;
  hasApiKey: boolean;
  suggestedModels: string[];
  providerOptions: { value: LLMProvider; label: string }[];
}>();

const emit = defineEmits<{
  'update:provider': [value: LLMProvider];
  'update:apiKey': [value: string];
  'update:baseUrl': [value: string];
  'update:model': [value: string];
  'update:currentPrompt': [value: string];
  close: [];
  testConnection: [];
  saveSettings: [];
  resetPrompt: [];
}>();
</script>

<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h3>⚙️ 设置</h3>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <div class="settings-content">
      <!-- 未配置提示 -->
      <div v-if="!hasApiKey" class="setup-notice">
        <span>👋</span>
        <p>首次使用需要配置 AI 服务</p>
      </div>

      <!-- API 配置区 -->
      <div class="api-config-section">
        <div class="compact-row">
          <div class="compact-field">
            <label>服务商</label>
            <select :value="provider" @change="emit('update:provider', ($event.target as HTMLSelectElement).value as LLMProvider)">
              <option v-for="opt in providerOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="compact-field">
            <label>模型</label>
            <select v-if="suggestedModels.length > 0" :value="model" @change="emit('update:model', ($event.target as HTMLSelectElement).value)">
              <option v-for="m in suggestedModels" :key="m" :value="m">{{ m }}</option>
            </select>
            <input v-else :value="model" @input="emit('update:model', ($event.target as HTMLInputElement).value)" type="text" placeholder="模型名称" />
          </div>
        </div>

        <div class="compact-field">
          <label>API Key <span class="hint-inline">🔒 本地加密</span></label>
          <input
            :value="apiKey"
            @input="emit('update:apiKey', ($event.target as HTMLInputElement).value)"
            type="password"
            placeholder="输入 API Key"
            autocomplete="off"
          />
        </div>

        <div class="compact-field">
          <label>Base URL</label>
          <input :value="baseUrl" @input="emit('update:baseUrl', ($event.target as HTMLInputElement).value)" type="text" placeholder="API 地址" />
        </div>

        <div class="button-row">
          <button @click="emit('testConnection')" :disabled="testing || !apiKey" class="test-btn">
            {{ testing ? '测试中...' : '🔗 测试' }}
          </button>
          <button @click="emit('saveSettings')" :disabled="saving" class="save-settings-btn">
            {{ saving ? '保存中...' : '💾 保存' }}
          </button>
        </div>

        <div v-if="testResult" :class="['test-result', testResult.success ? 'is-success' : 'is-error']">
          {{ testResult.success ? '✓ 连接成功' : `✗ ${testResult.error}` }}
        </div>

        <div v-if="saveMessage" :class="['save-message', saveSuccess ? 'is-success' : 'is-error']">
          {{ saveMessage }}
        </div>
      </div>

      <!-- Prompt 设置 -->
      <div class="prompt-config-section">
        <div class="prompt-header">
          <label>系统提示词</label>
          <button class="reset-btn" @click="emit('resetPrompt')">重置默认</button>
        </div>
        <textarea
          :value="currentPrompt"
          @input="emit('update:currentPrompt', ($event.target as HTMLTextAreaElement).value)"
          class="prompt-textarea"
          placeholder="AI 处理内容时使用的提示词..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
