import { getLLMConfig, getUserPrompt, buildFinalPrompt, addRecentPath } from '@/utils/storage';
import { streamChatCompletion } from '@/utils/llm';
import type { Message, AIProcessMessage, OpenObsidianUrlMessage, AIProcessBackgroundMessage } from '@/types';

export default defineBackground(() => {
  // 监听消息
  browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.type === 'AI_PROCESS') {
      handleAIProcess(message as AIProcessMessage, sender);
      return true;
    }

    if (message.type === 'AI_PROCESS_BACKGROUND') {
      // 使用 Promise 包装，确保 Service Worker 保持活跃
      handleAIProcessBackground(message as AIProcessBackgroundMessage)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // 保持消息通道打开
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

// 解析 YAML frontmatter
function parseFrontmatter(text: string): { title?: string; category?: string; content: string } {
  if (!text.startsWith('---')) {
    return { content: text };
  }

  const endIndex = text.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { content: text };
  }

  const frontmatterStr = text.slice(4, endIndex).trim();
  const content = text.slice(endIndex + 4).trim();

  let title: string | undefined;
  let category: string | undefined;

  for (const line of frontmatterStr.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'title') title = value;
    else if (key === 'category') category = value;
  }

  return { title, category, content };
}

// 生成 Frontmatter
function generateFrontmatter(url: string, author?: string): string {
  const lines = ['---'];
  lines.push(`source: "${url}"`);
  lines.push(`clipped_at: "${new Date().toISOString()}"`);
  if (author) {
    lines.push(`author: "${author}"`);
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

// 清理文件名
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

// 构建 Obsidian URI
function buildObsidianURI(folder: string, title: string, content: string): string {
  const filePath = folder ? `${folder}/${sanitizeFileName(title)}` : sanitizeFileName(title);
  let url = `obsidian://new?file=${encodeURIComponent(filePath)}`;
  url += `&content=${encodeURIComponent(content)}`;
  return url;
}

// 向当前标签页发送消息
async function sendMessageToTab(tabId: number, message: Message) {
  try {
    await browser.tabs.sendMessage(tabId, message);
  } catch {
    // 忽略错误：标签页可能已关闭或 content script 未加载
  }
}

// 处理后台 AI 请求
async function handleAIProcessBackground(message: AIProcessBackgroundMessage) {
  const { content, prompt: userPrompt, title, url, author, folder } = message.data;
  let config = message.data.config;

  // 获取当前标签页
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const tabId = currentTab?.id;

  if (!tabId) return;

  // 显示进度 UI
  await sendMessageToTab(tabId, { type: 'PROGRESS_SHOW' });
  await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: 10, text: '正在准备...' } });

  if (!config.apiKey) {
    config = await getLLMConfig();
  }

  const systemPrompt = userPrompt || buildFinalPrompt(await getUserPrompt());

  try {
    let aiResult = '';

    // 更新进度：开始 AI 处理
    await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: 20, text: '正在提取页面内容...' } });

    await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: 40, text: 'AI 正在整理内容...' } });

    for await (const chunk of streamChatCompletion(config, systemPrompt, content)) {
      aiResult += chunk;
    }

    // 更新进度：解析结果
    await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: 80, text: '正在解析结果...' } });

    // 解析 AI 结果
    const parsed = parseFrontmatter(aiResult);
    const finalTitle = parsed.title || title;
    const finalFolder = parsed.category || folder;

    // 生成完整内容
    const frontmatter = generateFrontmatter(url, author);
    const fullContent = frontmatter + parsed.content;

    // 保存最近路径
    if (finalFolder) {
      await addRecentPath(finalFolder);
    }

    // 构建并打开 Obsidian URI
    const obsidianUri = buildObsidianURI(finalFolder, finalTitle, fullContent);

    // 更新进度：完成
    await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: 100, text: '剪藏成功！正在打开 Obsidian...' } });

    // 延迟一下让用户看到成功状态
    await new Promise(r => setTimeout(r, 800));

    // 在当前标签页打开 Obsidian
    await browser.tabs.update(tabId, { url: obsidianUri });

  } catch (error) {
    console.error('Background AI process failed:', error);
    // 显示错误状态
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    await sendMessageToTab(tabId, { type: 'PROGRESS_UPDATE', data: { progress: -1, text: `失败: ${errorMsg}` } });
    // 3秒后隐藏
    setTimeout(() => {
      sendMessageToTab(tabId, { type: 'PROGRESS_HIDE' });
    }, 3000);
  }
}
