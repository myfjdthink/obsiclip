import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { ExtractedContent } from '@/types';

// 创建 Turndown 实例
function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  // 保留代码块的语言标识
  turndown.addRule('fencedCodeBlock', {
    filter: (node) => {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild?.nodeName === 'CODE'
      );
    },
    replacement: (_content, node) => {
      const codeNode = node.firstChild as HTMLElement;
      const className = codeNode.className || '';
      const language = className.match(/language-(\w+)/)?.[1] || '';
      const code = codeNode.textContent || '';
      return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    },
  });

  return turndown;
}

// 提取网页内容
export function extractContent(doc: Document, url: string): ExtractedContent | null {
  // 克隆文档以避免修改原始 DOM
  const clonedDoc = doc.cloneNode(true) as Document;

  // 使用 Readability 提取内容
  const reader = new Readability(clonedDoc);
  const article = reader.parse();

  if (!article) {
    return null;
  }

  // 转换为 Markdown
  const turndown = createTurndownService();
  const markdown = turndown.turndown(article.content);

  return {
    title: article.title || doc.title || '未命名',
    content: article.content,
    markdown,
    url,
    author: article.byline || undefined,
    siteName: article.siteName || undefined,
  };
}

// 从 HTML 字符串提取内容
export function extractFromHTML(html: string, url: string, title: string): ExtractedContent {
  const turndown = createTurndownService();
  const markdown = turndown.turndown(html);

  return {
    title,
    content: html,
    markdown,
    url,
  };
}

// 将选中的 DOM 元素转换为 Markdown
export function elementsToMarkdown(elements: Element[]): { html: string; markdown: string } {
  const turndown = createTurndownService();

  const htmlParts: string[] = [];
  const markdownParts: string[] = [];

  for (const element of elements) {
    const html = element.outerHTML;
    htmlParts.push(html);
    markdownParts.push(turndown.turndown(html));
  }

  return {
    html: htmlParts.join('\n'),
    markdown: markdownParts.join('\n\n'),
  };
}
