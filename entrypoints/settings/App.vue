<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import type { LLMProvider, LLMConfig } from '@/types';
import {
  getSettings,
  saveLLMConfig,
  saveUserPrompt,
  resetUserPrompt,
  PROVIDER_PRESETS,
  DEFAULT_USER_PROMPT,
} from '@/utils/storage';
import { testConnection } from '@/utils/llm';

// 状态
const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ success: boolean; error?: string } | null>(null);
const saveMessage = ref('');

// LLM 配置
const provider = ref<LLMProvider>('openai');
const apiKey = ref('');
const baseUrl = ref('');
const model = ref('');

// Prompt
const prompt = ref('');
const showPromptEditor = ref(false);

// 计算属性
const suggestedModels = computed(() => {
  return PROVIDER_PRESETS[provider.value]?.models || [];
});

const isCustomProvider = computed(() => provider.value === 'custom');

// 监听 provider 变化，自动填充 baseUrl 和 model
watch(provider, (newProvider, oldProvider) => {
  const preset = PROVIDER_PRESETS[newProvider];
  if (preset) {
    // 更新 baseUrl
    if (preset.baseUrl) {
      baseUrl.value = preset.baseUrl;
    }
    // 切换服务商时，自动选择第一个推荐模型
    if (preset.models.length > 0) {
      model.value = preset.models[0];
    } else if (newProvider === 'custom') {
      // 自定义服务商时清空模型，让用户自己输入
      model.value = '';
    }
  }
});

// 加载设置
onMounted(async () => {
  try {
    const settings = await getSettings();
    provider.value = settings.llm.provider;
    apiKey.value = settings.llm.apiKey;
    baseUrl.value = settings.llm.baseUrl;
    model.value = settings.llm.model;
    prompt.value = settings.userPrompt;
  } catch (error) {
    console.error('加载设置失败:', error);
  } finally {
    loading.value = false;
  }
});

// 保存 LLM 配置
async function saveLLM() {
  saving.value = true;
  saveMessage.value = '';

  try {
    const config: LLMConfig = {
      provider: provider.value,
      apiKey: apiKey.value,
      baseUrl: baseUrl.value,
      model: model.value,
    };
    await saveLLMConfig(config);
    saveMessage.value = '✓ 保存成功';
    setTimeout(() => {
      saveMessage.value = '';
    }, 2000);
  } catch (error) {
    saveMessage.value = '✗ 保存失败';
    console.error('保存失败:', error);
  } finally {
    saving.value = false;
  }
}

// 测试连接
async function handleTestConnection() {
  testing.value = true;
  testResult.value = null;

  const config: LLMConfig = {
    provider: provider.value,
    apiKey: apiKey.value,
    baseUrl: baseUrl.value,
    model: model.value,
  };

  testResult.value = await testConnection(config);
  testing.value = false;
}

// 保存 Prompt
async function handleSavePrompt() {
  saving.value = true;
  try {
    await saveUserPrompt(prompt.value);
    saveMessage.value = '✓ Prompt 已保存';
    setTimeout(() => {
      saveMessage.value = '';
    }, 2000);
  } catch (error) {
    saveMessage.value = '✗ 保存失败';
  } finally {
    saving.value = false;
  }
}

// 重置 Prompt
async function handleResetPrompt() {
  await resetUserPrompt();
  prompt.value = DEFAULT_USER_PROMPT;
  saveMessage.value = '✓ 已重置为默认';
  setTimeout(() => {
    saveMessage.value = '';
  }, 2000);
}

// Provider 显示名称
const providerNames: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  deepseek: 'DeepSeek',
  custom: '自定义',
};
</script>

<template>
  <div class="settings-container">
    <header class="header">
      <h1>⚙️ ObsiClip 设置</h1>
    </header>

    <div v-if="loading" class="loading">加载中...</div>

    <main v-else class="main">
      <!-- LLM 配置 -->
      <section class="section">
        <h2>🤖 AI 服务配置</h2>

        <div class="form-group">
          <label>服务商</label>
          <select v-model="provider">
            <option v-for="(name, key) in providerNames" :key="key" :value="key">
              {{ name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>API Key</label>
          <input
            v-model="apiKey"
            type="password"
            placeholder="sk-..."
            autocomplete="off"
          />
          <span class="hint">🔒 本地加密存储，不会上传到任何服务器</span>
        </div>

        <div class="form-group">
          <label>Base URL</label>
          <input
            v-model="baseUrl"
            type="text"
            :placeholder="isCustomProvider ? '输入 API 地址' : '使用默认地址'"
          />
          <span class="hint">支持 OneAPI 等代理服务</span>
        </div>

        <div class="form-group">
          <label>模型</label>
          <div class="model-input">
            <input
              v-model="model"
              type="text"
              :list="suggestedModels.length > 0 ? 'model-list' : undefined"
              placeholder="输入模型名称"
            />
            <datalist id="model-list">
              <option v-for="m in suggestedModels" :key="m" :value="m" />
            </datalist>
          </div>
        </div>

        <div class="button-group">
          <button @click="handleTestConnection" :disabled="testing || !apiKey">
            {{ testing ? '测试中...' : '🔗 测试连接' }}
          </button>
          <button @click="saveLLM" :disabled="saving" class="primary">
            {{ saving ? '保存中...' : '💾 保存配置' }}
          </button>
        </div>

        <div v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
          {{ testResult.success ? '✓ 连接成功' : `✗ 连接失败: ${testResult.error}` }}
        </div>

        <div v-if="saveMessage" class="save-message">{{ saveMessage }}</div>
      </section>

      <!-- Prompt 配置 -->
      <section class="section">
        <h2>📝 Prompt 预设</h2>
        <p class="description">自定义 AI 处理内容时使用的系统提示词</p>

        <button @click="showPromptEditor = !showPromptEditor" class="toggle-btn">
          {{ showPromptEditor ? '收起编辑器' : '展开编辑器' }}
        </button>

        <div v-if="showPromptEditor" class="prompt-editor">
          <textarea v-model="prompt" rows="12" placeholder="输入系统提示词..."></textarea>
          <div class="button-group">
            <button @click="handleResetPrompt">重置为默认</button>
            <button @click="handleSavePrompt" :disabled="saving" class="primary">
              保存 Prompt
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 24px;
  color: var(--text-normal);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.section {
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section h2 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: var(--text-normal);
}

.description {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-normal);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  background: var(--background-primary);
  color: var(--text-normal);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--interactive-accent);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

.hint {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

button {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-normal);
}

button:hover:not(:disabled) {
  background: var(--background-secondary);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background: var(--interactive-accent);
  color: #fff;
  border-color: var(--interactive-accent);
}

button.primary:hover:not(:disabled) {
  background: #0066dd;
}

.toggle-btn {
  font-size: 13px;
  padding: 8px 16px;
}

.test-result {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.test-result.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.test-result.error {
  background: #ffebee;
  color: #c62828;
}

.save-message {
  margin-top: 12px;
  font-size: 14px;
  color: #2e7d32;
}

.prompt-editor {
  margin-top: 12px;
}

.prompt-editor textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  background: var(--background-primary);
  color: var(--text-normal);
}

.prompt-editor textarea:focus {
  outline: none;
  border-color: var(--interactive-accent);
}
</style>
