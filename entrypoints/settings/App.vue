<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import type { LLMProvider, LLMConfig, Locale } from '@/types';
import {
  getSettings,
  saveLLMConfig,
  saveUserPrompt,
  saveAutoSaveAfterAI,
  saveObsidianVault,
  PROVIDER_PRESETS,
  getDefaultUserPrompt,
  resetUserPromptForLocale,
} from '@/utils/storage';
import { testConnection } from '@/utils/llm';
import { useI18n } from '@/utils/i18n';

// i18n
const { t, locale, initLocale, setLocaleAndSave, SUPPORTED_LOCALES } = useI18n();

// 当前 TAB
type TabType = 'ai' | 'prompt' | 'general';
const activeTab = ref<TabType>('ai');

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

// 行为设置
const autoSaveAfterAI = ref(false);
const vault = ref('');

// 计算属性
const suggestedModels = computed(() => {
  return PROVIDER_PRESETS[provider.value]?.models || [];
});

const isCustomProvider = computed(() => provider.value === 'custom');

// 监听 provider 变化，自动填充 baseUrl 和 model
watch(provider, (newProvider) => {
  const preset = PROVIDER_PRESETS[newProvider];
  if (preset) {
    if (preset.baseUrl) {
      baseUrl.value = preset.baseUrl;
    }
    if (preset.models.length > 0) {
      model.value = preset.models[0];
    } else if (newProvider === 'custom') {
      model.value = '';
    }
  }
});

