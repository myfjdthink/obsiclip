# i18n 能力规格

## 概述

提供多语言支持，允许用户在中文和英文之间切换界面语言，并在首次安装时自动检测浏览器语言进行适配。

## ADDED Requirements

### Requirement: 语言自动检测

扩展 SHALL 在首次安装时根据浏览器语言自动选择界面语言。

#### Scenario: 浏览器语言为中文

- Given 用户首次安装扩展
- And 浏览器语言设置为中文（zh-CN, zh-TW, zh）
- When 扩展初始化
- Then 界面语言自动设置为中文

#### Scenario: 浏览器语言为英文或其他

- Given 用户首次安装扩展
- And 浏览器语言设置为非中文
- When 扩展初始化
- Then 界面语言自动设置为英文

### Requirement: 语言手动切换

用户 SHALL 能够在设置页面手动切换界面语言。

#### Scenario: 切换语言

- Given 用户打开设置页面
- When 用户在语言选项中选择目标语言
- Then 界面立即切换为目标语言
- And 语言偏好保存到本地存储

#### Scenario: 语言偏好持久化

- Given 用户已设置语言偏好
- When 用户关闭并重新打开扩展
- Then 界面使用用户设置的语言

### Requirement: 界面文本国际化

所有用户可见的界面文本 SHALL 支持多语言显示。

#### Scenario: Popup 界面文本

- Given 用户打开 Popup
- When 当前语言为中文
- Then 所有按钮、标签、提示文本显示中文
- When 当前语言为英文
- Then 所有按钮、标签、提示文本显示英文

#### Scenario: 设置页面文本

- Given 用户打开设置页面
- When 当前语言为中文
- Then 所有配置项标签、按钮、提示显示中文
- When 当前语言为英文
- Then 所有配置项标签、按钮、提示显示英文

### Requirement: 默认 Prompt 国际化

默认系统 Prompt SHALL 根据当前语言自动切换为对应语言版本。

#### Scenario: 中文 Prompt

- Given 当前语言为中文
- And 用户未自定义 Prompt
- When 用户使用 AI 整理功能
- Then 使用中文版本的默认 Prompt

#### Scenario: 英文 Prompt

- Given 当前语言为英文
- And 用户未自定义 Prompt
- When 用户使用 AI 整理功能
- Then 使用英文版本的默认 Prompt

#### Scenario: 用户自定义 Prompt 优先

- Given 用户已自定义 Prompt
- When 语言切换
- Then 继续使用用户自定义的 Prompt，不自动切换
