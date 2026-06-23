<div align="center">

# ✦ AI Chat Helper

**The smartest Chrome extension for AI power users**

Copy · Summarize · Export · Engineer Prompts — across 10+ AI platforms

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=for-the-badge&logo=google&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)](LICENSE)
[![100% Local](https://img.shields.io/badge/Privacy-100%25%20Local-10b981?style=for-the-badge)](privacy-policy.html)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **Copy All** | Copy the full conversation in Markdown, Plain Text, HTML, or JSON — one click |
| 📝 **Summarize** | Local AI summarization — short / medium / long — works 100% offline |
| ⬇ **Export** | Download your conversation as a formatted file |
| ✦ **Prompt Engineer** | Transform any rough idea into a Claude-quality structured prompt in 8 modes |
| 🧠 **Use Context** | Reads the last AI response on the page and pre-fills your prompt idea |
| 🗓 **Prompt History** | Last 20 generated prompts saved locally — click to reload any |
| 🖱 **Right-Click Menu** | Select any text → right-click → "✦ Improve with Prompt Engineer" |
| 🌍 **Arabic + English** | Full RTL support, dynamic language switching, Claude-quality Arabic prompts |

---

## 🤖 Supported Platforms

| Platform | Status |
|----------|--------|
| ChatGPT (chatgpt.com) | ✅ Full support |
| Claude (claude.ai) | ✅ Full support |
| Google Gemini | ✅ Full support |
| Microsoft Copilot | ✅ Full support |
| Perplexity | ✅ Full support |
| DeepSeek | ✅ Full support |
| Grok (x.com) | ✅ Full support |
| Poe | ✅ Full support |
| HuggingChat | ✅ Full support |
| You.com | ✅ Full support |

---

## ✦ Prompt Engineer — 8 Modes

Every mode uses professional prompt engineering techniques:
**Role definition → Chain-of-Thought → Structured output → Self-verification**

| Mode | Icon | Best For |
|------|------|----------|
| General | 🎯 | Any open-ended task |
| Code | 💻 | Production-quality code generation |
| Analyze | 🔍 | Deep structured analysis |
| Creative | ✨ | Writing, storytelling, campaigns |
| Explain | 📖 | Teaching any topic at any level |
| Compare | ⚖️ | Decision-making between options |
| Debug | 🐛 | Root-cause debugging |
| Plan | 📋 | SMART goals & phased action plans |
| Translate | 🌐 | Cultural adaptation, not just words |

**Response language:** Force the AI to respond in English (save tokens) or Arabic — your choice per prompt.

---

## 🚀 Install in 30 Seconds (Developer Mode)

```
1. Download or clone this repository
2. Open Chrome → chrome://extensions
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select this project folder
6. ✅ The extension appears in your toolbar
```

### Or build a Store-ready ZIP:

```powershell
# Windows PowerShell
.\build.ps1
# → dist/ai-chat-helper-v1.0.0.zip
```

---

## 🏗 Project Structure

See **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** for a full architecture reference.

Quick overview:

```
├── manifest.json           # MV3 manifest
├── background/
│   └── service-worker.js   # Message router, context menu
├── popup/
│   ├── popup.html/css/js   # Extension popup UI
├── content/
│   ├── content.js          # Chat extraction engine
│   └── prompt-engineer.js  # Floating prompt overlay
├── summarizer/
│   └── summarizer.js       # Local summarization (no API)
└── _locales/en+ar/         # i18n strings
```

---

## 🔒 Privacy & Security

- ❌ **Zero data sent to any server** — everything runs locally in your browser
- ❌ **No eval()** — no dynamic code execution
- ❌ **No analytics, no tracking, no ads**
- ✅ **Manifest V3** — Chrome's most secure extension standard
- ✅ **Open source** — audit every line yourself

---

## 🛠 Development

```powershell
# Verify project structure & manifest
.\verify.ps1

# Regenerate icons from source image
# Place icon_source.png (>=128px) in project root
.\create_icons.ps1

# Build Store-ready ZIP
.\build.ps1
```

**No npm, no webpack, no build pipeline.** Pure vanilla JS — open any file and start editing.

---

## 📁 For AI Assistants

Read **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** first.
It contains: full architecture, data flow diagrams, module descriptions, security model, and known quirks.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

Please read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) before contributing.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">

Made with ❤️ for AI power users worldwide

**[⬆ Back to top](#-ai-chat-helper)**

</div>
