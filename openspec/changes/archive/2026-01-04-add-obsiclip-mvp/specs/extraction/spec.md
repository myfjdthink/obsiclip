## ADDED Requirements

### Requirement: 自动内容识别

系统必须（SHALL）在激活时自动识别网页正文内容。

#### Scenario: 激活插件提取内容

- **WHEN** 用户点击扩展图标激活插件
- **THEN** 系统自动运行 Readability.js 算法识别正文
- **AND** 在网页上覆盖蓝色透明遮罩（`rgba(0, 122, 255, 0.1)`）标识提取区域
- **AND** 提取区域边缘显示虚线边框

#### Scenario: 内容转换为 Markdown

- **WHEN** 正文内容被识别
- **THEN** 系统使用 Turndown 将 HTML 转换为 Markdown
- **AND** 转换结果显示在侧边栏的原始内容区域

#### Scenario: 提取耗时要求

- **WHEN** 系统执行 Readability 识别
- **THEN** 识别耗时应小于 1 秒

### Requirement: 手动选取模式

系统必须（SHALL）提供手动选取模式，允许用户调整自动识别的选区。

#### Scenario: 进入手动选取模式

- **WHEN** 用户点击侧边栏的 "手动调整" 开关
- **THEN** 系统进入手动选取模式
- **AND** 鼠标悬停在 DOM 节点上时显示黄色高亮

#### Scenario: 添加选区

- **WHEN** 用户处于手动选取模式
- **AND** 点击未选中的 DOM 区域
- **THEN** 该区域被加入选区（显示蓝色高亮）
- **AND** 选区内容同步更新到侧边栏

#### Scenario: 移除选区

- **WHEN** 用户处于手动选取模式
- **AND** 点击已选中的蓝色区域
- **THEN** 该区域从选区中移除
- **AND** 选区内容同步更新到侧边栏

### Requirement: 选区层级调整

系统必须（SHALL）提供选区层级微调功能。

#### Scenario: 扩大选区范围

- **WHEN** 用户悬停在选中区域
- **AND** 点击悬浮气泡中的 "▲ 扩大范围 (Parent)" 按钮
- **THEN** 选区扩展到当前元素的父级节点

#### Scenario: 缩小选区范围

- **WHEN** 用户悬停在选中区域
- **AND** 点击悬浮气泡中的 "▼ 缩小范围 (Child)" 按钮
- **THEN** 选区缩小到当前元素的第一个子节点

### Requirement: 元数据提取

系统必须（SHALL）自动提取网页的元数据信息。

#### Scenario: 提取页面标题

- **WHEN** 内容被提取
- **THEN** 系统自动提取页面标题（`<title>` 或 `og:title`）
- **AND** 标题显示在侧边栏顶部，支持用户编辑

#### Scenario: 提取页面来源

- **WHEN** 内容被提取
- **THEN** 系统记录当前页面的 URL 作为来源信息
