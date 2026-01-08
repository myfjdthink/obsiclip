export default {
  // 通用
  common: {
    save: '保存',
    cancel: '取消',
    loading: '加载中...',
    retry: '重试',
    settings: '设置',
    refresh: '刷新',
  },

  // Popup 界面
  popup: {
    tabs: {
      raw: '原始内容',
      ai: 'AI 整理',
    },
    loading: '提取内容中...',
    titlePlaceholder: '笔记标题',
    refreshContent: '刷新内容',
  },

  // 原始内容 Tab
  rawContent: {
    placeholder: '提取的内容将显示在这里...',
    aiProcess: 'AI 智能整理',
    directSave: '直接保存',
  },

  // AI 预览 Tab
  aiPreview: {
    expandPrompt: '展开 Prompt 设置',
    collapsePrompt: '收起 Prompt 设置',
    promptPlaceholder: '系统提示词...',
    regenerate: '重新生成',
    processing: 'AI 正在整理...',
    emptyHint: '点击「AI 智能整理」开始处理',
  },

  // 保存区域
  saveFooter: {
    folderLabel: '文件夹/类别',
    saveToObsidian: '保存到 Obsidian',
    saveAsMd: '保存为 .md 文件',
    copyMd: '复制 Markdown',
    copyHtml: '复制 HTML',
  },

  // 设置页面
  settings: {
    title: 'ObsiClip',
    tabs: {
      ai: 'AI 配置',
      prompt: 'Prompt 配置',
      general: '通用设置',
    },

    // AI 配置
    ai: {
      title: 'AI 服务配置',
      desc: '配置用于内容整理的 AI 服务',
      provider: '服务商',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'sk-...',
      apiKeyHint: '🔒 本地加密存储，不会上传到任何服务器',
      baseUrl: 'Base URL',
      baseUrlPlaceholder: '输入 API 地址',
      baseUrlDefault: '使用默认地址',
      baseUrlHint: '支持 OneAPI 等代理服务',
      model: '模型',
      modelPlaceholder: '输入模型名称',
      testConnection: '测试连接',
      testing: '测试中...',
      saveConfig: '保存配置',
      saving: '保存中...',
      testSuccess: '✓ 连接成功',
      testFailed: '✗ 连接失败',
      saveSuccess: '✓ 保存成功',
      saveFailed: '✗ 保存失败',
    },

    // Prompt 配置
    prompt: {
      title: 'Prompt 预设',
      desc: '自定义 AI 处理内容时使用的系统提示词',
      placeholder: '输入系统提示词...',
      reset: '重置为默认',
      save: '保存 Prompt',
      saveSuccess: '✓ Prompt 已保存',
      resetSuccess: '✓ 已重置为默认',
    },

    // 保存配置
    save: {
      title: '保存配置',
      desc: '配置内容保存时的行为',
      autoSave: 'AI 整理后自动保存',
      autoSaveDesc: '开启后，AI 整理完成会自动保存到 Obsidian，无需手动点击保存',
    },

    // 通用设置
    general: {
      title: '通用设置',
      desc: '配置扩展的通用选项',
      language: '界面语言',
      languageDesc: '选择扩展界面显示的语言',
      backgroundAI: 'AI 后台自动整理',
      backgroundAIDesc: '开启后，AI 处理将在后台静默完成后自动保存。只有当你需要 Review 并手动修改 AI 处理结果时，才建议取消勾选',
      vault: '指定 Obsidian Vault',
      vaultDesc: '指定要保存到的 Obsidian 库。如果不填，将保存到当前默认开启的库',
      vaultPlaceholder: '输入 Vault 名称',
      vaultHint: '提示：确保 Obsidian 中已开启该 Vault，否则无法保存成功',
    },

    // 服务商名称
    providers: {
      openai: 'OpenAI',
      claude: 'Claude (Anthropic)',
      gemini: 'Gemini (Google)',
      deepseek: 'DeepSeek',
      custom: '自定义',
    },
  },

  // 语言名称
  languages: {
    'zh-CN': '简体中文',
    en: 'English',
  },

  // 进度通知
  progress: {
    preparing: '正在准备...',
    extracting: '正在提取页面内容...',
    aiProcessing: 'AI 正在整理内容...',
    parsing: '正在解析结果...',
    success: '剪藏成功！正在打开 Obsidian...',
    failed: '失败',
  },
};
