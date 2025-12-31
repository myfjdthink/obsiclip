import { getLLMConfig, getPrompt } from '@/utils/storage';
import { streamChatCompletion } from '@/utils/llm';
import type { Message, AIProcessMessage } from '@/types';

export default defineBackground(() => {
  // 点击扩展图标时打开侧边栏
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      // 打开侧边栏
      await browser.sidePanel.open({ tabId: tab.id });

      // 注入 content script（如果还没注入）
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-scripts/content.js'],
        });
      } catch {
        // 可能已经注入，忽略错误
      }
    }
  });

  // 监听消息
  browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.type === 'AI_PROCESS') {
      handleAIProcess(message as AIProcessMessage, sender);
      return true;
    }
  });

  // 设置侧边栏行为
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 处理 AI 请求
async function handleAIProcess(message: AIProcessMessage, sender: browser.runtime.MessageSender) {
  const { content, prompt: userPrompt } = message.data;
  let config = message.data.config;

  // 如果没有提供配置，从存储中获取
  if (!config.apiKey) {
    config = await getLLMConfig();
  }

  // 如果没有提供 prompt，从存储中获取
  const systemPrompt = userPrompt || await getPrompt();

  try {
    // 流式处理
    for await (const chunk of streamChatCompletion(config, systemPrompt, content)) {
      // 发送 chunk 到侧边栏
      browser.runtime.sendMessage({
        type: 'AI_STREAM_CHUNK',
        data: { chunk },
      }).catch(() => {
        // 侧边栏可能已关闭，忽略错误
      });
    }

    // 发送完成消息
    browser.runtime.sendMessage({
      type: 'AI_STREAM_END',
    }).catch(() => {});

  } catch (error) {
    // 发送错误消息
    browser.runtime.sendMessage({
      type: 'AI_ERROR',
      data: {
        error: error instanceof Error ? error.message : '未知错误',
      },
    }).catch(() => {});
  }
}
