# Spec Delta: ai-processing

## MODIFIED Requirements

### Requirement: AI 整理 Tab 交互优化

系统必须（SHALL）提供优化的 AI 整理 Tab 交互体验。

#### Scenario: Tab 名称显示
- **WHEN** 用户查看侧边栏 Tab 切换区域
- **THEN** 显示"AI 整理"而非"AI 预览"

#### Scenario: 流式内容渲染
- **WHEN** AI 开始返回处理结果
- **THEN** 系统使用 markstream-vue 进行流式 Markdown 渲染
- **AND** 用户可以实时看到内容逐步显示

#### Scenario: 渐进式信息展示
- **WHEN** AI 流式返回内容
- **THEN** AI 使用 YAML frontmatter + Markdown 格式输出
- **AND** 系统检测到 frontmatter 结束（第二个 `---`）后解析元信息
- **AND** 先显示整理后的标题、分类和摘要
- **AND** 正文部分直接流式渲染

## REMOVED Requirements

### Requirement: AI 自动生成 Tags

~~系统应该（SHOULD）由 AI 自动生成相关标签。~~

#### Scenario: Tags 生成（已移除）
- ~~**WHEN** AI 处理完成~~
- ~~**THEN** 返回 3-5 个自动生成的标签~~

## MODIFIED Requirements

### Requirement: 保存配置区域简化

系统必须（SHALL）提供简化的保存配置区域。

#### Scenario: Vault 输入框移除
- **WHEN** 用户查看底部保存配置区域
- **THEN** 不显示 Vault 输入框
- **AND** 仅显示文件夹路径和标签输入框
