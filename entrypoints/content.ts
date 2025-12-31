import { extractContent, elementsToMarkdown } from '@/utils/extractor';
import type { ExtractedContent, Message, ContentExtractedMessage, SelectionUpdatedMessage } from '@/types';

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
