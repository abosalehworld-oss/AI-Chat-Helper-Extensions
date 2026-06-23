# 🔄 Monthly Maintenance Prompt — AI Chat Helper Extension
> **Copy this entire prompt and paste it to any AI assistant (Claude, ChatGPT, Gemini)**
> **Do this ONCE PER MONTH to keep the extension working perfectly**

---

## THE PROMPT (copy from here ↓)

```
You are a senior Chrome Extension developer performing a MONTHLY MAINTENANCE REVIEW on the "AI Chat Helper" Chrome Extension (Manifest V3).

## Your Mission
Review the entire codebase, verify it still works on all supported AI platforms, fix any broken selectors, update for Chrome API changes, and ensure zero bugs.

## Step 1: Read the Architecture First
Read these files IN ORDER before touching any code:
1. PROJECT_STRUCTURE.md — full architecture, data flow, module map
2. USER_GUIDE.md — all 12 features and how they work
3. manifest.json — permissions, host_permissions, CSP

## Step 2: Platform Selector Audit (MOST CRITICAL)
AI platforms change their DOM structure frequently. For EACH platform below, open the website and verify that our CSS selectors still match real DOM elements:

### content.js — extractChatGPT()
- Verify: `[data-message-author-role]` still exists on chatgpt.com
- Verify: `[data-testid*="conversation-turn"]` still works
- Verify: `.markdown` class still used for message content
- If ANY selector is broken → update with new working selector

### content.js — extractClaude()
- Verify: `[data-testid="human-turn"]`, `[data-testid="ai-turn"]` on claude.ai
- Verify: `.font-claude-message` still exists
- If broken → find new selectors using browser DevTools

### content.js — extractGemini()
- Verify: `user-query`, `model-response` custom elements on gemini.google.com
- Verify: `message-content` class still exists
- If broken → update

### content.js — extractCopilot()
- Verify: `cib-message-group` on copilot.microsoft.com
- If broken → update

### content.js — extractPerplexity()
- Verify: `.prose` class and answer containers on perplexity.ai
- If broken → update

### prompt-engineer.js — getLastAIResponse()
- Verify all selectors in the selectors array still work
- These must match for the "Use Context" button to work

### prompt-engineer.js — INPUT_SELECTORS (findChatInput)
- Verify `#prompt-textarea` still exists on ChatGPT
- Verify `[data-lexical-editor]` for Claude
- Verify `rich-textarea .ql-editor` for Gemini
- These must match for the "Insert" button to work

## Step 3: Chrome API Compatibility Check
- Check if any `chrome.scripting` APIs have been deprecated
- Check if `chrome.contextMenus` API has changed
- Check if `chrome.storage.local` API has changed
- Check if Manifest V3 has new requirements or deprecations
- Check minimum_chrome_version (currently 116) — update if needed

## Step 4: Security Audit
- Confirm NO eval(), NO new Function(), NO inline scripts
- Confirm NO external API calls or network requests
- Confirm all user input is handled via textContent (not innerHTML)
- Confirm sender.id validation in service-worker.js
- Confirm settings whitelist in handleSaveSettings()
- Check for any new Chrome Web Store policy changes

## Step 5: Performance Check
- Verify scrollToLoadAll() in content.js still works for virtual scrolling
- Check if any platform changed their scrolling mechanism
- Verify no memory leaks in prompt-engineer.js (storage listener registered once)
- Verify no infinite loops or runaway timers

## Step 6: i18n Verification
- Verify TRANSLATIONS object in popup.js has matching keys for EN and AR
- Verify all data-en / data-ar attributes in prompt-engineer.js overlay
- Verify applyLanguage() covers all UI elements
- Verify RTL layout still correct

## Step 7: Build & Test
After ALL fixes:
1. Run: .\verify.ps1
2. Run: .\build.ps1
3. Test on at least 3 platforms: ChatGPT, Claude, Gemini
4. Test: Copy, Summarize, Export, Prompt Engineer (all 4 features)
5. Test: Language toggle AR/EN
6. Test: Right-click menu
7. Test: History save/load
8. Test: Use Context button

## Step 8: Update Files
- Update version in manifest.json if changes were made (e.g., 1.0.1 → 1.0.2)
- Update PROJECT_STRUCTURE.md if architecture changed
- Update USER_GUIDE.md if features changed
- Git commit with message: "Monthly maintenance [MONTH YEAR] — [summary of changes]"

## Output Format
Provide a MAINTENANCE REPORT with:
1. ✅ What's still working perfectly
2. ⚠️ What needed fixing (with before/after code)
3. 🆕 What's new in Chrome/platforms that we should adopt
4. 📋 Recommended improvements for next month

## Rules
- Do NOT add new features unless I ask
- Do NOT change the UI design
- Do NOT remove any existing functionality
- ONLY fix broken things and update selectors
- Keep the extension LIGHT and FAST
- If uncertain about a selector, provide 3 fallback options
```

---

## 📅 When to Run This

| Frequency | What to Check |
|-----------|--------------|
| **Monthly** | Full prompt above — all platforms + all features |
| **After a platform update** | Just Step 2 for that specific platform |
| **After Chrome update** | Just Step 3 — API compatibility |
| **After user reports a bug** | Targeted debugging on the affected feature |

## 🔑 Platforms That Change Most Often

| Platform | Change Frequency | Risk Level |
|----------|-----------------|------------|
| ChatGPT | Every 2-4 weeks | 🔴 High |
| Claude | Every 3-6 weeks | 🟡 Medium |
| Gemini | Every 2-4 weeks | 🔴 High |
| Copilot | Every 1-2 months | 🟡 Medium |
| Perplexity | Every 1-2 months | 🟡 Medium |
| DeepSeek | Rarely | 🟢 Low |
| Others | Varies | 🟢 Low |

## 💡 Pro Tips

1. **ChatGPT & Gemini are the most unstable** — check them first every month
2. **Always test the "Insert" button** — it breaks most often because chat input selectors change
3. **If a selector breaks**, use `data-testid` attributes first (most stable), then ARIA roles, then class names (least stable)
4. **Keep 3 fallback levels** for every critical selector
5. **Save this file** — it's your insurance policy for the extension working forever
