# AI Chat Helper — Project Structure Reference
> One-glance guide for AI assistants and developers joining this project.
> Read this file FIRST before touching any code.

---

## 📦 What This Is

A **Chrome Extension (Manifest V3)** that works on all major AI chat platforms.
It gives users 4 superpowers on any AI chat page:

| Feature | Description |
|---------|-------------|
| 📋 **Copy** | Copy entire conversation as Markdown / Plain Text / HTML / JSON |
| 📝 **Summarize** | Local extractive summarization — zero API calls, works offline |
| ⬇ **Export** | Download conversation as a file |
| ✦ **Prompt Engineer** | Transform any idea into a Claude-quality structured prompt |

**Supported platforms:** ChatGPT, Claude, Gemini, Copilot, Perplexity, DeepSeek, Grok, Poe, HuggingChat, You.com

**Languages:** English + Arabic (full RTL, dynamic switching, persisted in chrome.storage)

---

## 🗂 Directory Tree

```
بروجكت اكستنشن Ai/
│
├── manifest.json               ← MV3 manifest — permissions, host_permissions, CSP
│
├── background/
│   └── service-worker.js       ← SW: message router, context menu, scripting.executeScript
│
├── popup/
│   ├── popup.html              ← Extension popup (380px wide)
│   ├── popup.css               ← Dark glassmorphism UI, RTL support
│   └── popup.js                ← All popup logic: copy, summarize, export, i18n, lang toggle
│
├── content/
│   ├── content.js              ← Injected into AI pages: extracts messages, formats output
│   ├── content.css             ← FAB button styles, toast notifications
│   └── prompt-engineer.js      ← Floating overlay: Prompt Engineer panel (self-contained IIFE)
│
├── summarizer/
│   └── summarizer.js           ← Local extractive summarizer (EN + AR, no API)
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── _locales/
│   ├── en/messages.json        ← English i18n strings (manifest-level)
│   └── ar/messages.json        ← Arabic i18n strings (manifest-level)
│
├── privacy-policy.html         ← Required for Chrome Web Store listing
│
├── build.ps1                   ← Builds dist/ai-chat-helper-v1.0.0.zip (Store-ready)
├── verify.ps1                  ← Verifies file structure + validates manifest.json
├── create_icons.ps1            ← Resizes icon_source.png → icon16/48/128.png
│
├── PROJECT_STRUCTURE.md        ← YOU ARE HERE
├── README.md                   ← User-facing install guide
└── PUBLISH_GUIDE.md            ← Chrome Web Store submission checklist
```

---

## 🧠 Architecture

### Data Flow

```
User clicks popup button
        ↓
popup.js  →  chrome.runtime.sendMessage  →  service-worker.js
                                                    ↓
                                       chrome.scripting.executeScript
                                                    ↓
                                            content.js (injected)
                                       window.__aiChatHelper.extract()
                                                    ↓
                                         messages[] returned to SW
                                                    ↓
                                           SW returns to popup.js
                                                    ↓
                                    popup.js formats + copies/exports
```

### Key Modules

| File | Key Export | Purpose |
|------|-----------|---------|
| `content.js` | `window.__aiChatHelper` | `.extract()` → structured messages, `.getFormattedText(fmt)` |
| `prompt-engineer.js` | `window.__aiChatHelperPromptEngineer` | `.toggle()` / `.isOpen()` — IIFE, self-contained |
| `summarizer.js` | `window.AIChatSummarizer` | `.summarize(messages, options)` |
| `service-worker.js` | message switch | Handles: PING, INJECT_CONTENT_SCRIPT, EXTRACT_CHAT, GET_FORMATTED_TEXT, TOGGLE_FAB, SAVE_SETTINGS, GET_SETTINGS, CHECK_PLATFORM, OPEN_PROMPT_ENGINEER |
| `popup.js` | — | Coordinates UI ↔ SW, i18n (EN/AR), platform detection, copy/summarize/export |

---

## 🌐 Platform Detection

Defined in `popup.js` as `PLATFORMS[]` array. Each entry:
```javascript
{ id, name, icon, pattern: /regex/ }
```
Service worker has a mirror `platforms` object in `handleCheckPlatform()`.

