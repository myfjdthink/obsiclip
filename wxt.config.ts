import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'ObsiClip 黑曜剪',
    description: '智能网页剪藏到 Obsidian - AI 赋能的知识管理助手',
    version: '0.1.0',
    permissions: [
      'activeTab',
      'storage',
      'sidePanel',
      'scripting',
    ],
    host_permissions: [
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
      'https://api.deepseek.com/*',
      '<all_urls>',
    ],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    action: {
      default_title: 'ObsiClip 黑曜剪',
    },
  },
});
