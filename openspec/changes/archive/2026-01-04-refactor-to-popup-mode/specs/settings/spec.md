## ADDED Requirements

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