Detection order: URL regex match → `setPlatformState('detected'|'unsupported'|'unknown')`

---

## 🌍 Internationalization (i18n)

**Two-layer system:**

1. **Manifest-level** (`_locales/`) — extension name, description (Chrome handles these)
2. **Runtime i18n** (`popup.js` `TRANSLATIONS` object + `prompt-engineer.js` `data-en`/`data-ar` attributes)

`uiLang` is persisted in `chrome.storage.local`.
RTL is applied via `document.documentElement.dir` + `.ach-rtl` CSS class on the overlay.
`chrome.storage.onChanged` listener in `prompt-engineer.js` updates the overlay live when language changes in popup.

---

## ✦ Prompt Engineer — 8 Modes

All templates in `prompt-engineer.js` → `PROMPT_TEMPLATES` object:

| Key | Mode | Persona |
|-----|------|---------|
| `general` | General | Advanced AI assistant — Chain-of-Thought |
| `code` | Code | Senior software engineer, 15+ yrs |
| `analysis` | Analyze | Senior analyst — structured reasoning |
| `creative` | Creative | World-class creative director |
| `explain` | Explain | Best teacher in the world |
| `compare` | Compare | Decision-making expert |
| `debug` | Debug | Senior debugging detective |
| `plan` | Plan | Strategic planning expert |
| `translate` | Translate | Cultural adaptation expert |

Each template uses: Role definition → Chain-of-Thought → Structured output → Self-verification.

**Output language control:** Appends `## Language` section to force EN or AR response.

**New features:**
- 🧠 **Use Context** — reads last AI response from page DOM, pre-fills idea field
- 🗓 **History** — last 20 generated prompts, saved in `chrome.storage.local.promptHistory`
- Right-click any text on an AI page → "✦ Improve with Prompt Engineer"

---

## 🔒 Security Model

- **No eval()** anywhere
- **No remote code** — all JS is bundled locally
- **No data leaves the browser** — zero external API calls
- `content_security_policy` in manifest: `script-src 'self'; object-src 'self'`
- Service worker validates `sender.id === chrome.runtime.id` on every message
- Settings whitelist: only known keys accepted in `handleSaveSettings()`

---

## 📋 Chrome Permissions Used

| Permission | Why |
|-----------|-----|
| `activeTab` | Read current tab URL for platform detection |
| `storage` | Persist settings, language, prompt history |
| `scripting` | Inject content.js + prompt-engineer.js into AI pages |
| `contextMenus` | Right-click "Improve with Prompt Engineer" on selected text |

---

## 🔧 Build System

```powershell
# Build ZIP for Chrome Web Store
.\build.ps1          # → dist/ai-chat-helper-v1.0.0.zip

# Verify project structure
.\verify.ps1

# Regenerate icons from source PNG
# Place icon_source.png (>=128px) in project root, then:
.\create_icons.ps1
```

Build excludes: `*.ps1`, `*.bat`, `*.md`, `dist/`, `$src/`, `icon_source.png`

---

## ⚠️ Known Quirks & Gotchas

1. **Service Worker wakeup** — MV3 SW can go dormant. Popup sends a `PING` before every critical call with retry logic.
2. **React sites (ChatGPT)** — textarea value must be set via React Fiber internal setter (`setReactValue()`), not just `el.value =`
3. **prompt-engineer.js is an IIFE** — It re-injects on every click from SW. The `window.__aiChatHelperPromptEngineer` guard prevents duplicate overlays. The storage listener is registered only once via `_langListenerAdded` flag.
4. **Arabic folder name** — The workspace path contains Arabic characters. All scripts use `$PSScriptRoot` to avoid encoding issues on Windows.
5. **Context menu** — Only appears on supported AI platform URLs (filtered via `documentUrlPatterns`). Right-click + select text → "✦ Improve with Prompt Engineer".

---

## 🚀 Roadmap (Next Features)

- [ ] Keyboard shortcut `Alt+P` → open Prompt Engineer instantly
- [ ] Token counter (estimate tokens before sending)
- [ ] Custom user templates (save your own prompt templates)
- [ ] Multi-turn context (prompt builder reads full conversation)
- [ ] Team Templates / B2B sharing
