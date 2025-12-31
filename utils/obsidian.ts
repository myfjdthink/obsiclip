import type { ObsidianConfig } from '@/types';

// 构建 Obsidian URI
export function buildObsidianURI(
  config: ObsidianConfig,
  title: string,
  content: string
): string {
  // 构建文件路径
  const filePath = config.folder
    ? `${config.folder}/${sanitizeFileName(title)}`
    : sanitizeFileName(title);

  // 手动构建 URL，使用 encodeURIComponent 确保空格编码为 %20 而不是 +
  let url = `obsidian://new?file=${encodeURIComponent(filePath)}`;

  if (config.vault) {
    url += `&vault=${encodeURIComponent(config.vault)}`;
  }

  url += `&content=${encodeURIComponent(content)}`;

  return url;
}

// 清理文件名（移除不合法字符）
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100); // 限制长度
}

// 生成 Frontmatter
export function generateFrontmatter(
  url: string,
  author?: string,
  tags?: string[]
): string {
  const lines = ['---'];

  lines.push(`source: "${url}"`);
  lines.push(`clipped_at: "${new Date().toISOString()}"`);

  if (author) {
    lines.push(`author: "${author}"`);
  }

  if (tags && tags.length > 0) {
    lines.push(`tags: [${tags.map(t => `"${t}"`).join(', ')}]`);
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

// 打开 Obsidian
export function openObsidian(uri: string): void {
  // 通过 background script 打开 Obsidian URL
  browser.runtime.sendMessage({
    type: 'OPEN_OBSIDIAN_URL',
    data: { url: uri },
  }).catch((error) => {
    console.error('Error sending message to open Obsidian:', error);
    // 回退方案：尝试直接打开
    window.open(uri, '_blank');
  });
}

// 下载为 .md 文件
export function downloadMarkdown(title: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(title)}.md`;
  a.click();

  URL.revokeObjectURL(url);
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
