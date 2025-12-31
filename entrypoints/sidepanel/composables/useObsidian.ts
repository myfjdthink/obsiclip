import type { Ref } from 'vue';
import type { ExtractedContent } from '@/types';
import { addRecentPath } from '@/utils/storage';
import { buildObsidianURI, generateFrontmatter, openObsidian, downloadMarkdown, copyToClipboard } from '@/utils/obsidian';

interface UseObsidianOptions {
  vault: Ref<string>;
  folder: Ref<string>;
  tags: Ref<string>;
  recentPaths: Ref<string[]>;
  title: Ref<string>;
  currentContent: Ref<string>;
  extractedContent: Ref<ExtractedContent | null>;
}

export function useObsidian(options: UseObsidianOptions) {
  const { vault, folder, tags, recentPaths, title, currentContent, extractedContent } = options;

  function getTagList() {
    return tags.value.split(',').map(t => t.trim()).filter(Boolean);
  }

  function getFullContent() {
    const url = extractedContent.value?.url || '';
    const author = extractedContent.value?.author;
    const frontmatter = generateFrontmatter(url, author, getTagList());
    return frontmatter + currentContent.value;
  }

  async function saveToObsidian() {
    const uri = buildObsidianURI(
      { vault: vault.value, folder: folder.value, tags: getTagList() },
      title.value,
      getFullContent()
    );

    if (folder.value) {
      await addRecentPath(folder.value);
      recentPaths.value = [folder.value, ...recentPaths.value.filter(p => p !== folder.value)].slice(0, 5);
    }

    openObsidian(uri);
  }

  function downloadAsMd() {
    downloadMarkdown(title.value, getFullContent());
  }

  async function copyMd() {
    await copyToClipboard(currentContent.value);
  }

  async function copyHtml() {
    const content = extractedContent.value?.content || '';
    await copyToClipboard(content);
  }

  return {
    saveToObsidian,
    downloadAsMd,
    copyMd,
    copyHtml,
  };
}
