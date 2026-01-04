## ADDED Requirements

### Requirement: 侧边栏激活

系统必须（SHALL）提供侧边栏界面作为主要交互入口。

#### Scenario: 打开侧边栏

- **WHEN** 用户点击扩展图标
- **THEN** 侧边栏从浏览器右侧滑出
- **AND** 打开速度小于 500ms

#### Scenario: 侧边栏与网页并排

- **WHEN** 侧边栏打开
- **THEN** 侧边栏与网页内容并排显示
- **AND** 用户可同时阅读网页和操作侧边栏

### Requirement: 顶部导航区

系统必须（SHALL）在侧边栏顶部提供导航功能。

#### Scenario: 显示标题编辑器

- **WHEN** 侧边栏打开
- **THEN** 顶部显示提取的网页标题
- **AND** 标题支持用户点击编辑

#### Scenario: Tab 切换

- **WHEN** 侧边栏打开
- **THEN** 显示两个 Tab：「原始内容」（默认）和「AI 预览」
- **AND** 用户可点击切换 Tab

#### Scenario: 设置入口

- **WHEN** 用户点击顶部的齿轮图标
- **THEN** 打开设置页面

### Requirement: 原始内容 Tab

系统必须（SHALL）在原始内容 Tab 中显示提取的 Markdown 内容。

#### Scenario: 显示提取内容

- **WHEN** 用户处于「原始内容」Tab
- **THEN** Textarea 显示提取到的 Markdown 源码
- **AND** 内容支持用户手动编辑

#### Scenario: AI 整理按钮

- **WHEN** 用户处于「原始内容」Tab
- **THEN** 底部显示固定按钮「✨ AI 智能整理」
- **AND** 点击按钮自动跳转至「AI 预览」Tab
- **AND** 触发 AI 处理请求

### Requirement: AI 预览 Tab

系统必须（SHALL）在 AI 预览 Tab 中显示 AI 处理后的内容。

#### Scenario: Prompt 设置区

- **WHEN** 用户处于「AI 预览」Tab
- **THEN** 顶部显示可折叠的 Prompt 设置区（默认折叠）
- **AND** 展开后显示当前使用的 Prompt
- **AND** 支持临时修改 Prompt

#### Scenario: 重新生成

- **WHEN** 用户修改了 Prompt 内容
- **THEN** 按钮文案变为 "重新生成"
- **AND** 点击后使用新 Prompt 重新请求 AI

### Requirement: AI 响应状态展示

系统必须（SHALL）正确展示 AI 响应的不同状态。

#### Scenario: Loading 状态

- **WHEN** AI 请求已发送但尚未收到响应
- **THEN** 预览区显示骨架屏或 Loading Spinner

#### Scenario: Streaming 状态

- **WHEN** AI 开始返回流式响应
- **THEN** 预览区以打字机效果实时显示 AI 输出
- **AND** 用户可看到内容逐字出现

#### Scenario: 渲染完成状态

- **WHEN** AI 响应完成
- **THEN** 预览区显示完整的 Markdown 渲染结果
- **AND** 支持加粗、列表、代码块语法高亮

#### Scenario: 错误状态

- **WHEN** AI 请求失败（如网络错误、API Key 无效）
- **THEN** 显示具体错误信息
- **AND** 提供重试按钮
