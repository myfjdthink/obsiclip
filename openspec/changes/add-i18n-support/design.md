# 设计文档: 多语言支持 (i18n)

## 技术方案

### 方案选择

采用**轻量级自定义 i18n 方案**，不引入 vue-i18n 等第三方库。理由：

1. 项目规模较小，文本量有限
2. 减少依赖，保持扩展体积小
3. 实现简单，易于维护

### 架构设计

```
locales/
├── index.ts      # 导出和类型定义
├── zh-CN.ts      # 中文语言包
└── en.ts         # 英文语言包

utils/
└── i18n.ts       # i18n 核心逻辑
```

### 核心 API

```typescript
// 获取翻译文本
t('popup.tabs.raw')  // => "原始内容" 或 "Raw Content"

// 获取当前语言
getLocale()  // => "zh-CN" | "en"

// 设置语言
setLocale(locale: Locale)
```

### 语言检测逻辑

1. 检查 `chrome.storage.local` 中是否有用户设置的语言偏好
2. 如果没有，读取 `navigator.language`
3. 匹配支持的语言（zh-CN, en），默认 fallback 到 en

### 语言包结构

```typescript
export default {
  popup: {
    tabs: {
      raw: '原始内容',
      ai: 'AI 整理',
    },
    loading: '提取内容中...',
    // ...
  },
  settings: {
    // ...
  },
  common: {
    save: '保存',
    cancel: '取消',
    // ...
  },
}
```

## 实现要点

1. **响应式语言切换**: 使用 Vue 的 `ref` 存储当前语言，切换时自动更新 UI
2. **类型安全**: 使用 TypeScript 确保翻译 key 的类型安全
3. **懒加载**: 语言包在需要时加载，减少初始加载时间
