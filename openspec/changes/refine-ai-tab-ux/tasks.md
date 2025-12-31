# Tasks: refine-ai-tab-ux

## Phase 1: 基础 UI 调整

- [x] **T1.1** 将 App.vue 中的 Tab 名称从"AI 预览"改为"AI 整理"
- [x] **T1.2** 从 SaveFooter.vue 中移除 Vault 输入框
- [x] **T1.3** 更新 App.vue 中 SaveFooter 的 vault 相关 props 和事件

## Phase 2: 移除 Tags 功能

- [x] **T2.1** 从 types/index.ts 的 AIProcessedContent 接口中移除 tags 字段
- [x] **T2.2** 从 utils/storage.ts 的 DEFAULT_PROMPT 中移除 tags 相关说明
- [x] **T2.3** 从 AiPreviewTab.vue 中移除 tags 显示区域

## Phase 3: 流式渲染集成

- [x] **T3.1** 安装 markstream-vue 依赖：`pnpm add markstream-vue`
- [x] **T3.2** 在 AiPreviewTab.vue 中引入 MarkdownRender 组件
- [x] **T3.3** 修改 useContent.ts，使用 parseMarkdownToStructure 解析流式内容
- [x] **T3.4** 替换 v-html 渲染为 MarkdownRender 组件
- [x] **T3.5** 调整样式确保与现有 UI 一致

## Phase 4: AI 响应格式优化

- [x] **T4.1** 修改 DEFAULT_PROMPT，改用 YAML frontmatter + Markdown 格式
- [x] **T4.2** 更新 useContent.ts 中的 parseAIResponse 函数，解析 YAML frontmatter
- [x] **T4.3** 实现渐进式显示：检测到 `---` 结束后显示元信息，正文流式渲染

## Phase 5: 验证与测试

- [x] **T5.1** 测试流式渲染效果
- [x] **T5.2** 验证 AI 响应解析正确性
- [x] **T5.3** 确认 UI 样式一致性

## Dependencies

```
T1.1 → T1.2 → T1.3 (顺序执行)
T2.1 → T2.2 → T2.3 (顺序执行)
T3.1 → T3.2 → T3.3 → T3.4 → T3.5 (顺序执行)
T4.1 → T4.2 → T4.3 (顺序执行)
Phase 1-3 可并行执行
Phase 4 依赖 Phase 3 完成
Phase 5 依赖所有前置任务完成
```
