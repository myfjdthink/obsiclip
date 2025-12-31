// LLM 服务商类型
export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'deepseek' | 'custom';

// LLM 配置
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 用户设置
export interface UserSettings {
  llm: LLMConfig;
  prompt: string;
  obsidian: ObsidianConfig;
  recentPaths: string[];
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

// AI 处理结果
export interface AIProcessedContent {
  markdown: string;
  frontmatter?: Record<string, unknown>;
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
  | 'SELECTION_UPDATED';

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

export type Message =
  | ExtractContentMessage
  | ContentExtractedMessage
  | AIProcessMessage
  | AIStreamChunkMessage
  | AIStreamEndMessage
  | AIErrorMessage
  | TogglePickerModeMessage
  | SelectionUpdatedMessage;
