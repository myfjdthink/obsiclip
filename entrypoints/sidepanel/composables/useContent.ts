import { ref, computed } from 'vue';
import { marked } from 'marked';
import type { ExtractedContent, LLMConfig, Message } from '@/types';

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

  // 计算属性
  const renderedMarkdown = computed(() => {
    const md = activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
    try {
      return marked.parse(md) as string;
    } catch {
      return md;
    }
  });

  const canProcess = computed(() => {
    return rawMarkdown.value.trim().length > 0 && !isProcessing.value;
  });

  const canSave = computed(() => {
    return (activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value).trim().length > 0;
  });

  const currentContent = computed(() => {
    return activeTab.value === 'raw' ? rawMarkdown.value : aiMarkdown.value;
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
        break;
      case 'AI_STREAM_END':
        isProcessing.value = false;
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
    isProcessing,
    processingError,
    isPickerMode,
    activeTab,
    // 计算属性
    renderedMarkdown,
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
