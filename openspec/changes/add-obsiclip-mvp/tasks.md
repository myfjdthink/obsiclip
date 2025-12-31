# 任务清单: ObsiClip MVP 实现

## 1. 项目基础设施

- [x] 1.1 配置 WXT 项目结构和 TypeScript
- [x] 1.2 配置 Manifest V3 权限（activeTab, storage, sidePanel）
- [x] 1.3 添加 LLM API 域名到 host_permissions
- [x] 1.4 集成 Vue 和基础 UI 组件库

## 2. 设置功能 (settings)

- [x] 2.1 创建设置页面 UI（Provider 选择、API Key 输入、Base URL、Model）
- [x] 2.2 实现 API Key 加密存储逻辑（chrome.storage.local + Web Crypto）
- [x] 2.3 实现服务商预设配置（自动填充 Base URL）
- [x] 2.4 实现「测试连接」功能
- [x] 2.5 实现 Prompt 预设编辑与重置功能

## 3. 内容提取功能 (extraction)

- [x] 3.1 集成 Readability.js 到 Content Script
- [x] 3.2 集成 Turndown 实现 HTML → Markdown 转换
- [x] 3.3 实现自动提取时的视觉反馈（蓝色遮罩、虚线边框）
- [x] 3.4 实现手动选取模式（悬停高亮、点击选择/取消）
- [ ] 3.5 实现选区层级调整（Parent/Child 按钮）
- [x] 3.6 实现元数据提取（标题、URL）

## 4. 侧边栏功能 (sidepanel)

- [x] 4.1 创建 Side Panel 入口和基础布局
- [x] 4.2 实现顶部导航区（标题编辑、Tab 切换、设置入口）
- [x] 4.3 实现「原始内容」Tab（Markdown 编辑器、AI 整理按钮）
- [x] 4.4 实现「AI 预览」Tab 基础结构
- [x] 4.5 实现 Prompt 设置区（折叠/展开、临时编辑）
- [x] 4.6 实现 AI 请求状态展示（Loading、Streaming、完成、错误）
- [x] 4.7 实现 Markdown 渲染（代码高亮、列表、加粗）

## 5. AI 集成

- [x] 5.1 创建 Background Service Worker 处理 AI 请求
- [x] 5.2 实现 OpenAI 兼容 API 请求逻辑
- [x] 5.3 实现流式响应（SSE）处理
- [x] 5.4 实现 Side Panel 与 Background 的消息通信
- [x] 5.5 实现错误处理和重试机制

## 6. 输出功能 (output)

- [x] 6.1 实现保存配置 UI（Vault、文件夹路径、Tags）
- [x] 6.2 实现最近路径记录（最多 5 个）
- [x] 6.3 实现 Obsidian URI 构建和唤起
- [x] 6.4 实现「保存为 .md 文件」（Chrome Download API）
- [x] 6.5 实现「复制 Markdown」功能
- [x] 6.6 实现「复制 HTML」功能
- [x] 6.7 实现笔记 Frontmatter 自动生成

## 7. 测试与验收

- [ ] 7.1 编写设置功能单元测试
- [ ] 7.2 编写内容提取功能测试
- [ ] 7.3 端到端测试：完整剪藏流程
- [ ] 7.4 性能验收：侧边栏打开 < 500ms，Readability < 1s

## 依赖关系

```
1.x (基础设施)
  └── 2.x (设置) ─────────────┐
  └── 3.x (提取) ──┐          │
                   ├── 4.x (侧边栏) ── 5.x (AI) ── 6.x (输出) ── 7.x (测试)
```

## 并行建议

- 任务 2.x 和 3.x 可并行开发
- 任务 4.1-4.3 可与 5.1-5.2 并行
- 任务 6.x 依赖 4.x 和 5.x 完成
