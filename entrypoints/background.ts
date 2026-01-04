import { getLLMConfig, getUserPrompt, buildFinalPrompt } from '@/utils/storage';
import { streamChatCompletion } from '@/utils/llm';
import type { Message, AIProcessMessage, OpenObsidianUrlMessage } from '@/types';

export default defineBackground(() => {
  // 监听消息
  browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.type === 'AI_PROCESS') {
      handleAIProcess(message as AIProcessMessage, sender);
      return true;
    }

    if (message.type === 'OPEN_OBSIDIAN_URL') {
      const { url } = (message as OpenObsidianUrlMessage).data;
      // 查询当前活动标签页，然后在该标签页打开 Obsidian URL
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const currentTab = tabs[0];
        if (currentTab?.id) {
          browser.tabs.update(currentTab.id, { url }).catch((error) => {
            console.error('Error opening Obsidian URL:', error);
          });
        }
      }).catch(console.error);
      return false;
    }
  });
});

// 处理 AI 请求
async function handleAIProcess(message: AIProcessMessage, sender: browser.runtime.MessageSender) {
  const { content, prompt: userPrompt } = message.data;
  let config = message.data.config;

  // 如果没有提供配置，从存储中获取
  if (!config.apiKey) {
    config = await getLLMConfig();
  }

  // 如果没有提供 prompt，从存储中获取并组合
  const systemPrompt = userPrompt || buildFinalPrompt(await getUserPrompt());

  try {
    // 流式处理
    for await (const chunk of streamChatCompletion(config, systemPrompt, content)) {
      // 发送 chunk 到 popup
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
