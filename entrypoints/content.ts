import { extractContent, elementsToMarkdown } from '@/utils/extractor';
import type { ExtractedContent, Message, ContentExtractedMessage, SelectionUpdatedMessage, ProgressStreamMessage, ProgressStatusMessage } from '@/types';

// 进度 UI 相关
let progressHost: HTMLDivElement | null = null;
let streamContent = ''; // 累积的流式内容

// 创建进度浮窗（Shadow DOM 隔离）
function createProgressPanel() {
  if (document.getElementById('obsiclip-progress-root')) return;

  // 创建宿主元素
  const host = document.createElement('div');
  host.id = 'obsiclip-progress-root';
  host.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    bottom: 20px;
    right: 20px;
    width: 0;
    height: 0;
  `;
  document.body.appendChild(host);
  progressHost = host;

  // 创建 Shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  // 注入样式
  const style = document.createElement('style');
  style.textContent = `
    .card {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      display: none;
      border: 1px solid #eee;
    }
    .card.visible {
      display: block;
      animation: slideIn 0.3s ease;
    }
    .title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #e0e0e0;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .title.success .spinner {
      display: none;
    }
    .title.success::after {
      content: '✅';
    }
    .title.error .spinner {
      display: none;
    }
    .title.error::after {
      content: '❌';
    }
    .stream-content {
      font-size: 12px;
      color: #555;
      line-height: 1.5;
      max-height: 54px;
      overflow: hidden;
      position: relative;
      font-family: ui-monospace, SFMono-Regular, monospace;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .stream-text {
      white-space: pre-wrap;
      word-break: break-word;
    }
    .status-text {
      font-size: 13px;
      color: #666;
      text-align: center;
      padding: 8px 0;
    }
    .status-text.success {
      color: #10B981;
    }
    .status-text.error {
      color: #EF4444;
    }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(style);

  // 注入 HTML 结构
  const container = document.createElement('div');
  container.className = 'card';
  container.id = 'progress-card';
  container.innerHTML = `
    <div class="title" id="p-title">
      <span>📎</span>
      <span>ObsiClip</span>
      <div class="spinner"></div>
    </div>
    <div class="stream-content" id="stream-container">
      <div class="stream-text" id="stream-text"></div>
    </div>
    <div class="status-text" id="status-text" style="display: none;"></div>
  `;
  shadow.appendChild(container);
}

// 显示进度 UI
function showProgressUI() {
  if (!progressHost?.shadowRoot) {
    createProgressPanel();
  }
  streamContent = ''; // 重置流式内容
  const card = progressHost?.shadowRoot?.getElementById('progress-card');
  const title = progressHost?.shadowRoot?.getElementById('p-title');
  const streamContainer = progressHost?.shadowRoot?.getElementById('stream-container');
  const streamText = progressHost?.shadowRoot?.getElementById('stream-text');
  const statusText = progressHost?.shadowRoot?.getElementById('status-text');

  if (card) {
    card.classList.add('visible');
  }
  if (title) {
    title.classList.remove('success', 'error');
  }
  if (streamContainer) {
    streamContainer.style.display = 'block';
  }
  if (streamText) {
    streamText.textContent = '';
  }
  if (statusText) {
    statusText.style.display = 'none';
    statusText.classList.remove('success', 'error');
  }
}

// 追加流式内容
function appendStreamContent(chunk: string) {
  if (!progressHost?.shadowRoot) return;

  streamContent += chunk;

  const streamText = progressHost.shadowRoot.getElementById('stream-text');
  const streamContainer = progressHost.shadowRoot.getElementById('stream-container');

  if (streamText && streamContainer) {
    // 只显示最后约 150 个字符，保持 2-3 行
    const displayText = streamContent.length > 150
      ? '...' + streamContent.slice(-147)
      : streamContent;
    streamText.textContent = displayText;

    // 滚动到底部
    streamContainer.scrollTop = streamContainer.scrollHeight;
  }
}

// 设置状态（准备中、完成、错误等）
function setStatus(status: 'preparing' | 'streaming' | 'saving' | 'success' | 'error', text: string) {
  if (!progressHost?.shadowRoot) return;

  const title = progressHost.shadowRoot.getElementById('p-title');
  const streamContainer = progressHost.shadowRoot.getElementById('stream-container');
  const statusTextEl = progressHost.shadowRoot.getElementById('status-text');

  if (!title || !streamContainer || !statusTextEl) return;

  // 非流式状态时，显示状态文本
  if (status === 'preparing' || status === 'saving' || status === 'success' || status === 'error') {
    streamContainer.style.display = 'none';
    statusTextEl.style.display = 'block';
    statusTextEl.textContent = text;
    statusTextEl.classList.remove('success', 'error');

    if (status === 'success') {
      title.classList.add('success');
      statusTextEl.classList.add('success');
    } else if (status === 'error') {
      title.classList.add('error');
      statusTextEl.classList.add('error');
    }
  } else {
    // 流式状态
    streamContainer.style.display = 'block';
    statusTextEl.style.display = 'none';
    title.classList.remove('success', 'error');
  }
}

// 隐藏进度 UI
function hideProgressUI() {
  const card = progressHost?.shadowRoot?.getElementById('progress-card');
  if (card) {
    card.classList.remove('visible');
  }
}

// 高亮样式
const HIGHLIGHT_STYLE = {
  auto: 'rgba(0, 122, 255, 0.1)',
  autoBorder: '2px dashed rgba(0, 122, 255, 0.5)',
  hover: 'rgba(255, 200, 0, 0.3)',
  selected: 'rgba(0, 122, 255, 0.2)',
};

