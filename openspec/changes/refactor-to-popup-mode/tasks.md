## Phase 1: 重构 Popup 页面

### 1.1 迁移组件和 composables
- [x] 1.1.1 将 `sidepanel/composables/*.ts` 迁移到 `popup/composables/`
- [x] 1.1.2 将 `sidepanel/components/RawContentTab.vue` 迁移到 `popup/components/`
- [x] 1.1.3 将 `sidepanel/components/AiPreviewTab.vue` 迁移到 `popup/components/`
- [x] 1.1.4 将 `sidepanel/components/SaveFooter.vue` 迁移到 `popup/components/`

### 1.2 创建新组件
- [x] 1.2.1 创建 `popup/components/HeaderMenu.vue`（包含刷新按钮和设置入口）

### 1.3 重写 Popup 主文件
- [x] 1.3.1 重写 `popup/App.vue`，实现 Tab 切换布局
- [x] 1.3.2 更新 `popup/main.ts` 引入
- [x] 1.3.3 创建 `popup/style.css`，定义 CSS 变量和全局样式

### 1.4 验证 Popup 功能
- [x] 1.4.1 测试内容提取功能
- [x] 1.4.2 测试 AI 整理功能
- [x] 1.4.3 测试保存到 Obsidian 功能

## Phase 2: 创建 Settings 页面

### 2.1 创建 Settings 入口点
- [x] 2.1.1 创建 `settings/index.html`
- [x] 2.1.2 创建 `settings/main.ts`
- [x] 2.1.3 创建 `settings/App.vue`（从 options/App.vue 提取配置部分）
- [x] 2.1.4 创建 `settings/style.css`

### 2.2 验证 Settings 功能
- [x] 2.2.1 测试 API 配置保存
- [x] 2.2.2 测试 Prompt 配置保存
- [x] 2.2.3 测试从 Popup 打开 Settings 页面

## Phase 3: 更新 Manifest 和 Background

### 3.1 更新配置
- [x] 3.1.1 更新 `wxt.config.ts`，移除 sidePanel 权限，添加 popup 配置

### 3.2 简化 Background
- [x] 3.2.1 更新 `background.ts`，移除 sidePanel 相关代码
- [x] 3.2.2 保留 AI_PROCESS 和 OPEN_OBSIDIAN_URL 消息处理

## Phase 4: 清理旧代码

### 4.1 删除旧目录
- [x] 4.1.1 删除 `entrypoints/sidepanel/` 目录
- [x] 4.1.2 删除 `entrypoints/options/` 目录

### 4.2 最终验证
- [x] 4.2.1 运行 `pnpm build` 确认构建成功
- [x] 4.2.2 在浏览器中完整测试扩展功能
