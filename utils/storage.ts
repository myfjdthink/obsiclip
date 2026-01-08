import type { UserSettings, LLMConfig, ObsidianConfig, Locale } from '@/types';

// 系统固定提示词 - 中文
export const SYSTEM_PROMPT_ZH = `你是一个专业的知识管理助手。请处理以下网页内容，返回 YAML frontmatter + Markdown 格式的结构化数据。

## 输出格式（严格遵循）
---
title: 重新生成的标题
category: 分类
author: 作者名称
---

（正文内容）

## 重要约束
- 先输出 frontmatter（---包裹的部分），再输出正文
- frontmatter 必须是有效的 YAML 格式
- author 字段从原文中提取，找不到则留空
- 不要包含任何解释或对话
- 用中文输出`;

// 系统固定提示词 - 英文
export const SYSTEM_PROMPT_EN = `You are a professional knowledge management assistant. Process the following web content and return structured data in YAML frontmatter + Markdown format.

## Output Format (strictly follow)
---
title: Regenerated title
category: Category
author: Author name
---

(Body content)

## Important Constraints
- Output frontmatter (wrapped in ---) first, then body
- Frontmatter must be valid YAML format
- Extract author from original text, leave empty if not found
- Do not include any explanations or dialogue
- Output in English`;

// 兼容旧代码
export const SYSTEM_PROMPT = SYSTEM_PROMPT_ZH;

// 用户可自定义提示词（默认值）
export const DEFAULT_USER_PROMPT = `## 标题生成规则
根据内容重新生成一个清晰、准确的标题：
- 避免标题党、震惊体、夸张表述
- 让读者能快速理解文章主题

## 分类方式
从以下选项中选择最匹配的一个：
- model：AI 模型相关（GPT、Claude、Llama 等）
- tool：开发工具、框架（LangChain、Cursor 等）
- product：AI 产品、应用（ChatGPT、Midjourney 等）
- concept：AI 概念、方法论（RAG、提示工程等）
- other：无法归类的内容

## 作者提取
从原文中提取作者名称，常见位置：文章开头、结尾、作者介绍区、个人主页等。

## 正文整理方式
**不要保留原文**，用以下结构重写，只保留关键信息：

### 要点速览
- 要点1：核心结论或发现
- 要点2：...
- 要点3：...
（3-5 条，突出实际落地价值）

### 背景
文章要解决的问题/动机（2-3 句话）

### 核心内容
核心方案/模型/系统设计的简述（可分小节）

### 优势与局限
**优势**：
- ...

**局限**：
- ...

### 适用场景
- 场景1
- 场景2`;

// 用户可自定义提示词 - 英文
export const DEFAULT_USER_PROMPT_EN = `## Title Generation Rules
Generate a clear, accurate title based on the content:
- Avoid clickbait, sensationalism, or exaggeration
- Help readers quickly understand the article topic

## Classification
Choose the most matching category:
- model: AI models (GPT, Claude, Llama, etc.)
- tool: Development tools, frameworks (LangChain, Cursor, etc.)
- product: AI products, applications (ChatGPT, Midjourney, etc.)
- concept: AI concepts, methodologies (RAG, prompt engineering, etc.)
- other: Content that cannot be categorized

## Author Extraction
Extract author name from the original text. Common locations: article header, footer, author bio section, personal homepage, etc.

## Content Organization
**Do not keep the original text**, rewrite using this structure, keeping only key information:

### Key Takeaways
- Point 1: Core conclusion or finding
- Point 2: ...
- Point 3: ...
(3-5 points, emphasizing practical value)

### Background
The problem/motivation the article addresses (2-3 sentences)

### Core Content
Brief description of the core solution/model/system design (can have subsections)

### Strengths & Limitations
**Strengths**:
- ...

**Limitations**:
- ...

### Use Cases
- Scenario 1
- Scenario 2`;

// 兼容旧代码
export { DEFAULT_USER_PROMPT as DEFAULT_USER_PROMPT_ZH };

// 根据语言获取系统提示词
export function getSystemPrompt(locale: Locale): string {
  return locale === 'zh-CN' ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;
}

// 根据语言获取默认用户提示词
export function getDefaultUserPrompt(locale: Locale): string {
  return locale === 'zh-CN' ? DEFAULT_USER_PROMPT : DEFAULT_USER_PROMPT_EN;
}

// 组合最终 Prompt（根据语言选择系统提示词）
export function buildFinalPrompt(userPrompt: string, locale: Locale = 'zh-CN'): string {
  const systemPrompt = getSystemPrompt(locale);
  return `${systemPrompt}\n\n${userPrompt}`;
}

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
  userPrompt: DEFAULT_USER_PROMPT,
  obsidian: {
    vault: '',
    folder: '',
    tags: [],
  },
  recentPaths: [],
  autoSaveAfterAI: false,
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

// 获取用户 Prompt
export async function getUserPrompt(): Promise<string> {
  const settings = await getSettings();
  return settings.userPrompt;
}

// 保存用户 Prompt
export async function saveUserPrompt(userPrompt: string): Promise<void> {
  const settings = await getSettings();
  settings.userPrompt = userPrompt;
  await saveSettings(settings);
}

// 重置用户 Prompt 为默认值
export async function resetUserPrompt(): Promise<void> {
  await saveUserPrompt(DEFAULT_USER_PROMPT);
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

// 获取自动保存设置
export async function getAutoSaveAfterAI(): Promise<boolean> {
  const settings = await getSettings();
  return settings.autoSaveAfterAI ?? false;
}

// 保存自动保存设置
export async function saveAutoSaveAfterAI(enabled: boolean): Promise<void> {
  const settings = await getSettings();
  settings.autoSaveAfterAI = enabled;
  await saveSettings(settings);
}

// 获取语言设置
export async function getLocale(): Promise<Locale | undefined> {
  const settings = await getSettings();
  return settings.locale;
}

// 保存语言设置
export async function saveLocale(locale: Locale): Promise<void> {
  const settings = await getSettings();
  settings.locale = locale;
  await saveSettings(settings);
}

// 检查用户是否自定义了 Prompt
export async function hasCustomPrompt(): Promise<boolean> {
  const settings = await getSettings();
  return settings.customPrompt ?? false;
}

// 保存用户 Prompt（标记为自定义）
export async function saveUserPromptWithFlag(userPrompt: string): Promise<void> {
  const settings = await getSettings();
  settings.userPrompt = userPrompt;
  settings.customPrompt = true;
  await saveSettings(settings);
}

// 重置用户 Prompt 为默认值（根据语言）
export async function resetUserPromptForLocale(locale: Locale): Promise<void> {
  const settings = await getSettings();
  settings.userPrompt = getDefaultUserPrompt(locale);
  settings.customPrompt = false;
  await saveSettings(settings);
}
