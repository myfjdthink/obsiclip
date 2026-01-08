export default {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    retry: 'Retry',
    settings: 'Settings',
    refresh: 'Refresh',
  },

  // Popup
  popup: {
    tabs: {
      raw: 'Raw Content',
      ai: 'AI Summary',
    },
    loading: 'Extracting content...',
    titlePlaceholder: 'Note title',
    refreshContent: 'Refresh content',
  },

  // Raw Content Tab
  rawContent: {
    placeholder: 'Extracted content will appear here...',
    aiProcess: 'AI Summarize',
    directSave: 'Save directly',
  },

  // AI Preview Tab
  aiPreview: {
    expandPrompt: 'Expand Prompt settings',
    collapsePrompt: 'Collapse Prompt settings',
    promptPlaceholder: 'System prompt...',
    regenerate: 'Regenerate',
    processing: 'AI is processing...',
    emptyHint: 'Click "AI Summarize" to start',
  },

  // Save Footer
  saveFooter: {
    folderLabel: 'Folder/Category',
    saveToObsidian: 'Save to Obsidian',
    saveAsMd: 'Save as .md file',
    copyMd: 'Copy Markdown',
    copyHtml: 'Copy HTML',
  },

  // Settings page
  settings: {
    title: 'ObsiClip',
    tabs: {
      ai: 'AI Config',
      prompt: 'Prompt Config',
      general: 'General',
    },

    // AI Config
    ai: {
      title: 'AI Service Configuration',
      desc: 'Configure the AI service for content processing',
      provider: 'Provider',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'sk-...',
      apiKeyHint: '🔒 Encrypted locally, never uploaded to any server',
      baseUrl: 'Base URL',
      baseUrlPlaceholder: 'Enter API address',
      baseUrlDefault: 'Use default address',
      baseUrlHint: 'Supports OneAPI and other proxy services',
      model: 'Model',
      modelPlaceholder: 'Enter model name',
      testConnection: 'Test Connection',
      testing: 'Testing...',
      saveConfig: 'Save Config',
      saving: 'Saving...',
      testSuccess: '✓ Connection successful',
      testFailed: '✗ Connection failed',
      saveSuccess: '✓ Saved successfully',
      saveFailed: '✗ Save failed',
    },

    // Prompt Config
    prompt: {
      title: 'Prompt Preset',
      desc: 'Customize the system prompt for AI content processing',
      placeholder: 'Enter system prompt...',
      reset: 'Reset to default',
      save: 'Save Prompt',
      saveSuccess: '✓ Prompt saved',
      resetSuccess: '✓ Reset to default',
    },

    // Save Config
    save: {
      title: 'Save Configuration',
      desc: 'Configure save behavior',
      autoSave: 'Auto-save after AI processing',
      autoSaveDesc: 'When enabled, content will be automatically saved to Obsidian after AI processing',
    },

    // General Settings
    general: {
      title: 'General Settings',
      desc: 'Configure general extension options',
      language: 'Interface Language',
      languageDesc: 'Select the display language for the extension',
      backgroundAI: 'AI Background Processing',
      backgroundAIDesc: 'When enabled, AI processing will save automatically in the background. Only uncheck this if you need to review and edit the results before saving.',
      vault: 'Specific Obsidian Vault',
      vaultDesc: 'Specify the Obsidian vault to save to. If empty, it will save to the currently open vault.',
      vaultPlaceholder: 'Enter Vault name',
      vaultHint: 'Tip: Make sure this vault is open in Obsidian, otherwise saving will fail.',
    },

    // Provider names
    providers: {
      openai: 'OpenAI',
      claude: 'Claude (Anthropic)',
      gemini: 'Gemini (Google)',
      deepseek: 'DeepSeek',
      custom: 'Custom',
    },
  },

  // Language names
  languages: {
    'zh-CN': '简体中文',
    en: 'English',
  },

  // Progress notifications
  progress: {
    preparing: 'Preparing...',
    extracting: 'Extracting page content...',
    aiProcessing: 'AI is processing content...',
    parsing: 'Parsing results...',
    success: 'Clipped successfully! Opening Obsidian...',
    failed: 'Failed',
  },
};
