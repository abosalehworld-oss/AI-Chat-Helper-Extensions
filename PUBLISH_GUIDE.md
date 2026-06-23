# 🚀 دليل نشر AI Chat Helper على Chrome Web Store

## المتطلبات الأولية

> **مهم:** تحتاج حساب Google Developer ورسوم تسجيل **$5 مرة واحدة فقط**.

---

## الخطوة 1 — تجهيز حساب المطور

1. اذهب إلى https://chrome.google.com/webstore/devconsole
2. سجّل دخول بحساب Google
3. ادفع رسوم التسجيل **$5** (مرة واحدة فقط طول العمر)
4. وافق على Developer Agreement
5. فعّل **Two-Factor Authentication** على حسابك

---

## الخطوة 2 — تجهيز ملف ZIP

شغّل ملف `build.bat` الموجود في المجلد.  
هيطلع ملف في مجلد `dist\`:

```
dist\ai-chat-helper-v1.0.0.zip
```

---

## الخطوة 3 — Assets المطلوبة للمتجر

| الأصل | المقاس | الوصف |
|-------|--------|-------|
| Store Icon | 128×128 PNG | موجودة `icons\icon128.png` |
| Screenshot 1 | 1280×800 px | Popup مع ChatGPT |
| Screenshot 2 | 1280×800 px | Prompt Engineer مفتوح |
| Screenshot 3 | 1280×800 px | التلخيص أو Export |
| Promotional Tile (اختياري) | 440×280 PNG | صورة ترويجية |

> **تلميح:** خد screenshots عبر Chrome → F12 → Ctrl+Shift+M (Device Mode) → اختر 1280×800

---

## الخطوة 4 — رفع الإضافة

1. اذهب لـ https://chrome.google.com/webstore/devconsole
2. اضغط **"New Item"**
3. ارفع ملف ZIP من مجلد `dist\`
4. Chrome هيقرأ manifest.json تلقائياً

---

## الخطوة 5 — إعداد Store Listing

### Name:
```
AI Chat Helper — Copy & Summarize AI Chats
```

### Short Description (132 حرف كحد أقصى):
```
Copy, summarize & export any AI conversation in one click. Works with ChatGPT, Claude, Gemini & more. 100% local & private.
```

### Detailed Description:
```
AI Chat Helper makes managing your AI conversations effortless.

✦ COPY ENTIRE CONVERSATIONS
Select All and copy your full chat with one click — no more manually selecting line by line.
Formats: Markdown, Plain Text, HTML, JSON.

✦ SMART LOCAL SUMMARIZATION
Get a clear, structured summary of long conversations — entirely on your device. No data sent anywhere.
Lengths: Short, Medium, Long + Key Points + Topics Covered.

✦ EXPORT AS FILE
Download your chat as .md, .txt, .html, or .json file with automatic naming.

✦ PROMPT ENGINEER
Struggling with prompt writing? Our built-in Prompt Engineer rewrites your idea into a
professional, effective prompt using 8 templates:
General · Code · Analyze · Creative · Explain · Compare · Translate · Plan

✦ WORKS EVERYWHERE
ChatGPT · Claude · Google Gemini · Microsoft Copilot · Perplexity
DeepSeek · Grok · Poe · HuggingChat · and any AI chat website.

✦ 100% PRIVATE & SECURE
• Zero data collection — nothing leaves your device
• No API keys required
• Works offline for summarization
• Manifest V3 compliant
```

### Category:
```
Productivity
```

---

## الخطوة 6 — Privacy Practices

في قسم **"Privacy practices"** في الـ Dashboard:

| السؤال | الإجابة |
|--------|---------|
| Does your extension collect user data? | **No** |
| Do you use data for advertising? | **No** |
| Do you share data with third parties? | **No** |

### رابط Privacy Policy:
استضف ملف `privacy-policy.html` مجاناً على GitHub Pages أو Netlify، ثم ضع الرابط هنا.

مثال:
```
https://yourusername.github.io/ai-chat-helper/privacy-policy.html
```

---

## الخطوة 7 — Permissions Justification

| Permission | Justification (انسخ والصق) |
|------------|---------------------------|
| `activeTab` | Required to read the chat conversation from the currently active AI platform tab when the user clicks the extension button. No background access is needed. |
| `scripting` | Required to inject the content extraction script into the active tab when the user requests a copy or summary operation. |
| `storage` | Required to save the user's preferences (preferred format, summary length, UI settings) locally on their device using chrome.storage.local. |

---

## الخطوة 8 — Submit for Review

1. اضغط **"Submit for review"**
2. وقت المراجعة: **1–3 أيام عمل** عادةً
3. هتوصلك إيميل بالنتيجة

---

## ✅ Checklist قبل الرفع

- [ ] `manifest_version: 3` في manifest.json
- [ ] لا `<all_urls>` في الصلاحيات
- [ ] لا `eval()` في الكود
- [ ] لا Remote Code execution
- [ ] Privacy Policy على رابط عام يعمل
- [ ] الأيقونات بالأحجام 16 + 48 + 128 موجودة
- [ ] Screenshots جاهزة (على الأقل 1 صورة)
- [ ] الـ ZIP لا يحتوي ملفات `.bat` أو `.ps1` أو `.md`
- [ ] `_locales` موجود مع `en` و `ar`
- [ ] الوصف صادق ومطابق للوظيفة الفعلية

---

## أسباب الرفض الشائعة وحلولها

| السبب | الحل الجاهز |
|-------|------------|
| Missing privacy policy | ✅ `privacy-policy.html` موجود، ارفعه على GitHub Pages |
| Excessive permissions | ✅ فقط 3 permissions ضرورية فقط |
| Misleading description | ✅ الوصف دقيق ومطابق للوظيفة |
| No permission justification | ✅ استخدم نصوص الجدول في الخطوة 7 |
| Broken functionality | ✅ اختبر الإضافة محلياً (Load unpacked) قبل الرفع |
| Remotely hosted code | ✅ كل الكود محلي، لا CDN لا eval() |

---

## 💡 نصائح لزيادة التحميلات بعد النشر

1. **Screenshots جذابة** — أهم عامل للتحميل من المتجر
2. **Keywords في الوصف:** copy chat, summarize AI, export conversation, prompt engineering
3. **اطلب reviews** من أصدقاء أو مجموعات WhatsApp
4. **شارك الإضافة** على:
   - Reddit: r/ChatGPT · r/ClaudeAI · r/artificial
   - Twitter/X مع هاشتاق #ChatGPT #AI
   - مجموعات Facebook للمهتمين بالـ AI

---

## تحديث الإضافة مستقبلاً

عند إضافة ميزات جديدة:

1. غيّر رقم version في `manifest.json`:
   ```json
   "version": "1.1.0"
   ```
2. شغّل `build.bat` مرة ثانية → هيطلع ZIP جديد
3. ارفع الـ ZIP الجديد على Developer Dashboard
4. اضغط **"Submit for review"**

---

*آخر تحديث: يونيو 2026 — AI Chat Helper v1.0.0*
