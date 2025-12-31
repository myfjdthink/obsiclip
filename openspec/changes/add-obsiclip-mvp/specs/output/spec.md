## ADDED Requirements

### Requirement: Obsidian 保存配置

系统必须（SHALL）允许用户配置 Obsidian 保存路径。

#### Scenario: 配置 Vault 名称

- **WHEN** 用户有多个 Obsidian Vault
- **THEN** 可在输入框中指定目标 Vault 名称
- **AND** 若只有一个 Vault 可留空

#### Scenario: 配置文件夹路径

- **WHEN** 用户需要指定保存位置
- **THEN** 提供文件夹路径下拉框
- **AND** 记录最近使用的 5 个路径
- **AND** 支持手动输入新路径

#### Scenario: 配置标签

- **WHEN** 用户需要为笔记添加标签
- **THEN** 提供 Tags 输入框
- **AND** 支持以逗号分隔多个标签

### Requirement: 保存到 Obsidian

系统必须（SHALL）支持通过 URI Scheme 保存内容到 Obsidian。

#### Scenario: 点击保存按钮

- **WHEN** 用户点击「保存到 Obsidian」主按钮
- **THEN** 系统构建 Obsidian URI：`obsidian://new?vault=xxx&file=path/to/title&content=encoded_text`
- **AND** 触发浏览器打开外部协议
- **AND** Obsidian 应用被唤起并创建新笔记

#### Scenario: 内容编码

- **WHEN** 构建 Obsidian URI
- **THEN** 笔记内容必须进行 URL 编码
- **AND** 特殊字符正确转义

### Requirement: 备选保存方式

系统必须（SHALL）提供多种备选保存方式。

#### Scenario: 显示副菜单

- **WHEN** 用户点击保存按钮右侧的三角形
- **THEN** 展开副菜单显示备选保存选项

#### Scenario: 保存为 .md 文件

- **WHEN** 用户选择「保存为 .md 文件」
- **THEN** 系统调用 Chrome 下载 API
- **AND** 触发浏览器下载 Markdown 文件
- **AND** 文件名为笔记标题

#### Scenario: 复制 Markdown

- **WHEN** 用户选择「复制 Markdown」
- **THEN** AI 处理后的 Markdown 内容写入系统剪贴板
- **AND** 显示 "已复制" 提示

#### Scenario: 复制 HTML

- **WHEN** 用户选择「复制 HTML」
- **THEN** 提取的原始 HTML 内容写入系统剪贴板
- **AND** 显示 "已复制" 提示

### Requirement: 笔记元数据

系统必须（SHALL）在保存时自动添加笔记元数据。

#### Scenario: 添加 Frontmatter

- **WHEN** 保存笔记到 Obsidian
- **THEN** 笔记顶部自动添加 YAML Frontmatter
- **AND** 包含 source（原链接）、clipped_at（剪藏时间）字段

#### Scenario: AI 生成的元数据

- **WHEN** AI 处理内容时
- **THEN** AI 可在 Frontmatter 中添加 author、tags 等字段
- **AND** 这些字段被保留在最终输出中
