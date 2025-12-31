<p align="center">
  <img src="public/icon/128.png" alt="ObsiClip Logo" width="128" height="128">
</p>

<h1 align="center">ObsiClip</h1>

<p align="center">
  <strong>AI-Powered Web Clipper for Obsidian</strong>
</p>

<p align="center">
  Stop hoarding, start learning. Auto-extract content, AI-summarize (TL;DR), auto-categorize, and save clean Markdown to Obsidian in one click.
</p>

<p align="center">
  <a href="README_zh-CN.md">中文文档</a>
</p>

---

## Why ObsiClip?

Are you a digital hoarder? Clipping articles everywhere, only to end up with a messy Obsidian vault full of unread, poorly formatted web pages?

**Clipping shouldn't be hoarding junk — it should be distilling knowledge.**

ObsiClip is an AI-powered web clipper designed specifically for Obsidian. It doesn't just copy and paste — it uses AI to **"read"** the article for you and organize it into a well-structured note.

## Features

### AI-Powered Summarization (TL;DR)

**Too long; didn't read?** No problem, AI reads it for you.

When clipping, AI automatically extracts the core insights and generates a concise **TL;DR summary** at the top of your note. Recall a 5,000-word article in 50 words when reviewing your notes later.

### AI Auto-Categorization

**Say goodbye to manual folder organization.**

ObsiClip intelligently analyzes the content and suggests relevant tags (e.g., `#programming`, `#finance`, `#health`) and folder paths. Your knowledge base stays organized, and searching is no longer like finding a needle in a haystack.

### Smart Content Extraction

**Keep the essence, discard the noise.**

Built-in intelligent extraction engine automatically strips ads, sidebars, popups, and promotional links. You always get clean, well-formatted Markdown content.

### More Features

- **Bring Your Own Key**: Configure your own API keys for OpenAI, Claude, DeepSeek, Gemini, and more. Your data privacy stays in your hands.
- **Deep Obsidian Integration**: Save directly to your local Obsidian vault via URI scheme — no manual export/import needed.
- **Fully Customizable**: Not satisfied with the AI summary? Customize the prompt to create your personal AI assistant.

## Use Cases

- **Technical Learning**: Clip tutorials with auto-extracted code blocks and summarized key points.
- **Daily Reading**: Quickly archive news and use AI summaries to decide if deep reading is needed.
- **Research**: Auto-capture core arguments and organize into corresponding research topic folders.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/nicepkg/obsiclip.git
cd obsiclip

# Install dependencies
pnpm install

# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox
```

After building, load the extension from `.output/chrome-mv3` (Chrome) or `.output/firefox-mv2` (Firefox) in your browser's extension management page.

### From Browser Store

Coming soon...

## Configuration

1. Click the ObsiClip extension icon to open the side panel
2. Go to Settings to configure:
   - **AI Provider**: Choose your preferred AI service (OpenAI, Claude, DeepSeek, Gemini)
   - **API Key**: Enter your API key

## Tech Stack

- [WXT](https://wxt.dev/) - Next-gen Web Extension Framework
- [Vue 3](https://vuejs.org/) - Progressive JavaScript Framework
- [Readability](https://github.com/mozilla/readability) - Content extraction
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

## Acknowledgments

- Inspired by the need for smarter web clipping
- Built with love for the Obsidian community
