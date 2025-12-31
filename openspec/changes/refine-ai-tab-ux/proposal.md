# Proposal: refine-ai-tab-ux

## Title
优化 AI 整理 Tab 的交互体验

## Summary
改进 AI 处理 Tab 的用户体验，包括重命名 Tab、实现流式渲染、简化 AI 输出结构（移除 tags）、以及移除底部 Vault 输入框。

## Motivation
当前 AI 预览功能存在以下问题：
1. Tab 名称"AI 预览"不够直观，"AI 整理"更能体现功能本质
2. AI 返回内容是一次性渲染，用户需要等待完整响应才能看到结果
3. tags 标签由 AI 生成的价值不大，用户更倾向于手动管理标签
4. Vault 输入框使用频率低，占用界面空间

## Scope

### In Scope
- 将 Tab 名称从"AI 预览"改为"AI 整理"
- 集成 markstream-vue 实现流式 Markdown 渲染
- 修改 AI 响应格式：先返回标题和分类，再返回正文内容
- 从 AI Prompt 中移除 tags 生成要求
- 从 AiPreviewTab 组件中移除 tags 显示
- 从 SaveFooter 组件中移除 Vault 输入框

### Out of Scope
- 修改原始内容 Tab 的功能
- 修改设置面板的功能
- 修改保存到 Obsidian 的核心逻辑

## Approach

### 1. Tab 重命名
直接修改 App.vue 中的 Tab 文本。

### 2. 流式渲染集成
- 安装 markstream-vue 依赖
- 在 AiPreviewTab 中使用 MarkdownRender 组件替代 v-html
- 使用 parseMarkdownToStructure 解析流式内容

### 3. AI 响应格式调整
放弃 JSON 格式，改用 **YAML frontmatter + Markdown** 格式：

```markdown
---
title: 标题
category: model
summary: 50-100字摘要
---

## 要点速览
- 要点1
...
```

优势：
- frontmatter 很短，几行就完成，可快速解析出元信息
- 正文是纯 Markdown，检测到第二个 `---` 后直接流式渲染
- 解析简单，只需检测 `---` 分隔符

### 4. 移除 Tags
- 从 DEFAULT_PROMPT 中移除 tags 相关说明
- 从 AIProcessedContent 类型中移除 tags 字段
- 从 AiPreviewTab 中移除 tags 显示区域

### 5. 移除 Vault 输入框
从 SaveFooter 组件中移除 Vault 输入框及相关逻辑。

## Dependencies
- markstream-vue: 流式 Markdown 渲染库

## Risks
- markstream-vue 可能与现有样式冲突，需要调整 CSS
- 流式 JSON 解析需要特殊处理，确保部分 JSON 也能正确显示
