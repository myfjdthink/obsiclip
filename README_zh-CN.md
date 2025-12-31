<p align="center">
  <img src="public/icon/128.png" alt="ObsiClip Logo" width="128" height="128">
</p>

<h1 align="center">ObsiClip 黑曜剪</h1>

<p align="center">
  <strong>AI 智能网页剪藏到 Obsidian</strong>
</p>

<p align="center">
  拒绝"收藏夹吃灰"！自动识别网页正文，AI 智能生成摘要 (TL;DR)、自动归类打标签，一键存入 Obsidian。让知识井井有条。
</p>

<p align="center">
  <a href="README.md">English</a>
</p>

---

## 为什么选择 ObsiClip？

你是否也是"松鼠党"？看到好文章就剪藏，结果 Obsidian 里堆满了格式混乱、从未二次阅读的网页副本？

**剪藏不应该是搬运垃圾，而应该是知识的提炼。**

ObsiClip 是专为 Obsidian 打造的 AI 智能剪藏助手。它不只是简单的"复制粘贴"，而是利用 AI 帮你**"读完"**文章，并整理成结构清晰的笔记。

## 核心功能

### AI 自动汇总 (TL;DR)

**太长不看？** 没关系，AI 替你先看。

在剪藏的同时，AI 会自动提炼文章的核心观点，在笔记开头生成一份精简的 **"内容摘要" (TL;DR)**。让你在回顾笔记时，通过 50 字就能回想起 5000 字的长文重点。

### AI 自动分类

**告别手动整理文件夹的痛苦。**

ObsiClip 会根据文章内容，智能分析其领域（如：`#编程技术`、`#投资理财`、`#健康管理`），并自动生成关联标签和建议的文件夹路径。让你的知识库从此井井有条，检索不再是大海捞针。

### 智能正文提取

**只取精华，去其糟粕。**

内置智能提取引擎，自动剥离网页中的广告、侧边栏、弹窗和推广链接。你得到的永远是清爽、干净、格式完美的 Markdown 正文。

### 更多功能

- **自带 API Key**：支持配置 OpenAI / Claude / DeepSeek / Gemini 等自定义 API Key，数据隐私完全掌握在自己手中。
- **Obsidian 深度集成**：通过 URI Scheme 直接唤起本地软件保存，无需手动导出导入。
- **完全自定义**：觉得 AI 总结得不对味？你可以随时修改 Prompt，打造你的专属 AI 秘书。

## 使用场景

- **技术学习**：剪藏教程时，自动提取代码块，并总结技术要点。
- **每日阅读**：快速归档新闻，通过 AI 摘要决定是否需要深读。
- **论文资料**：自动抓取核心论点，归类到对应的研究课题文件夹。

## 安装

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/nicepkg/obsiclip.git
cd obsiclip

# 安装依赖
pnpm install

# 构建 Chrome 版本
pnpm build

# 构建 Firefox 版本
pnpm build:firefox
```

构建完成后，在浏览器扩展管理页面加载 `.output/chrome-mv3`（Chrome）或 `.output/firefox-mv2`（Firefox）目录。

### 从浏览器商店安装

即将上线...

## 配置

1. 点击 ObsiClip 扩展图标打开侧边栏
2. 进入设置页面配置：
   - **AI 服务商**：选择你的 AI 服务（OpenAI、Claude、DeepSeek、Gemini）
   - **API Key**：输入你的 API 密钥

## 技术栈

- [WXT](https://wxt.dev/) - 新一代 Web 扩展框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Readability](https://github.com/mozilla/readability) - 正文提取
- [Turndown](https://github.com/mixmark-io/turndown) - HTML 转 Markdown

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

[MIT](LICENSE)

## 致谢

- 灵感源于对更智能网页剪藏的追求
- 为 Obsidian 社区倾心打造
