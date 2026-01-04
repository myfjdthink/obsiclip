import { ref, computed, watch } from 'vue';
import type { LLMConfig, LLMProvider } from '@/types';
import { getSettings, saveSettings, PROVIDER_PRESETS, DEFAULT_USER_PROMPT, buildFinalPrompt } from '@/utils/storage';
import { testConnection } from '@/utils/llm';
import { getLocale } from '@/utils/i18n';

export function useSettings() {
  // 状态
  const provider = ref<LLMProvider>('openai');
  const apiKey = ref('');
  const baseUrl = ref('');
  const model = ref('');
  const testing = ref(false);
  const testResult = ref<{ success: boolean; error?: string } | null>(null);
  const saving = ref(false);
  const saveMessage = ref('');
  const saveSuccess = ref(true);
  const currentPrompt = ref('');
  const promptModified = ref(false);

  // Obsidian 配置
  const vault = ref('');
  const folder = ref('');
  const tags = ref('');
  const recentPaths = ref<string[]>([]);

  // 行为设置
  const autoSaveAfterAI = ref(false);

  // 计算属性
  const hasApiKey = computed(() => apiKey.value.trim().length > 0);

  const suggestedModels = computed(() => {
    return PROVIDER_PRESETS[provider.value]?.models || [];
  });

  const providerOptions: { value: LLMProvider; label: string }[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'gemini', label: 'Gemini (Google)' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'custom', label: '自定义' },
  ];

  // 监听 provider 变化
  watch(provider, (newProvider) => {
    const preset = PROVIDER_PRESETS[newProvider];
    if (preset) {
      if (preset.baseUrl) baseUrl.value = preset.baseUrl;
      if (preset.models.length > 0) model.value = preset.models[0];
    }
  });

  // 监听 prompt 变化
  watch(currentPrompt, () => {
    promptModified.value = true;
  });

  // 加载设置
  async function loadSettings() {
    const settings = await getSettings();
    provider.value = settings.llm.provider;
    apiKey.value = settings.llm.apiKey;
    baseUrl.value = settings.llm.baseUrl;
    model.value = settings.llm.model;
    vault.value = settings.obsidian.vault;
    folder.value = settings.obsidian.folder;
    tags.value = settings.obsidian.tags.join(', ');
    recentPaths.value = settings.recentPaths;
    currentPrompt.value = settings.userPrompt;
    autoSaveAfterAI.value = settings.autoSaveAfterAI ?? false;
    return settings;
  }

  // 获取 LLM 配置
  function getLLMConfig(): LLMConfig {
    return {
      provider: provider.value,
      apiKey: apiKey.value,
      baseUrl: baseUrl.value,
      model: model.value,
    };
  }

  // 测试连接
  async function handleTestConnection() {
    testing.value = true;
    testResult.value = null;
    testResult.value = await testConnection(getLLMConfig());
    testing.value = false;
  }

  // 保存设置
  async function handleSaveSettings(onSuccess?: () => void) {
    saving.value = true;
    saveMessage.value = '';

    try {
      const settings = await getSettings();
      settings.llm = getLLMConfig();
      settings.userPrompt = currentPrompt.value;
      settings.obsidian = {
        vault: vault.value,
        folder: folder.value,
        tags: tags.value.split(',').map(t => t.trim()).filter(Boolean),
      };
      await saveSettings(settings);

      saveSuccess.value = true;
      saveMessage.value = '保存成功';
      setTimeout(() => {
        saveMessage.value = '';
        if (hasApiKey.value) onSuccess?.();
      }, 1500);
    } catch (error) {
      saveSuccess.value = false;
      saveMessage.value = '保存失败';
      console.error('保存设置失败:', error);
    } finally {
      saving.value = false;
    }
  }

  // 重置 Prompt
  function handleResetPrompt() {
    currentPrompt.value = DEFAULT_USER_PROMPT;
    promptModified.value = true;
  }

  // 获取最终组合的 Prompt（根据当前语言选择系统提示词）
  function getFinalPrompt(): string {
    return buildFinalPrompt(currentPrompt.value, getLocale());
  }

  return {
    // 状态
    provider,
    apiKey,
    baseUrl,
    model,
    testing,
    testResult,
    saving,
    saveMessage,
    saveSuccess,
    currentPrompt,
    promptModified,
    vault,
    folder,
    tags,
    recentPaths,
    autoSaveAfterAI,
    // 计算属性
    hasApiKey,
    suggestedModels,
    providerOptions,
    // 方法
    loadSettings,
    getLLMConfig,
    handleTestConnection,
    handleSaveSettings,
    handleResetPrompt,
    getFinalPrompt,
  };
}