// 加载设置
onMounted(async () => {
  try {
    await initLocale();
    const settings = await getSettings();
    provider.value = settings.llm.provider;
    apiKey.value = settings.llm.apiKey;
    baseUrl.value = settings.llm.baseUrl;
    model.value = settings.llm.model;
    prompt.value = settings.userPrompt;
    autoSaveAfterAI.value = settings.autoSaveAfterAI ?? false;
    vault.value = settings.obsidian.vault || '';
  } catch (error) {
    console.error('Load settings failed:', error);
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
    saveMessage.value = t('settings.ai.saveSuccess');
    setTimeout(() => {
      saveMessage.value = '';
    }, 2000);
  } catch (error) {
    saveMessage.value = t('settings.ai.saveFailed');
    console.error('Save failed:', error);
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
    saveMessage.value = t('settings.prompt.saveSuccess');
    setTimeout(() => {
      saveMessage.value = '';
    }, 2000);
  } catch (error) {
    saveMessage.value = t('settings.ai.saveFailed');
  } finally {
    saving.value = false;
  }
}

// 重置 Prompt
async function handleResetPrompt() {
  await resetUserPromptForLocale(locale.value);
  prompt.value = getDefaultUserPrompt(locale.value);
  saveMessage.value = t('settings.prompt.resetSuccess');
  setTimeout(() => {
    saveMessage.value = '';
  }, 2000);
}

// 切换自动保存
async function handleAutoSaveToggle() {
  await saveAutoSaveAfterAI(autoSaveAfterAI.value);
}

// 保存 Vault
async function handleVaultBlur() {
  await saveObsidianVault(vault.value);
}

// 切换语言
async function handleLocaleChange(newLocale: Locale) {
  await setLocaleAndSave(newLocale);
}

// Provider 显示名称 - 使用 computed 以支持语言切换
const providerNames = computed(() => ({
  openai: t('settings.providers.openai'),
  claude: t('settings.providers.claude'),
  gemini: t('settings.providers.gemini'),
  deepseek: t('settings.providers.deepseek'),
  custom: t('settings.providers.custom'),
}));

// TAB 配置 - 使用 computed 以支持语言切换
const tabs = computed(() => [
  { key: 'ai' as TabType, label: t('settings.tabs.ai'), icon: '🤖' },
  { key: 'prompt' as TabType, label: t('settings.tabs.prompt'), icon: '📝' },
  { key: 'general' as TabType, label: t('settings.tabs.general'), icon: '⚙️' },
]);
</script>

<template>
  <div class="settings-page">
    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <template v-else>
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <h1 class="logo">ObsiClip</h1>
        <nav class="nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['nav-item', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-label">{{ tab.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧内容 -->
      <main class="content">
        <!-- AI 配置 -->
        <div v-if="activeTab === 'ai'" class="panel">
          <h2>{{ t('settings.ai.title') }}</h2>
          <p class="panel-desc">{{ t('settings.ai.desc') }}</p>

          <div class="form-group">
            <label>{{ t('settings.ai.provider') }}</label>
            <select v-model="provider">
              <option v-for="(name, key) in providerNames" :key="key" :value="key">
                {{ name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('settings.ai.apiKey') }}</label>
            <input
              v-model="apiKey"
              type="password"
              :placeholder="t('settings.ai.apiKeyPlaceholder')"
              autocomplete="off"
            />
            <span class="hint">{{ t('settings.ai.apiKeyHint') }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('settings.ai.baseUrl') }}</label>
            <input
              v-model="baseUrl"
              type="text"
              :placeholder="isCustomProvider ? t('settings.ai.baseUrlPlaceholder') : t('settings.ai.baseUrlDefault')"
            />
            <span class="hint">{{ t('settings.ai.baseUrlHint') }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('settings.ai.model') }}</label>
            <input
              v-model="model"
              type="text"
              :list="suggestedModels.length > 0 ? 'model-list' : undefined"
              :placeholder="t('settings.ai.modelPlaceholder')"
            />
            <datalist id="model-list">
              <option v-for="m in suggestedModels" :key="m" :value="m" />
            </datalist>
          </div>

          <div class="button-group">
            <button @click="handleTestConnection" :disabled="testing || !apiKey">
              {{ testing ? t('settings.ai.testing') : t('settings.ai.testConnection') }}
            </button>
            <button @click="saveLLM" :disabled="saving" class="primary">
              {{ saving ? t('settings.ai.saving') : t('settings.ai.saveConfig') }}
            </button>
          </div>

          <div v-if="testResult" :class="['result-msg', testResult.success ? 'success' : 'error']">
            {{ testResult.success ? t('settings.ai.testSuccess') : `${t('settings.ai.testFailed')}: ${testResult.error}` }}
          </div>

          <div v-if="saveMessage" class="result-msg success">{{ saveMessage }}</div>
        </div>

        <!-- Prompt 配置 -->
        <div v-if="activeTab === 'prompt'" class="panel">
          <h2>{{ t('settings.prompt.title') }}</h2>
          <p class="panel-desc">{{ t('settings.prompt.desc') }}</p>

          <div class="form-group">
            <textarea
              v-model="prompt"
              rows="16"
              :placeholder="t('settings.prompt.placeholder')"
              class="prompt-textarea"
            ></textarea>
          </div>

          <div class="button-group">
            <button @click="handleResetPrompt">{{ t('settings.prompt.reset') }}</button>
            <button @click="handleSavePrompt" :disabled="saving" class="primary">
              {{ saving ? t('settings.ai.saving') : t('settings.prompt.save') }}
            </button>
          </div>

          <div v-if="saveMessage" class="result-msg success">{{ saveMessage }}</div>
        </div>

        <!-- 通用设置 -->
        <div v-if="activeTab === 'general'" class="panel">
          <h2>{{ t('settings.general.title') }}</h2>
          <p class="panel-desc">{{ t('settings.general.desc') }}</p>

          <div class="setting-item">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-title">{{ t('settings.general.language') }}</span>
                <span class="setting-desc">{{ t('settings.general.languageDesc') }}</span>
              </div>
              <select
                :value="locale"
                @change="handleLocaleChange(($event.target as HTMLSelectElement).value as Locale)"
                class="language-select"
              >
                <option v-for="loc in SUPPORTED_LOCALES" :key="loc" :value="loc">
                  {{ t(`languages.${loc}`) }}
                </option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="autoSaveAfterAI"
                @change="handleAutoSaveToggle"
              />
              <div class="checkbox-content">
                <span class="checkbox-title">{{ t('settings.general.backgroundAI') }}</span>
                <span class="checkbox-desc">{{ t('settings.general.backgroundAIDesc') }}</span>
              </div>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info" style="margin-bottom: 12px;">
              <span class="setting-title">{{ t('settings.general.vault') }}</span>
              <span class="setting-desc">{{ t('settings.general.vaultDesc') }}</span>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <input
                v-model="vault"
                type="text"
                :placeholder="t('settings.general.vaultPlaceholder')"
                @blur="handleVaultBlur"
              />
              <span class="hint">{{ t('settings.general.vaultHint') }}</span>
            </div>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  min-height: 100vh;
  background: var(--background-secondary, #f5f5f5);
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* 左侧导航 */
.sidebar {
  width: 200px;
  background: var(--background-primary, #fff);
  border-right: 1px solid var(--border-color, #e0e0e0);
  padding: 20px 0;
  flex-shrink: 0;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  padding: 0 20px 20px;
  margin: 0;
  color: var(--text-normal);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.nav {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted, #666);
  text-align: left;
  transition: all 0.15s;
}

.nav-item:hover {
  background: var(--background-secondary, #f5f5f5);
  color: var(--text-normal);
}

.nav-item.active {
  background: var(--interactive-accent, #007aff);
  color: #fff;
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  font-weight: 500;
}

/* 右侧内容 */
.content {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
}

.panel {
  max-width: 600px;
}

.panel h2 {
  font-size: 20px;
  margin: 0 0 8px 0;
  color: var(--text-normal);
}

.panel-desc {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0 0 24px 0;
}

/* 表单 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-normal);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  background: var(--background-primary, #fff);
  color: var(--text-normal);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--interactive-accent, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.hint {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.prompt-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  background: var(--background-primary, #fff);
  color: var(--text-normal);
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--interactive-accent, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 按钮 */
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

button {
  padding: 10px 20px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  background: var(--background-primary, #fff);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-normal);
}

button:hover:not(:disabled) {
  background: var(--background-secondary, #f5f5f5);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background: var(--interactive-accent, #007aff);
  color: #fff;
  border-color: var(--interactive-accent, #007aff);
}

button.primary:hover:not(:disabled) {
  background: #0066dd;
}

/* 结果消息 */
.result-msg {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.result-msg.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-msg.error {
  background: #ffebee;
  color: #c62828;
}

/* 设置项 */
.setting-item {
  padding: 16px;
  background: var(--background-primary, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
}

.setting-item + .setting-item {
  margin-top: 12px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-normal);
}

.checkbox-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 通用设置样式 */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-normal);
}

.setting-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.language-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  background: var(--background-primary, #fff);
  color: var(--text-normal);
  cursor: pointer;
  min-width: 120px;
}

.language-select:focus {
  outline: none;
  border-color: var(--interactive-accent, #007aff);
}
</style>
