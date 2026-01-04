# 技术设计: ObsiClip MVP

## Context

ObsiClip 是一个 Chrome 浏览器扩展，需要在 Manifest V3 架构下运行。核心挑战包括：
- Content Script 与 Side Panel 之间的通信
- AI 流式响应的处理与渲染
- 用户 API Key 的安全存储
- 网页样式隔离（防止 CSS 污染）

## Goals / Non-Goals

**Goals:**
- 实现端到端的网页剪藏流程
- 支持主流 LLM 服务商（OpenAI、Claude、Gemini、DeepSeek）
- 侧边栏打开速度 < 500ms
- 隐私优先：零服务器架构

**Non-Goals:**
- 不实现特殊网站适配器（Phase 2）
- 不实现云端同步功能
- 不支持 Firefox 等非 Chromium 浏览器

## Decisions

### 1. 扩展架构

**决定**: 采用 WXT 框架 + Vue 构建

**理由**:
- WXT 提供良好的 Manifest V3 支持和热重载
- Vue 适合构建复杂的侧边栏 UI，API 简洁
- TypeScript 提供类型安全

### 2. 内容提取

**决定**: Readability.js + Turndown 组合

**理由**:
- Readability.js 是 Mozilla 开源的成熟方案
- Turndown 支持自定义规则，便于优化 Markdown 输出
- 两者均可在 Content Script 中运行

### 3. AI 服务集成

**决定**: 统一 OpenAI 兼容 API 格式

**理由**:
- 大多数 LLM 服务商支持 OpenAI API 格式
- 简化代码，只需维护一套请求逻辑
- 用户可通过 Base URL 自定义接入 OneAPI 等代理服务

### 4. 侧边栏渲染

**决定**: 使用 Chrome Side Panel API

**理由**:
- 原生支持，性能更好
- 自动处理样式隔离
- 支持与页面并排显示

### 5. 数据存储

**决定**: 使用 `chrome.storage.local` 存储敏感配置

**理由**:
- 本地存储，不同步到云端
- 加密存储 API Key（使用 Web Crypto API）
- 符合隐私优先原则

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Popup     │  │  Side Panel │  │ Background SW   │ │
│  │  (入口)     │  │  (主 UI)    │  │ (API 请求)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          │ chrome.runtime.sendMessage   │
│  ┌───────────────────────▼─────────────────────────┐   │
│  │              Content Script                      │   │
│  │  - Readability.js (内容提取)                    │   │
│  │  - DOM 高亮与选区管理                           │   │
│  │  - Turndown (HTML → Markdown)                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │   LLM API (用户配置)    │
            │  OpenAI / Claude / etc  │
            └─────────────────────────┘
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Readability 提取不准确 | 提供手动选取模式作为后备 |
| API Key 泄露 | 使用加密存储，禁止明文日志 |
| 流式响应中断 | 实现重试机制和错误提示 |
| 侧边栏样式被网页污染 | Side Panel 自带隔离，无需额外处理 |

## Migration Plan

不适用 - 这是新项目的首次实现。

## Open Questions

已确认：
1. ~~是否需要支持离线模式（无 AI，仅保存原文）？~~ → **不支持**
2. ~~图片处理策略：保留原始 URL 还是尝试 base64 内嵌？~~ → **MVP 阶段先忽略，后续迭代处理**
3. ~~是否需要支持多语言界面（国际化）？~~ → **MVP 不做，后续迭代**