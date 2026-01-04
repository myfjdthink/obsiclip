## Context

ObsiClip 是一个 Chrome 扩展，用于剪藏网页内容到 Obsidian。当前使用 sidePanel API，需要重构为 popup 模式以提升用户体验。

**约束条件:**
- 需要复用现有的组件和 composables 以减少重复代码
- Popup 尺寸固定为 380x520px
- Settings 页面需要独立打开以提供足够的编辑空间
- 需要支持深色模式（CSS 变量）

## Goals / Non-Goals

**Goals:**
- 实现一键打开的 popup 交互
- 将配置功能分离到独立页面
- 保持与 sidepanel 相同的功能完整性
- 复用现有代码，最小化重复

**Non-Goals:**
- 手动选取模式（本版本不实现）
- 历史记录管理界面
- 多语言支持

## Decisions

### Decision 1: Popup 作为主交互入口

**选择**: 使用 `action.default_popup` 替代 `sidePanel`

**理由**:
- Popup 点击即开，无需额外步骤
- 更符合用户快速剪藏的使用习惯
- 大多数扩展的标准交互模式

**替代方案**:
- 保持 sidePanel: 操作路径长，体验不够流畅
- Popup + sidePanel 并存: 增加复杂度，维护成本高

### Decision 2: Settings 独立页面

**选择**: Settings 通过 `browser.tabs.create()` 在新标签页打开

**理由**:
- Popup 尺寸有限（380x520px），无法容纳完整配置界面
- Settings 配置频率低，独立页面更合理
- 提供足够空间编辑 Prompt

**替代方案**:
- 内嵌在 popup 中: 空间不足，需要多层折叠
- 使用 options_page: 功能相同，但命名更清晰

### Decision 3: 组件复用策略

**选择**: 将 sidepanel 组件迁移到 popup 目录，composables 同样迁移

**文件迁移映射**:
```
sidepanel/components/RawContentTab.vue  → popup/components/RawContentTab.vue
sidepanel/components/AiPreviewTab.vue   → popup/components/AiPreviewTab.vue
sidepanel/components/SaveFooter.vue     → popup/components/SaveFooter.vue
sidepanel/composables/useContent.ts     → popup/composables/useContent.ts
sidepanel/composables/useObsidian.ts    → popup/composables/useObsidian.ts
sidepanel/composables/useSettings.ts    → popup/composables/useSettings.ts
```

**新增组件**:
- `popup/components/HeaderMenu.vue`: 顶部菜单栏（刷新按钮 + 设置入口）

**不迁移**:
- `sidepanel/components/SettingsPanel.vue`: 功能合并到 settings 页面

### Decision 4: 样式方案

**选择**: 使用 CSS 变量支持深色模式

```css
:root {
  --popup-width: 380px;
  --popup-height: 520px;
  --background-primary: #ffffff;
  --text-normal: #1a1a1a;
  --interactive-accent: #7c3aed;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-primary: #1e1e1e;
    --text-normal: #dcddde;
  }
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Popup 关闭后状态丢失 | 中 | AI 处理结果使用 storage 临时保存 |
| Settings 页面跳转打断流程 | 低 | 仅首次配置需要，后续不常用 |
| 组件迁移可能引入 bug | 中 | 迁移后进行完整功能测试 |

## Open Questions

1. ~~是否需要在 popup 关闭时保存中间状态?~~ 决定: 不保存，用户重新打开时从头开始
2. Settings 页面是否需要返回按钮? 参考计划文档，设计中包含返回按钮
