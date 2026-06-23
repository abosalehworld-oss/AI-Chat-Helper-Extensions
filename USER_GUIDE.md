# 📖 دليل استخدام إضافة AI Chat Helper — كل المميزات

> **اقرأ ده قبل ما تشتغل على الكود** — بيشرح كل زرار وكل وظيفة موجودة في الإضافة دلوقتي.

---

## 🧭 الواجهة الرئيسية (Popup)

لما تضغط على أيقونة الإضافة في شريط المتصفح، بيظهر popup عرضه 380px فيه:

```
┌─────────────────────────────────────┐
│ [Logo]  AI Chat Helper    [AR/EN]   │  ← Header + زرار اللغة
│         Copy · Summarize · Prompt   │
├─────────────────────────────────────┤
│ 🟢 ChatGPT                          │  ← Platform Badge
├─────────────────────────────────────┤
│ 📋 Copy All Messages                │  ← كارت النسخ
│ [Markdown] [Plain Text] [HTML] [JSON]│
│ [     Copy All Messages     ]        │
├─────────────────────────────────────┤
│ 📝 Summarize Conversation           │  ← كارت التلخيص
│ [Short] [Medium] [Long]             │
│ [   Summarize Conversation  ]        │
├─────────────────────────────────────┤
│ ✦ Prompt Engineer           [AI]   │  ← كارت مهندس البرومبت
│ Rewrite your idea into...           │
│ [    Open Prompt Engineer   ]        │
├─────────────────────────────────────┤
│ ⬇ Export Chat                       │  ← كارت التصدير
│ [.md] [.txt] [.html] [.json]        │
│ [       ⬇ Download File     ]        │
├─────────────────────────────────────┤
│ — Messages  — Words  — Characters   │  ← Stats Bar
├─────────────────────────────────────┤
│ ⚙ Settings                    ▾    │  ← الإعدادات (قابلة للطي)
├─────────────────────────────────────┤
│ v1.0.0  ·  🔒 100% Local & Private  │  ← Footer
└─────────────────────────────────────┘
```

---

## ميزة 1: 🌍 تغيير اللغة (AR / EN)

**الزرار:** `AR / EN` في أعلى يمين الهيدر

**بيعمل إيه:**
- يغير واجهة الإضافة كاملة من إنجليزي ← عربي أو العكس
- يطبّق RTL تلقائياً على كل العناصر لما تختار عربي
- بيحفظ اختيارك في `chrome.storage.local` (مش بيتنسى)
- مهندس البرومبت (الـ overlay) بيتحدث لحظياً من غير ما تعمل reload

**التأثير على مهندس البرومبت:**
- أسماء الأوضاع بتترجم (General ← عام، Code ← برمجة، إلخ)
- placeholder الـ textarea بيتغير للعربي
- نصوص الأزرار كلها بتتغير

---

## ميزة 2: 🟢 كشف المنصة (Platform Badge)

**المكان:** بار ملون تحت الهيدر مباشرة

**بيعمل إيه:**
- بيكشف تلقائياً إنت على أنهي موقع AI
- بيغير لون الـ badge:
  - 🟢 **أخضر** = منصة مدعومة ومعروفة
  - 🟡 **أصفر** = صفحة مش معروفة
  - 🔴 **أحمر** = مش على موقع AI

**المنصات المعروفة (10):**

| المنصة | الرابط |
|--------|--------|
| 🤖 ChatGPT | chatgpt.com / chat.openai.com |
| 🟠 Claude | claude.ai |
| 💎 Gemini | gemini.google.com |
| 🪟 Copilot | copilot.microsoft.com |
| 🔍 Perplexity | perplexity.ai |
| 🌊 DeepSeek | chat.deepseek.com |
| ✖ Grok | grok.com / x.com/i/grok |
| 🐦 Poe | poe.com |
| 🤗 HuggingChat | huggingface.co/chat |
| 🔵 You.com | you.com |

---

## ميزة 3: 📋 نسخ المحادثة (Copy All)

**الزرار:** `Copy All Messages` في أول كارت

### اختيار الفورمات (4 خيارات):

