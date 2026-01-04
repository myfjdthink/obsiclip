# settings Specification

## Purpose
TBD - created by archiving change refactor-to-popup-mode. Update Purpose after archive.
## Requirements
### Requirement: Settings 独立页面
系统 SHALL 提供一个独立的 Settings 页面，用于配置 AI 服务和 Prompt。

#### Scenario: 打开 Settings 页面
- **WHEN** 用户从 Popup 点击设置按钮
- **THEN** 系统在新标签页中打开 Settings 页面
- **AND** 页面 URL 为 `chrome-extension://[id]/settings.html`

### Requirement: API 配置
Settings 页面 SHALL 提供 AI 服务的配置功能。

#### Scenario: 配置 LLM 服务商
- **WHEN** 用户打开 Settings 页面
- **THEN** 系统显示服务商选择下拉框
- **AND** 支持 OpenAI、Claude、Gemini、DeepSeek 和自定义选项

#### Scenario: 配置 API Key
- **WHEN** 用户输入 API Key
- **THEN** 系统以密码形式显示输入内容
- **AND** 本地加密存储，不上传到任何服务器

#### Scenario: 配置 Base URL
- **WHEN** 用户选择服务商后
- **THEN** 系统自动填充默认的 Base URL
- **AND** 用户可以手动修改以支持代理服务

#### Scenario: 配置模型
- **WHEN** 用户选择服务商后
- **THEN** 系统显示该服务商的推荐模型列表
- **AND** 用户可以手动输入其他模型名称

#### Scenario: 测试连接
- **WHEN** 用户点击「测试连接」按钮
- **THEN** 系统使用当前配置发送测试请求
- **AND** 显示连接成功或失败的结果

### Requirement: Prompt 配置
Settings 页面 SHALL 提供 Prompt 的自定义配置功能。

#### Scenario: 编辑 Prompt
- **WHEN** 用户展开 Prompt 编辑器
- **THEN** 系统显示当前的系统提示词
- **AND** 用户可以自由编辑内容

#### Scenario: 重置 Prompt
- **WHEN** 用户点击「重置为默认」按钮
- **THEN** 系统将 Prompt 恢复为默认值
- **AND** 显示重置成功提示

#### Scenario: 保存 Prompt
- **WHEN** 用户点击「保存 Prompt」按钮
- **THEN** 系统将自定义 Prompt 保存到本地存储
- **AND** 显示保存成功提示

### Requirement: 返回导航
Settings 页面 SHALL 提供返回导航，方便用户关闭设置页面。

#### Scenario: 返回操作
- **WHEN** 用户点击返回按钮或关闭标签页
- **THEN** Settings 页面关闭
- **AND** 用户可以继续使用 Popup 进行剪藏操作

### Requirement: LLM 服务配置

系统必须（SHALL）提供 LLM 服务配置界面，允许用户配置 AI 服务所需的参数。

#### Scenario: 用户首次配置 API Key

- **WHEN** 用户首次打开设置页面
- **THEN** 系统显示 LLM Provider 下拉选择（OpenAI / Gemini / Claude / DeepSeek / 自定义）
- **AND** 显示 API Key 输入框（密码类型，本地存储）
- **AND** 显示 Base URL 输入框（默认填充官方地址）
- **AND** 显示 Model Name 输入框

#### Scenario: 选择预设服务商

- **WHEN** 用户从下拉菜单选择 "OpenAI"
- **THEN** Base URL 自动填充为 `https://api.openai.com/v1`
- **AND** Model Name 提示常用模型（如 `gpt-4o`, `gpt-4o-mini`）

#### Scenario: 选择自定义服务商

- **WHEN** 用户选择 "自定义" 服务商
- **THEN** Base URL 输入框变为必填
- **AND** 用户可输入任意 OpenAI 兼容的 API 地址

### Requirement: API Key 安全存储

系统必须（SHALL）安全存储用户的 API Key，确保不被泄露。

#### Scenario: 存储 API Key

- **WHEN** 用户输入并保存 API Key
- **THEN** 系统使用 `chrome.storage.local` 存储（不同步到云端）
- **AND** API Key 在存储前进行加密处理

#### Scenario: 禁止明文日志

- **WHEN** 系统记录任何日志
- **THEN** API Key 不得以明文形式出现在日志中

### Requirement: 连接测试

系统必须（SHALL）提供 API 连接测试功能，验证用户配置是否正确。

#### Scenario: 测试成功

- **WHEN** 用户点击 "测试连接" 按钮
- **AND** API Key 和配置有效
- **THEN** 系统发送测试请求到 LLM 服务
- **AND** 显示 "连接成功" 提示

#### Scenario: 测试失败

- **WHEN** 用户点击 "测试连接" 按钮
- **AND** API Key 无效或配置错误
- **THEN** 系统显示具体错误信息（如 401 未授权、网络错误）

### Requirement: Prompt 预设管理

系统必须（SHALL）允许用户自定义 AI 处理的系统提示词（System Prompt）。

#### Scenario: 查看默认 Prompt

- **WHEN** 用户未配置自定义 Prompt
- **THEN** 系统使用内置的默认 Prompt（知识管理助手模板）

#### Scenario: 编辑 Prompt

- **WHEN** 用户在设置中编辑 Prompt 文本
- **AND** 点击保存
- **THEN** 后续 AI 整理请求使用用户自定义的 Prompt

#### Scenario: 重置为默认

- **WHEN** 用户点击 "重置为默认" 按钮
- **THEN** Prompt 恢复为系统内置的默认值

