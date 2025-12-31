# Change: 实现 ObsiClip MVP 核心功能

## Why

Obsidian 用户在网页剪藏工作流中缺少一个既能智能提取内容、又能通过 AI 进行结构化整理的工具。现有的剪藏工具要么功能过于简单（仅复制文字），要么存在隐私问题（数据经过第三方服务器）。ObsiClip 旨在通过「用户自带 API Key + 本地处理」的模式，提供高精度、隐私优先的网页剪藏体验。

## What Changes

本次变更为全新项目的 MVP 实现，包含以下核心能力：

- **settings**: LLM 服务配置（API Key、Base URL、模型选择、Prompt 预设）
- **extraction**: 网页内容提取引擎（Readability 自动识别 + 手动选取模式）
- **sidepanel**: 侧边栏交互界面（原始内容编辑、AI 预览、流式输出）
- **output**: 保存与输出功能（Obsidian URI、文件下载、剪贴板复制）

## Impact

- 受影响的规格: 新增 4 个能力规格
- 受影响的代码:
  - `entrypoints/` - 扩展入口点
  - `components/` - UI 组件
  - 新增 content script、background service worker
- 技术栈: Chrome Extension (Manifest V3), WXT, TypeScript, Vue