| الفورمات | بيتنسخ إزاي | أحسن للـ |
|---------|-------------|---------|
| **Markdown** | `## User\n` + `## Assistant\n` + code blocks محفوظة | Notion، Obsidian، GitHub |
| **Plain Text** | 👤 User: ... / 🤖 Assistant: ... | أي مكان |
| **HTML** | HTML كامل مع styles | مواقع، بلوجات |
| **JSON** | `{platform, messages[], stats}` | Developers، تحليل البيانات |

**بعد الضغط:**
- بيحقن `content.js` في الصفحة (أول مرة بس)
- بيستخرج كل الرسائل بـ selectors محددة لكل منصة
- بيكوبي في الـ clipboard
- بيظهر ✅ تأكيد
- الـ Stats Bar بتتحدث: عدد الرسائل، الكلمات، الأحرف

---

## ميزة 4: 📝 تلخيص المحادثة (Summarize)

**الزرار:** `Summarize Conversation`

### اختيار الطول (3 خيارات):

| الطول | عدد الجمل |
|-------|---------|
| **Short** | 3–5 جمل |
| **Medium** | 7–10 جمل |
| **Long** | 15–20 جمل |

**الخوارزمية (100% محلية — بدون إنترنت):**
1. يجمع ردود الـ assistant
2. يقسّمهم لجمل (يدعم العربي والإنجليزي)
3. يسجّل كل جملة بـ: تردد الكلمات + مكانها + كلمات مفاتيح (خلاصة، conclusion، المهم...)
4. يختار أفضل N جملة حسب الطول المطلوب
5. **ينتج أيضاً:**
   - 📌 Key Points (أهم 5 نقاط)
   - 🏷 Topics Covered (الموضوعات اللي اتغطت)

**النتيجة بتظهر في:** قسم ملون تحت الـ actions cards مع زرار نسخ الملخص

---

## ميزة 5: ⬇ تصدير المحادثة (Export)

**الزرار:** `⬇ Download File`

### صيغ الملف (4):

| الصيغة | امتداد | مناسب لـ |
|--------|--------|---------|
| Markdown | `.md` | Notion، GitHub، Obsidian |
| Plain Text | `.txt` | أي شيء |
| HTML | `.html` | مواقع، ورد |
| JSON | `.json` | Developers، APIs |

**اسم الملف:** `ai-chat-[platform]-[date].ext`

---

## ميزة 6: ✦ مهندس البرومبت (Prompt Engineer)

**الزرار:** `Open Prompt Engineer` في الكارت الثالث

**بيفتح:** Overlay عائم (420px) فوق صفحة الـ AI مباشرة — مش بيفتح tab جديد

### 🎯 الـ 9 أوضاع (Templates):

| الوضع | الأيقونة | الشخصية المستخدمة | أفضل لـ |
|-------|---------|---------------|---------|
| **General** | 🎯 | Advanced AI Assistant — Chain-of-Thought | أي سؤال عام |
| **Code** | 💻 | Senior Software Engineer 15+ yrs | كتابة كود إنتاج |
| **Analyze** | 🔍 | Senior Analyst — structured reasoning | تحليل عميق |
| **Creative** | ✨ | World-class Creative Director | كتابة، قصص، حملات |
| **Explain** | 📖 | World's best teacher (5 levels) | شرح أي موضوع |
| **Compare** | ⚖️ | Decision-making expert | مقارنة خيارات |
| **Debug** | 🐛 | Senior Debugging Detective | إصلاح كود |
| **Plan** | 📋 | Strategic Planning Expert — SMART | تخطيط مشاريع |
| **Translate** | 🌐 | Cultural Adaptation Expert | ترجمة بمعنى لا كلمات |

### 🌐 اختيار لغة رد الـ AI:

| الخيار | التأثير على البرومبت |
|--------|---------------------|
| **English** | يضيف: `IMPORTANT: You MUST respond entirely in English` |
| **عربي** | يضيف: `IMPORTANT: You MUST respond entirely in Arabic (العربية)` |

**فايدة English للـ Planning/Code:** توفير tokens + دقة أعلى
**فايدة عربي للـ Creative/Explain:** الرد يكون بالعربي مباشرة

### 🧠 زرار "Use Context":

- يقرأ **آخر رد من الـ AI** في الصفحة الحالية
- يملأ تلقائياً خانة الفكرة بـ: `"Based on this AI response, [آخر 300 حرف من الرد]"`
- يدعم: ChatGPT، Claude، Gemini، وأي منصة أخرى (fallback selectors)

### 🗓 زرار "History":