// 状态
let isPickerMode = false;
let selectedElements: Set<Element> = new Set();
let highlightOverlay: HTMLDivElement | null = null;
let hoverOverlay: HTMLDivElement | null = null;
let currentHoverElement: Element | null = null;

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // 监听来自 sidepanel/background 的消息
    browser.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      switch (message.type) {
        case 'EXTRACT_CONTENT':
          handleExtractContent(sendResponse);
          return true; // 异步响应

        case 'TOGGLE_PICKER_MODE':
          togglePickerMode(message.data.enabled);
          break;

        case 'CLEAR_HIGHLIGHT':
          clearAllHighlights();
          break;

        case 'PROGRESS_SHOW':
          showProgressUI();
          break;

        case 'PROGRESS_STREAM':
          appendStreamContent(message.data.chunk);
          break;

        case 'PROGRESS_STATUS':
          setStatus(message.data.status, message.data.text);
          break;

        case 'PROGRESS_HIDE':
          hideProgressUI();
          break;

        case 'PING':
          sendResponse({ type: 'PONG' });
          return true;
      }
    });
  },
});

// 提取内容
function handleExtractContent(sendResponse: (response: ContentExtractedMessage) => void) {
  const content = extractContent(document, window.location.href);

  if (content) {
    // 暂时禁用自动提取的高亮遮罩
    // showAutoExtractHighlight(content);

    sendResponse({
      type: 'CONTENT_EXTRACTED',
      data: content,
    });
  } else {
    sendResponse({
      type: 'CONTENT_EXTRACTED',
      data: {
        title: document.title,
        content: '',
        markdown: '',
        url: window.location.href,
      },
    });
  }
}

// 显示自动提取区域的高亮
function showAutoExtractHighlight(_content: ExtractedContent) {
  clearAllHighlights();

  // 尝试找到主要内容区域
  const article = document.querySelector('article, [role="main"], main, .post-content, .article-content, .entry-content');

  if (article) {
    createHighlightOverlay(article, HIGHLIGHT_STYLE.auto, HIGHLIGHT_STYLE.autoBorder);
  }
}

// 创建高亮遮罩
function createHighlightOverlay(element: Element, bgColor: string, borderStyle: string): HTMLDivElement {
  const rect = element.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.setAttribute('data-obsiclip-overlay', 'auto');

  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: ${bgColor};
    border: ${borderStyle};
    pointer-events: none;
    z-index: 999999;
    transition: all 0.2s ease;
  `;

  document.body.appendChild(overlay);
  highlightOverlay = overlay;
  return overlay;
}

// 切换选取模式
function togglePickerMode(enabled: boolean) {
  isPickerMode = enabled;

  if (enabled) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'crosshair';
  } else {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';
    removeHoverOverlay();
  }
}

// 鼠标移动处理
function handleMouseMove(e: MouseEvent) {
  if (!isPickerMode) return;

  const target = e.target as Element;

  // 忽略我们自己创建的元素
  if (target.closest('[data-obsiclip-overlay]')) return;

  // 忽略太小的元素
  const rect = target.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 20) return;

  if (target !== currentHoverElement) {
    currentHoverElement = target;
    updateHoverOverlay(target);
  }
}

// 更新悬停高亮
function updateHoverOverlay(element: Element) {
  removeHoverOverlay();

  const rect = element.getBoundingClientRect();
  hoverOverlay = document.createElement('div');
  hoverOverlay.setAttribute('data-obsiclip-overlay', 'hover');

  const isSelected = selectedElements.has(element);

  hoverOverlay.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: ${isSelected ? HIGHLIGHT_STYLE.selected : HIGHLIGHT_STYLE.hover};
    border: 2px solid ${isSelected ? '#007aff' : '#ffcc00'};
    pointer-events: none;
    z-index: 999998;
    transition: all 0.15s ease;
  `;

  document.body.appendChild(hoverOverlay);
}

// 移除悬停遮罩
function removeHoverOverlay() {
  if (hoverOverlay) {
    hoverOverlay.remove();
    hoverOverlay = null;
  }
}

// 点击处理
function handleClick(e: MouseEvent) {
  if (!isPickerMode) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target as Element;

  // 忽略我们自己创建的元素
  if (target.closest('[data-obsiclip-overlay]')) return;

  // 切换选中状态
  if (selectedElements.has(target)) {
    selectedElements.delete(target);
  } else {
    selectedElements.add(target);
  }

  // 更新选中元素的高亮
  updateSelectedHighlights();

  // 发送更新后的内容
  sendSelectionUpdate();

  // 更新悬停状态
  updateHoverOverlay(target);
}

// 更新选中元素的高亮
function updateSelectedHighlights() {
  // 移除所有选中高亮
  document.querySelectorAll('[data-obsiclip-overlay="selected"]').forEach(el => el.remove());

  // 为每个选中元素创建高亮
  selectedElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.setAttribute('data-obsiclip-overlay', 'selected');

    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: ${HIGHLIGHT_STYLE.selected};
      border: 2px solid #007aff;
      pointer-events: none;
      z-index: 999997;
    `;

    document.body.appendChild(overlay);
  });
}

// 发送选区更新
function sendSelectionUpdate() {
  const elements = Array.from(selectedElements);
  const { html, markdown } = elementsToMarkdown(elements);

  const message: SelectionUpdatedMessage = {
    type: 'SELECTION_UPDATED',
    data: { html, markdown },
  };

  browser.runtime.sendMessage(message);
}

// 清除所有高亮
function clearAllHighlights() {
  document.querySelectorAll('[data-obsiclip-overlay]').forEach(el => el.remove());
  highlightOverlay = null;
  hoverOverlay = null;
  selectedElements.clear();
  currentHoverElement = null;
}
