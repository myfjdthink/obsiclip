import { ref, computed } from 'vue';
import type { ExtractedContent, LLMConfig, Message, AIProcessedContent, ArticleCategory } from '@/types';

// 解析 YAML frontmatter
function parseFrontmatter(text: string): { meta: Partial<AIProcessedContent> | null; content: string; isComplete: boolean } {
  // 检查是否以 --- 开头
  if (!text.startsWith('---')) {
    return { meta: null, content: text, isComplete: false };
  }

  // 查找第二个 ---
  const endIndex = text.indexOf('\n---', 3);
  if (endIndex === -1) {
    // frontmatter 还未完成
    return { meta: null, content: '', isComplete: false };
  }

  // 提取 frontmatter 和正文
  const frontmatterStr = text.slice(4, endIndex).trim();
  const content = text.slice(endIndex + 4).trim();

  // 简单解析 YAML（只支持简单的 key: value 格式）
  const meta: Partial<AIProcessedContent> = {};
  const lines = frontmatterStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'title') meta.title = value;
    else if (key === 'category') meta.category = value as ArticleCategory;
    else if (key === 'summary') meta.summary = value;
  }

  return { meta, content, isComplete: true };
}

export function useContent() {
  // 状态
  const loading = ref(true);
  const extractedContent = ref<ExtractedContent | null>(null);
  const title = ref('');
  const rawMarkdown = ref('');
  const aiMarkdown = ref('');
  const isProcessing = ref(false);
  const processingError = ref('');
  const isPickerMode = ref(false);
  const activeTab = ref<'raw' | 'ai'>('raw');

  // AI 结构化结果
  const aiResult = ref<AIProcessedContent | null>(null);
  // frontmatter 是否已解析
  const frontmatterParsed = ref(false);

  // 计算属性
  const canProcess = computed(() => {
    return rawMarkdown.value.trim().length > 0 && !isProcessing.value;
  });

  const canSave = computed(() => {
    return (activeTab.value === 'raw' ? rawMarkdown.value : (aiResult.value?.content || aiMarkdown.value)).trim().length > 0;
  });

  const currentContent = computed(() => {
    return activeTab.value === 'raw' ? rawMarkdown.value : (aiResult.value?.content || aiMarkdown.value);
  });

  // 消息处理
  function handleMessage(message: Message) {
    switch (message.type) {
      case 'CONTENT_EXTRACTED':
        handleContentExtracted(message.data);
        break;
      case 'SELECTION_UPDATED':
        rawMarkdown.value = message.data.markdown;
        break;
      case 'AI_STREAM_CHUNK':
        aiMarkdown.value += message.data.chunk;
        // 流式解析 frontmatter
        if (!frontmatterParsed.value) {
          const { meta, content, isComplete } = parseFrontmatter(aiMarkdown.value);
          if (isComplete && meta) {
            frontmatterParsed.value = true;
            aiResult.value = {
              title: meta.title || '',
              category: meta.category || 'other',
              summary: meta.summary || '',
              content: content,
            };
            if (meta.title) {
              title.value = meta.title;
            }
          }
        } else if (aiResult.value) {
          // frontmatter 已解析，更新正文内容
          const { content } = parseFrontmatter(aiMarkdown.value);
          aiResult.value.content = content;
        }
        break;
      case 'AI_STREAM_END':
        isProcessing.value = false;
        // 最终解析
        if (!frontmatterParsed.value) {
          const { meta, content } = parseFrontmatter(aiMarkdown.value);
          if (meta) {
            aiResult.value = {
              title: meta.title || '',
              category: meta.category || 'other',
              summary: meta.summary || '',
              content: content,
            };
            if (meta.title) {
              title.value = meta.title;
            }
          }
        }
        break;
      case 'AI_ERROR':
        isProcessing.value = false;
        processingError.value = message.data.error;
        break;
    }
  }

  function handleContentExtracted(data: ExtractedContent) {
    extractedContent.value = data;
    title.value = data.title;
    rawMarkdown.value = data.markdown;
  }

  // 内容提取
  async function extractContent() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const response = await browser.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
      if (response?.type === 'CONTENT_EXTRACTED') {
        handleContentExtracted(response.data);
      }
    } catch (error) {
      console.error('提取内容失败:', error);
    }
  }

  // 切换选择器模式
  async function togglePickerMode() {
    isPickerMode.value = !isPickerMode.value;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    await browser.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_PICKER_MODE',
      data: { enabled: isPickerMode.value },
    });
  }

  // AI 处理
  function processWithAI(config: LLMConfig, prompt: string, promptModified: boolean) {
    isProcessing.value = true;
    processingError.value = '';
    aiMarkdown.value = '';
    aiResult.value = null;
    frontmatterParsed.value = false;
    activeTab.value = 'ai';

    browser.runtime.sendMessage({
      type: 'AI_PROCESS',
      data: {
        content: rawMarkdown.value,
        prompt: promptModified ? prompt : '',
        config,
      },
    });
  }

  return {
    // 状态
    loading,
    extractedContent,
    title,
    rawMarkdown,
    aiMarkdown,
    aiResult,
    isProcessing,
    processingError,
    isPickerMode,
    activeTab,
    // 计算属性
    canProcess,
    canSave,
    currentContent,
    // 方法
    handleMessage,
    extractContent,
    togglePickerMode,
    processWithAI,
  };
}
