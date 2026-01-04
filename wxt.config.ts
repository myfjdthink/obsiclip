import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'ObsiClip',
    description: 'AI-Powered Web Clipper for Obsidian - Summarize, Tag & Save',
    version: '0.1.0',
    permissions: [
      'activeTab',
      'storage',
      'scripting',
    ],
    host_permissions: [
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
      'https://api.deepseek.com/*',
      '<all_urls>',
    ],
    action: {
      default_title: 'ObsiClip',
      default_popup: 'popup.html',
    },
  },
});
