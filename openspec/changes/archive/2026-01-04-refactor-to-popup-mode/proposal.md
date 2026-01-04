# Change: 将 ObsiClip 从 Sidepanel 模式重构为 Popup 模式

## Why

当前 ObsiClip 使用 Chrome sidePanel API，存在以下问题：
1. sidePanel 需要用户两次点击才能打开（点击图标 → 点击侧边栏按钮）
2. 用户体验不够直接，操作路径较长
3. 配置项混合在主界面中，增加了界面复杂度

Popup 模式可以实现「一键打开」的体验，更符合用户剪藏网页内容的快速操作习惯。

## What Changes

### 1. Popup 页面重构
- 将现有 sidepanel 的核心功能迁移到 popup
- 复用 `RawContentTab.vue`、`AiPreviewTab.vue`、`SaveFooter.vue` 组件
- 复用 `useContent.ts`、`useObsidian.ts`、`useSettings.ts` composables
- 新增 `HeaderMenu.vue` 组件（刷新按钮 + 设置入口）

### 2. Settings 独立页面
- 新建 `entrypoints/settings/` 目录
- 提取 API 配置和 Prompt 配置到独立页面
- 通过 `browser.tabs.create()` 在新标签页打开

### 3. Manifest 变更
- 移除 `sidePanel` 权限
- 添加 `action.default_popup` 配置
- 移除 `side_panel` 配置

### 4. 清理旧代码
- **BREAKING**: 删除 `entrypoints/sidepanel/` 目录
- **BREAKING**: 删除 `entrypoints/options/` 目录
- 简化 `background.ts`，移除 sidePanel 相关逻辑

## Impact

- 受影响的规格:
  - 新增 `popup` 能力规格
  - 新增 `settings` 能力规格
- 受影响的代码:
  - `entrypoints/popup/` - 完全重写
  - `entrypoints/settings/` - 新建
  - `entrypoints/sidepanel/` - 删除
  - `entrypoints/options/` - 删除
  - `entrypoints/background.ts` - 简化
  - `wxt.config.ts` - 更新 manifest 配置
