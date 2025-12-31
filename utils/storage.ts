import type { UserSettings, LLMConfig, ObsidianConfig } from '@/types';

// 系统固定提示词（用户不可修改）
export const SYSTEM_PROMPT = `你是一个专业的知识管理助手。请处理以下网页内容，返回 YAML frontmatter + Markdown 格式的结构化数据。

## 输出格式（严格遵循）
---
title: 重新生成的标题
category: 分类
summary: 50-100字摘要
---

（正文内容）

## 重要约束
- 先输出 frontmatter（---包裹的部分），再输出正文
- frontmatter 必须是有效的 YAML 格式
- 不要包含任何解释或对话
- 用中文输出`;

// 用户可自定义提示词（默认值）
export const DEFAULT_USER_PROMPT = `## 标题生成规则
根据内容重新生成一个清晰、准确的标题：
- 避免标题党、震惊体、夸张表述
- 让读者能快速理解文章主题
- 格式规范：
  - tool/product 类：「名称 - 功能描述」如「Cursor - AI 代码编辑器」
  - model 类：保留原名如「GPT-4」「Claude 3.5」
  - concept 类：使用中文概念名如「检索增强生成 (RAG)」

## 分类方式
从以下选项中选择最匹配的一个：
- model：AI 模型相关（GPT、Claude、Llama 等）
- tool：开发工具、框架（LangChain、Cursor 等）
- product：AI 产品、应用（ChatGPT、Midjourney 等）
- concept：AI 概念、方法论（RAG、提示工程等）
- other：无法归类的内容

## 摘要要求
50-100 字的内容摘要，突出核心观点和实用价值。

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
- 场景2

注意：保留必要的代码块和数据，如果某个部分原文没有相关内容可以省略`;

// 组合最终 Prompt
export function buildFinalPrompt(userPrompt: string): string {
  return `${SYSTEM_PROMPT}\n\n${userPrompt}`;
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
