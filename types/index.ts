// LLM 服务商类型
export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'deepseek' | 'custom';

// LLM 配置
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 语言类型
export type Locale = 'zh-CN' | 'en';

// 用户设置
export interface UserSettings {
  llm: LLMConfig;
  userPrompt: string;
  customPrompt?: boolean; // 用户是否自定义了 Prompt
  obsidian: ObsidianConfig;
  recentPaths: string[];
  autoSaveAfterAI?: boolean; // AI 整理后自动保存
  locale?: Locale; // 界面语言
}

// Obsidian 配置
export interface ObsidianConfig {
  vault: string;
  folder: string;
  tags: string[];
}

// 提取的内容
export interface ExtractedContent {
  title: string;
  content: string;
  markdown: string;
  url: string;
  author?: string;
  siteName?: string;
}

// 文章分类
export type ArticleCategory = 'model' | 'tool' | 'product' | 'concept' | 'other';

// AI 处理结果（结构化）
export interface AIProcessedContent {
  title: string;           // 重新生成的标题
  category: ArticleCategory;
  summary: string;         // 50-100 字摘要
  content: string;         // 整理后的正文 Markdown
}

// 消息类型
export type MessageType =
  | 'EXTRACT_CONTENT'
  | 'CONTENT_EXTRACTED'
  | 'AI_PROCESS'
  | 'AI_STREAM_CHUNK'
  | 'AI_STREAM_END'
  | 'AI_ERROR'
  | 'HIGHLIGHT_SELECTION'
  | 'CLEAR_HIGHLIGHT'
  | 'TOGGLE_PICKER_MODE'
  | 'SELECTION_UPDATED'
  | 'OPEN_OBSIDIAN_URL';

// 消息基础结构
export interface BaseMessage {
  type: MessageType;
}

// 具体消息类型
export interface ExtractContentMessage extends BaseMessage {
  type: 'EXTRACT_CONTENT';
}

export interface ContentExtractedMessage extends BaseMessage {
  type: 'CONTENT_EXTRACTED';
  data: ExtractedContent;
}

export interface AIProcessMessage extends BaseMessage {
  type: 'AI_PROCESS';
  data: {
    content: string;
    prompt: string;
    config: LLMConfig;
  };
}

export interface AIStreamChunkMessage extends BaseMessage {
  type: 'AI_STREAM_CHUNK';
  data: {
    chunk: string;
  };
}

export interface AIStreamEndMessage extends BaseMessage {
  type: 'AI_STREAM_END';
}

export interface AIErrorMessage extends BaseMessage {
  type: 'AI_ERROR';
  data: {
    error: string;
  };
}

export interface TogglePickerModeMessage extends BaseMessage {
  type: 'TOGGLE_PICKER_MODE';
  data: {
    enabled: boolean;
  };
}

export interface SelectionUpdatedMessage extends BaseMessage {
  type: 'SELECTION_UPDATED';
  data: {
    html: string;
    markdown: string;
  };
}

export interface OpenObsidianUrlMessage extends BaseMessage {
  type: 'OPEN_OBSIDIAN_URL';
  data: {
    url: string;
  };
}

export type Message =
  | ExtractContentMessage
  | ContentExtractedMessage
  | AIProcessMessage
  | AIStreamChunkMessage
  | AIStreamEndMessage
  | AIErrorMessage
  | TogglePickerModeMessage
  | SelectionUpdatedMessage
  | OpenObsidianUrlMessage;
