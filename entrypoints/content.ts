import { extractContent, elementsToMarkdown } from '@/utils/extractor';
import type { ExtractedContent, Message, ContentExtractedMessage, SelectionUpdatedMessage, ProgressUpdateMessage } from '@/types';

// 进度 UI 相关
let progressHost: HTMLDivElement | null = null;

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
      width: 280px;
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
    .progress-bg {
      width: 100%;
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-bar {
      width: 0%;
      height: 100%;
      background: #7c3aed;
      transition: width 0.3s ease;
    }
    .progress-bar.success {
      background: #10B981;
    }
    .progress-bar.error {
      background: #EF4444;
    }
    .status-text {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  shadow.appendChild(style);

  // 注入 HTML 结构
  const container = document.createElement('div');
  container.className = 'card';
  container.id = 'progress-card';
  container.innerHTML = `
    <div class="title">
      <span>📎</span>
      <span>ObsiClip</span>
    </div>
    <div class="progress-bg">
      <div class="progress-bar" id="p-bar"></div>
    </div>
    <div class="status-text">
      <span id="p-text">准备中...</span>
      <span id="p-num">0%</span>
    </div>
  `;
  shadow.appendChild(container);
}

// 显示进度 UI
function showProgressUI() {
  if (!progressHost?.shadowRoot) {
    createProgressPanel();
  }
  const card = progressHost?.shadowRoot?.getElementById('progress-card');
  const pBar = progressHost?.shadowRoot?.getElementById('p-bar');
  if (card) {
    card.classList.add('visible');
    pBar?.classList.remove('success', 'error');
  }
}

// 更新进度
function updateProgress(progress: number, text: string) {
  if (!progressHost?.shadowRoot) return;

  const card = progressHost.shadowRoot.getElementById('progress-card');
  const pBar = progressHost.shadowRoot.getElementById('p-bar');
  const pText = progressHost.shadowRoot.getElementById('p-text');
  const pNum = progressHost.shadowRoot.getElementById('p-num');

  if (!card?.classList.contains('visible')) {
    card?.classList.add('visible');
  }

  if (pBar) {
    pBar.style.width = `${progress}%`;
    if (progress === 100) {
      pBar.classList.add('success');
    } else if (progress < 0) {
      pBar.classList.add('error');
      pBar.style.width = '100%';
    }
  }
  if (pText) pText.textContent = text;
  if (pNum) pNum.textContent = progress < 0 ? '' : `${progress}%`;
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

        case 'PROGRESS_UPDATE':
          updateProgress(message.data.progress, message.data.text);
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
