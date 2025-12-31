import type { UserSettings, LLMConfig, ObsidianConfig } from '@/types';

// 默认系统提示词
export const DEFAULT_PROMPT = `你是一个专业的知识管理助手。请处理以下网页内容，输出为 Obsidian 友好的 Markdown 格式：

1. **Frontmatter**：添加 YAML 头，包含 source(原链接), author, tags(自动生成3-5个)。
2. **摘要**：在开头生成 50-100 字的内容摘要，引用块格式。
3. **正文重组**：
   - 去除广告、推广链接和无关废话。
   - 修正错别字，优化排版。
   - 保留所有代码块、核心数据表格。
   - 将小标题层级标准化（H2, H3）。

请直接输出 Markdown 内容，不要包含"好的，这是整理后的内容"等对话前缀。`;

// 服务商预设配置
export const PROVIDER_PRESETS: Record<string, { baseUrl: string; models: string[] }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  custom: {
    baseUrl: '',
    models: [],
  },
};

// 默认设置
const DEFAULT_SETTINGS: UserSettings = {
  llm: {
    provider: 'openai',
    apiKey: '',
    baseUrl: PROVIDER_PRESETS.openai.baseUrl,
    model: 'gpt-4o-mini',
  },
  prompt: DEFAULT_PROMPT,
  obsidian: {
    vault: '',
    folder: '',
    tags: [],
  },
  recentPaths: [],
};

// 加密密钥（16 字节 = 128 位，用于 AES-128-GCM）
const ENCRYPTION_KEY = 'obsiclip-key1234';

// 简单的加密函数（用于 API Key 本地存储）
async function encrypt(text: string): Promise<string> {
  if (!text) return '';

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const keyData = encoder.encode(ENCRYPTION_KEY);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error('加密失败:', e);
    // 如果加密失败，返回 base64 编码的原文（降级方案）
    return btoa(unescape(encodeURIComponent(text)));
  }
}

// 解密函数
async function decrypt(encryptedText: string): Promise<string> {
  if (!encryptedText) return '';

  try {
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(c => c.charCodeAt(0))
    );

    // 检查是否是加密数据（至少需要 12 字节 IV + 一些数据）
    if (combined.length < 28) {
      // 可能是 base64 降级数据，尝试直接解码
      return decodeURIComponent(escape(atob(encryptedText)));
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // 解密失败，尝试 base64 解码
    try {
      return decodeURIComponent(escape(atob(encryptedText)));
    } catch {
      return '';
    }
  }
}

// 获取设置
export async function getSettings(): Promise<UserSettings> {
  const result = await browser.storage.local.get('settings');
  const settings = result.settings as UserSettings | undefined;

  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  // 解密 API Key
  if (settings.llm.apiKey) {
    settings.llm.apiKey = await decrypt(settings.llm.apiKey);
  }

  return { ...DEFAULT_SETTINGS, ...settings };
}

// 保存设置
export async function saveSettings(settings: UserSettings): Promise<void> {
  const toSave = { ...settings };

  // 加密 API Key
  if (toSave.llm.apiKey) {
    toSave.llm.apiKey = await encrypt(toSave.llm.apiKey);
  }

  await browser.storage.local.set({ settings: toSave });
}

// 获取 LLM 配置
export async function getLLMConfig(): Promise<LLMConfig> {
  const settings = await getSettings();
  return settings.llm;
}

// 保存 LLM 配置
export async function saveLLMConfig(config: LLMConfig): Promise<void> {
  const settings = await getSettings();
  settings.llm = config;
  await saveSettings(settings);
}

// 获取 Prompt
export async function getPrompt(): Promise<string> {
  const settings = await getSettings();
  return settings.prompt;
}

// 保存 Prompt
export async function savePrompt(prompt: string): Promise<void> {
  const settings = await getSettings();
  settings.prompt = prompt;
  await saveSettings(settings);
}

// 重置 Prompt 为默认值
export async function resetPrompt(): Promise<void> {
  await savePrompt(DEFAULT_PROMPT);
}

// 获取 Obsidian 配置
export async function getObsidianConfig(): Promise<ObsidianConfig> {
  const settings = await getSettings();
  return settings.obsidian;
}

// 保存 Obsidian 配置
export async function saveObsidianConfig(config: ObsidianConfig): Promise<void> {
  const settings = await getSettings();
  settings.obsidian = config;
  await saveSettings(settings);
}

// 获取最近路径
export async function getRecentPaths(): Promise<string[]> {
  const settings = await getSettings();
  return settings.recentPaths;
}

// 添加最近路径
export async function addRecentPath(path: string): Promise<void> {
  const settings = await getSettings();
  const paths = settings.recentPaths.filter(p => p !== path);
  paths.unshift(path);
  settings.recentPaths = paths.slice(0, 5); // 最多保留 5 个
  await saveSettings(settings);
}
