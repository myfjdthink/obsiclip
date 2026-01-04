## ADDED Requirements

### Requirement: Popup 主界面
用户点击扩展图标时，系统 SHALL 打开一个 Popup 窗口作为主交互界面。

#### Scenario: 点击扩展图标打开 Popup
- **WHEN** 用户点击浏览器工具栏中的 ObsiClip 扩展图标
- **THEN** 系统打开一个 380x520px 的 Popup 窗口
- **AND** 自动提取当前页面内容

### Requirement: Tab 切换导航
Popup 界面 SHALL 提供 Tab 切换功能，支持在「原始内容」和「AI 整理」之间切换。

#### Scenario: 切换到原始内容 Tab
- **WHEN** Popup 打开时
- **THEN** 默认显示「原始内容」Tab
- **AND** 展示提取的网页正文预览

#### Scenario: 切换到 AI 整理 Tab
- **WHEN** 用户点击「AI 整理」Tab
- **THEN** 系统显示 AI 整理界面
- **AND** 如果尚未整理，则触发 AI 处理

### Requirement: 顶部菜单栏
Popup 顶部 SHALL 显示一个菜单栏，包含页面信息和操作按钮。

#### Scenario: 显示页面信息
- **WHEN** Popup 打开后
- **THEN** 顶部显示当前页面的 URL（source）
- **AND** 显示可编辑的笔记标题

#### Scenario: 刷新内容
- **WHEN** 用户点击刷新按钮
- **THEN** 系统重新提取当前页面内容
- **AND** 重置到「原始内容」Tab

#### Scenario: 打开设置
- **WHEN** 用户点击设置按钮
- **THEN** 系统在新标签页中打开 Settings 页面

### Requirement: 保存功能
Popup 底部 SHALL 提供保存功能区，允许用户将内容保存到 Obsidian。

#### Scenario: 保存到 Obsidian
- **WHEN** AI 整理完成后
- **AND** 用户点击保存按钮
- **THEN** 系统通过 Obsidian URI 协议保存笔记

#### Scenario: 保存按钮状态
- **WHEN** AI 整理未完成时
- **THEN** 保存按钮显示为禁用状态