- يعرض **آخر 20 برومبت** اتعملوا
- لكل عنصر: معاينة الفكرة + الوضع المستخدم + التاريخ والوقت
- **كليك على أي عنصر** → يرجّع الفكرة في الخانة ويحدد الوضع الصح
- زرار **Clear** لمسح السجل كله
- السجل محفوظ في `chrome.storage.local.promptHistory`

### 📋 الأزرار بعد توليد البرومبت:

| الزرار | بيعمل إيه |
|--------|---------|
| 📋 Copy | ينسخ البرومبت الناتج للـ clipboard |
| ⬆ Insert | يدخل البرومبت مباشرة في خانة الكتابة في الموقع |

> **Insert** يدعم: React textarea (ChatGPT)، contentEditable (Gemini/Claude)، ProseMirror، Lexical — بـ 3 طرق cascade

---

## ميزة 7: 🖱 Right-Click Menu

**كيفية الاستخدام:**
1. حدد أي نص في صفحة الـ AI
2. اضغط كليك يمين
3. اختر "✦ Improve with Prompt Engineer"

**بيعمل إيه:**
- يفتح مهندس البرومبت تلقائياً
- يملأ خانة الفكرة بالنص اللي حددته
- تقدر تختار الوضع واللغة وتضغط Generate مباشرة

> ⚠️ بيظهر **بس على المنصات المدعومة** — مش على كل الصفحات

---

## ميزة 8: 📊 Stats Bar

**المكان:** بار في أسفل الـ actions cards

بيتحدث تلقائياً بعد أي عملية نسخ/تلخيص:

| الإحصائية | الوصف |
|-----------|-------|
| **Messages** | عدد الرسائل الكلي (User + Assistant) |
| **Words** | عدد الكلمات في المحادثة كلها |
| **Characters** | عدد الأحرف |

---

## ميزة 9: ⚙️ الإعدادات (Settings)

**الوصول:** اضغط على `⚙ Settings` في أسفل الـ popup

### الخيارات:

| الإعداد | الوصف | الافتراضي |
|---------|-------|---------|
| **Floating Button** | يظهر زرار عائم (FAB) في أسفل يمين صفحة الـ AI | OFF |
| **Auto-detect Platform** | يكشف المنصة تلقائياً | ON |

> **Floating Button (FAB):** لما يكون ON، بيظهر زرار صغير دائري في أسفل يمين الصفحة — تضغط عليه ينسخ المحادثة بدون ما تفتح الـ popup

---

## ملخص كل المميزات دفعة واحدة

| # | الميزة | مكانها | وصف سريع |
|---|--------|--------|---------|
| 1 | 🌍 Language Toggle | Header | AR ↔ EN واجهة كاملة |
| 2 | 🟢 Platform Badge | تحت الهيدر | كشف تلقائي للمنصة |
| 3 | 📋 Copy All | كارت 1 | 4 فورمات، clipboard |
| 4 | 📝 Summarize | كارت 2 | تلخيص محلي 3 أطوال |
| 5 | ✦ Prompt Engineer | كارت 3 | 9 أوضاع، EN/AR |
| 6 | ⬇ Export | كارت 4 | تحميل ملف 4 صيغ |
| 7 | 📊 Stats Bar | أسفل الكاردات | رسائل + كلمات + أحرف |
| 8 | 🧠 Use Context | داخل مهندس البرومبت | يقرأ آخر رد AI |
| 9 | 🗓 History | داخل مهندس البرومبت | آخر 20 برومبت |
| 10 | 🖱 Right-Click | صفحة الـ AI | نص محدد ← مهندس البرومبت |
| 11 | ⚙ Settings | أسفل الـ popup | FAB + Auto-detect |
| 12 | 🔒 Privacy | Footer | 100% محلي بدون سيرفر |

---

## 🔜 المميزات اللي جاية (Roadmap)

| الميزة | الأولوية |
|--------|---------|
| ⌨️ Keyboard Shortcut `Alt+P` لفتح مهندس البرومبت | 🔥 عالي |
| 🔢 Token Counter (تقدير عدد الـ tokens قبل الإرسال) | 🟡 متوسط |
| 📂 Custom Templates (قوالب البرومبت بتاعتك) | 🟡 متوسط |
| 👥 Team Templates (مشاركة القوالب مع فريق) | 🟢 منخفض |
