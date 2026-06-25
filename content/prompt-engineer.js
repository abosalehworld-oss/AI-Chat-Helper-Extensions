'use strict';

/**
 * AI Chat Helper — Prompt Engineer Overlay
 * ==========================================
 * Injects a floating panel near the chat input box on AI platforms.
 * Rewrites user ideas into professional, production-quality prompts using
 * advanced prompt engineering: Chain-of-Thought, Role-Context-Constraints,
 * Self-Verification, and structured output directives.
 *
 * Security: No eval(), no external calls, no DOM mutations outside our own elements.
 */

(function () {
  // Avoid double injection — toggle instead
  if (window.__aiChatHelperPromptEngineer && window.__aiChatHelperPromptEngineer.isOpen()) {
    window.__aiChatHelperPromptEngineer.toggle();
    return;
  }

  // Storage listener registered ONCE per page load (not per open)
  var _langListenerAdded = false;
  function _ensureLangListener() {
    if (_langListenerAdded) return;
    _langListenerAdded = true;
    try {
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local' && changes.uiLang) {
          var ov = document.getElementById('ach-prompt-overlay');
          if (ov) applyOverlayLang(ov, changes.uiLang.newValue);
        }
      });
    } catch (_) {}
  }

  /* ══════════════════════════════════════════════════════════
     ADVANCED PROMPT TEMPLATES
     These use professional-level prompt engineering techniques:
     1. Precise role definition with expertise boundaries
     2. Chain-of-Thought reasoning instructions
     3. Self-verification / self-critique steps
     4. Structured output with clear formatting
     5. Constraint framing to prevent hallucination
     ══════════════════════════════════════════════════════════ */

  const PROMPT_TEMPLATES = {
    general: {
      label: 'General',
      labelAr: '\u0639\u0627\u0645',
      icon: '\uD83C\uDFAF',
      descEn: 'Ask anything — the AI will think step-by-step and give structured answers.',
      descAr: 'اسأل أي سؤال — الـ AI هيفكر خطوة بخطوة ويديك إجابة منظمة.',
      exampleEn: 'e.g. "What are the best strategies to grow a SaaS business?"',
      exampleAr: 'مثال: "إيه أفضل طريقة لزيادة مبيعات متجري الإلكتروني؟"',
      build: (idea, lang) => {
        return `You are an advanced AI assistant. Follow this protocol precisely:

## Task
${idea}

## Execution Protocol
1. **Think step-by-step** before answering — break the problem into components
2. **State your assumptions** explicitly if the request is ambiguous
3. **Use structured formatting**: headers, bullet points, code blocks, tables where appropriate
4. **Provide concrete examples** — not generic advice
5. **Self-verify**: Before finishing, review your response for accuracy and completeness

## Constraints
- If you are uncertain about a fact, say so explicitly rather than guessing
- Prioritize actionable, specific information over vague generalities
- Match the depth of your response to the complexity of the task

Begin now.`;
      }
    },

    code: {
      label: 'Code',
      labelAr: '\u0628\u0631\u0645\u062C\u0629',
      icon: '\uD83D\uDCBB',
      descEn: 'Write production-quality code with error handling, edge cases, and best practices.',
      descAr: 'اكتب كود جاهز للإنتاج مع معالجة الأخطاء وأفضل الممارسات.',
      exampleEn: 'e.g. "Build a REST API with Node.js and authentication"',
      exampleAr: 'مثال: "اعمل WordPress plugin للسيو"',
      build: (idea, lang) => `You are a senior software engineer with 15+ years of experience across multiple languages and architectures. You write code that ships to production.

## Task
${idea}

## Execution Protocol
1. **Clarify requirements first**: State what you understand the task to be. If ambiguous, state your interpretation
2. **Choose the right approach**: Briefly explain WHY you chose this approach over alternatives
3. **Write production-quality code**:
   - Clean, readable, well-commented
   - Proper error handling (no silent failures)
   - Type-safe where applicable
   - Follow the language's idiomatic conventions
4. **Include edge cases**: Handle null/undefined, empty inputs, boundary conditions
5. **Self-review**: After writing, check for:
   - Security vulnerabilities (injection, XSS, etc.)
   - Performance bottlenecks
   - Missing error handling
   - Off-by-one errors

## Output Format
\`\`\`[language]
// Your code here with inline comments for non-obvious logic
\`\`\`

**Approach:** Why this solution works
**Edge Cases Handled:** List them
**Potential Improvements:** What could be optimized further

## Constraints
- NO placeholder code or TODOs \u2014 write the complete implementation
- NO deprecated APIs or unsafe practices
- If multiple languages are possible, ask which one OR use the most appropriate`
    },

    analysis: {
      label: 'Analyze',
      labelAr: '\u062A\u062D\u0644\u064A\u0644',
      icon: '\uD83D\uDD0D',
      descEn: 'Deep analysis from multiple angles — optimistic, critical, and pragmatic views.',
      descAr: 'تحليل عميق من زوايا متعددة — متفائل وناقد وعملي.',
      exampleEn: 'e.g. "Analyze whether AI will replace software developers by 2030"',
      exampleAr: 'مثال: "حلل هل الاستثمار في العقارات أفضل ولا الأسهم؟"',
      build: (idea, lang) => `You are a senior analyst with expertise in structured reasoning and critical thinking. Your analysis must be rigorous and evidence-based.

## Subject to Analyze
${idea}

## Analysis Framework (follow this structure)

### 1. Problem Decomposition
Break the subject into its component parts. Identify the core question.

### 2. Evidence & Data
What facts, data, or evidence support each viewpoint? Cite specifics, not generalities.

### 3. Multi-Perspective Analysis
Examine from at least 3 different angles:
- **Optimistic view**: Best-case interpretation
- **Critical view**: Potential flaws and risks
- **Pragmatic view**: Most likely real-world outcome

### 4. Key Insights
The 3-5 most important non-obvious findings.

### 5. Actionable Recommendations
Specific, numbered next steps with priority levels (High/Medium/Low).

## Reasoning Rules
- Distinguish between FACTS and OPINIONS explicitly
- If you lack sufficient information, say what additional data would be needed
- Avoid confirmation bias \u2014 steel-man opposing views before critiquing them
- Quantify when possible (percentages, timelines, costs)`
    },

    creative: {
      label: 'Creative',
      labelAr: '\u0625\u0628\u062F\u0627\u0639\u064A',
      icon: '\u2728',
      descEn: 'Creative writing — ads, stories, slogans, social media content with 3 concept options.',
      descAr: 'كتابة إبداعية — إعلانات، قصص، شعارات، محتوى سوشيال ميديا مع 3 أفكار مختلفة.',
      exampleEn: 'e.g. "Write a product launch email for a fitness app"',
      exampleAr: 'مثال: "اكتب إعلان لتطبيق توصيل طعام جديد"',
      build: (idea, lang) => `You are a world-class creative director and writer. Your work is original, bold, and emotionally resonant.

## Creative Brief
${idea}

## Creative Process
1. **Understand the core emotion**: What should the audience FEEL?
2. **Generate 3 distinct concepts**: Each with a different creative angle
   - Concept A: Safe but polished
   - Concept B: Bold and unexpected
   - Concept C: Emotionally deep
3. **Develop the best concept** in full detail
4. **Polish**: Read it aloud mentally \u2014 does it flow? Does it surprise?

## Creative Constraints
- NO clich\u00E9s \u2014 if a phrase feels familiar, rewrite it
- Show, don't tell \u2014 use vivid, sensory language
- Every word must earn its place \u2014 cut ruthlessly
- Match tone to context (professional, casual, poetic, etc.)

## Output
Present all 3 concepts briefly, then fully develop the strongest one.
Explain your creative choices in a brief "Director's Note" at the end.`
    },

    explain: {
      label: 'Explain',
      labelAr: '\u0627\u0634\u0631\u062D',
      icon: '\uD83D\uDCD6',
      descEn: 'Explain any topic at 5 levels — from simple analogy to expert nuance.',
      descAr: 'اشرح أي موضوع على 5 مستويات — من تشبيه بسيط لتفاصيل خبير.',
      exampleEn: 'e.g. "Explain how blockchain works"',
      exampleAr: 'مثال: "اشرحلي إيه هو الذكاء الاصطناعي"',
      build: (idea, lang) => `You are the world's best teacher \u2014 you can explain quantum physics to a child and compiler design to a poet. You adapt your language to your audience.

## Topic to Explain
${idea}

## Teaching Protocol (use ALL levels)

### Level 1: ELI5 (Explain Like I'm 5)
One sentence using a concrete, everyday analogy. No jargon.

### Level 2: Core Concept (1 paragraph)
The fundamental idea in simple but precise language. Include the KEY insight that makes everything else click.

### Level 3: How It Actually Works
Step-by-step breakdown with:
- Numbered steps
- A real-world example for each step
- Common mistakes people make at each step

### Level 4: Expert Nuance
The details that separate beginners from experts:
- Edge cases and exceptions
- Common misconceptions (and why they're wrong)
- How this connects to related concepts

### Level 5: Go Deeper
Resources, related topics, and what to learn next.

## Teaching Rules
- Use analogies liberally \u2014 they are your superpower
- If you use a technical term, define it immediately in parentheses
- Ask a rhetorical question before each major section to hook attention`
    },

    compare: {
      label: 'Compare',
      labelAr: '\u0642\u0627\u0631\u0646',
      icon: '\u2696\uFE0F',
      descEn: 'Compare 2+ options with a scoring table and a clear recommendation.',
      descAr: 'قارن بين خيارين أو أكثر بجدول تقييم وتوصية واضحة.',
      exampleEn: 'e.g. "Compare React vs Vue vs Svelte for a startup"',
      exampleAr: 'مثال: "قارن بين Shopify وWooCommerce لمتجر إلكتروني"',
      build: (idea, lang) => `You are a decision-making expert who helps people make informed choices by structuring complex comparisons objectively.

## Comparison Request
${idea}

## Comparison Protocol

### Step 1: Identify What's Being Compared
List the options and confirm you understand them correctly.

### Step 2: Define Evaluation Criteria
Choose 6-8 criteria most relevant to this specific decision. Weight them by importance.

### Step 3: Structured Comparison Table

| Criteria (by importance) | Option A | Option B | Winner |
|--------------------------|----------|----------|--------|
| (fill in)                | ...      | ...      | A/B/Tie|

### Step 4: Nuanced Analysis
For each criterion, explain WHY one option wins \u2014 not just that it does.

### Step 5: Decision Matrix
- **Choose A if**: [specific conditions]
- **Choose B if**: [specific conditions]
- **Avoid both if**: [when neither is appropriate]

### Step 6: Final Recommendation
State your recommendation with confidence level (High/Medium/Low) and the KEY factor that tips the scales.

## Rules
- Be genuinely objective \u2014 don't favor the popular option
- Acknowledge when the difference is negligible
- Include real numbers/benchmarks when available`
    },

    debug: {
      label: 'Debug',
      labelAr: '\u062A\u0635\u062D\u064A\u062D',
      icon: '\uD83D\uDC1B',
      descEn: 'Paste an error message or describe a bug — get root cause analysis and fix.',
      descAr: 'الصق رسالة خطأ أو وصف المشكلة — هيديك السبب الجذري والحل.',
      exampleEn: 'e.g. "TypeError: Cannot read property of undefined at line 42"',
      exampleAr: 'مثال: "الموقع بيطلع صفحة بيضاء بعد ما عملت تحديث"',
      build: (idea, lang) => `You are a senior debugging specialist. You approach bugs like a detective \u2014 methodically, without assumptions.

## Problem Description
${idea}

## Debugging Protocol

### Phase 1: Reproduce & Understand
- What EXACTLY is the expected behavior?
- What EXACTLY is happening instead?
- What changed recently? (code, environment, dependencies)

### Phase 2: Isolate
- Narrow down the scope: which file, function, or line?
- Is it deterministic or intermittent?
- What are the minimum steps to reproduce?

### Phase 3: Root Cause Analysis
Think through the possible causes systematically:
1. List the 3-5 most likely causes
2. For each cause, what evidence supports or contradicts it?
3. Identify the MOST LIKELY root cause

### Phase 4: Fix
- Provide the exact fix with code
- Explain WHY this fixes the root cause (not just the symptom)
- Identify any side effects of the fix

### Phase 5: Prevention
- How to prevent this class of bug in the future
- Suggest a test case that would catch this

## Rules
- Don't guess \u2014 reason from evidence
- Consider the simplest explanation first (Occam's Razor)
- If you need more information, ask specific diagnostic questions`
    },

    plan: {
      label: 'Plan',
      labelAr: '\u062E\u0637\u0629',
      icon: '\uD83D\uDCCB',
      descEn: 'Turn a goal into a phased action plan with timelines and risk assessment.',
      descAr: 'حوّل هدف لخطة عمل مرحلية بجدول زمني وتقييم مخاطر.',
      exampleEn: 'e.g. "Plan launching a mobile app in 3 months"',
      exampleAr: 'مثال: "خطة لإطلاق متجر إلكتروني في شهرين"',
      build: (idea, lang) => `You are a strategic planning expert who turns vague goals into executable action plans with measurable milestones.

## Goal
${idea}

## Planning Framework

### 1. Goal Clarity
Restate the goal as a SMART objective:
- **S**pecific: What exactly?
- **M**easurable: How will we know it's done?
- **A**chievable: Is this realistic given constraints?
- **R**elevant: Why does this matter?
- **T**ime-bound: By when?

### 2. Prerequisites
What must be true BEFORE starting? List dependencies and blockers.

### 3. Action Plan (Phased)

#### Phase 1: Foundation (Week 1)
- [ ] Step 1 \u2014 [specific action] (estimated time: Xh)
- [ ] Step 2 \u2014 ...

#### Phase 2: Build (Week 2-3)
- [ ] Step 3 \u2014 ...

#### Phase 3: Launch & Verify (Week 4)
- [ ] Step N \u2014 ...

### 4. Risk Register
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ...  | High/Med/Low| High/Med/Low | ... |

### 5. Success Criteria
How to verify completion. Include specific metrics.

## Rules
- Every step must be a concrete, verifiable action (not "think about X")
- Include time estimates for each step
- Flag decision points where the plan might need to adapt`
    },

    translate: {
      label: 'Translate',
      labelAr: '\u062A\u0631\u062C\u0645',
      icon: '\uD83C\uDF10',
      descEn: 'Professional translation with cultural adaptation — not literal word-by-word.',
      descAr: 'ترجمة احترافية مع تكييف ثقافي — مش كلمة بكلمة.',
      exampleEn: 'e.g. "Translate this marketing page from English to Arabic"',
      exampleAr: 'مثال: "ترجم الإيميل ده من عربي لإنجليزي بشكل رسمي"',
      build: (idea, lang) => `You are a professional translator and cultural adaptation expert. You translate meaning, not just words.

## Translation Task
${idea}

## Translation Protocol
1. **Identify source and target languages** (ask if unclear)
2. **Understand context**: Is this formal, casual, technical, literary?
3. **Translate for meaning**: Preserve intent, tone, and cultural nuance
4. **Adapt idioms**: Don't translate idioms literally \u2014 find the equivalent in the target language
5. **Handle ambiguity**: If a word has multiple meanings, translate the contextually correct one

## Output Format
**Translation:**
[The translated text]

**Translator's Notes:**
- Any cultural adaptations made
- Words with no direct equivalent (with explanation)
- Ambiguities in the source text and how you resolved them

## Rules
- Preserve the original tone (formal \u2192 formal, casual \u2192 casual)
- For technical terms: provide both the translated term and original in parentheses
- If the text contains proper nouns, keep them as-is unless there's an established translation`
    },

    seo: {
      label: 'SEO',
      labelAr: '\u0633\u064a\u0648',
      icon: '\uD83D\uDE80',
      descEn: 'Smart SEO: choose page type, paste content or code, get full audit + rewrites.',
      descAr: '\u0645\u064f\u062d\u0633\u0651\u0646 SEO \u0630\u0643\u064a: \u0627\u062e\u062a\u0627\u0631 \u0646\u0648\u0639 \u0627\u0644\u0635\u0641\u062d\u0629\u060c \u0627\u0644\u0635\u0642 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0623\u0648 \u0627\u0644\u0643\u0648\u062f\u060c \u0648\u0627\u062d\u0635\u0644 \u0639\u0644\u0649 \u062a\u062d\u0644\u064a\u0644 + \u0643\u0648\u062f \u0645\u064f\u062d\u0633\u0651\u0646.',
      exampleEn: 'Choose page type, paste content/code, add keyword + URL',
      exampleAr: '\u0627\u062e\u062a\u0627\u0631 \u0646\u0648\u0639 \u0627\u0644\u0635\u0641\u062d\u0629\u060c \u0627\u0644\u0635\u0642 \u0627\u0644\u0645\u062d\u062a\u0648\u0649\u060c \u0636\u064a\u0641 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0641\u062a\u0627\u062d\u064a\u0629 + \u0627\u0644\u0631\u0627\u0628\u0637',
      hasSeoForm: true,
      build: function(idea, lang) {
        var d = (typeof idea === 'object' && idea !== null) ? idea : { pageType: 'article', url: '', keyword: '', content: String(idea || ''), extraData: '' };
        var pt = d.pageType || 'article'; var url = d.url || ''; var kw = d.keyword || ''; var content = d.content || ''; var extra = d.extraData || '';
        var L = ['You are a senior SEO strategist and GEO expert for 2026.','','## Capabilities','- CAN: analyze content, rewrite titles/meta/headings, fix HTML, add schema, FAQs, GEO scoring, code optimization','- CANNOT: real search volumes, live rankings, backlink metrics','- NEVER invent traffic numbers or DA scores','','---','## Data Provided','| Field | Value |','|-------|-------|','| Page Type | '+pt+' |','| URL | '+(url||'Not provided')+' |','| Keyword | '+(kw||'Not provided')+' |','| Content | '+(content?'YES ('+content.length+' chars)':'Not provided')+' |',''];
        if(pt==='article'){L=L.concat(['---','## PAGE TYPE: Blog/Article','','### Article Content',content||'[No content]','','---','','## Complete ALL:','','### 1. E-E-A-T Audit','| Signal | /10 | Missing |','|--------|-----|---------|','| Experience | | |','| Expertise | | |','| Authoritativeness | | |','| Trustworthiness | | |','','### 2. On-Page Rewrites (copy-paste ready)','Title (under 60 chars):','> ','','Meta desc (under 155 chars):','> ','','H1:','> ','','H2 structure (5-7):','1. ','2. ','3. ','4. ','5. ','','### 3. Content Gaps','List thin sections + what to add.','','### 4. Featured Snippet','Paragraph (40-60 words):','> ','','### 5. GEO Readiness','| Factor | /10 |','|--------|-----|','| Factual density | |','| Quotability | |','| Completeness | |','| Structured data | |','','Rewrite 3 paragraphs to be AI-citable:','','### 6. FAQ (5 Q&A)','Self-contained answers.','','### 7. Schema','| Type | Why | Fields |','|------|-----|--------|','','### 8. Actions','Now: 1. 2. 3.','This week: 1. 2.']);}
        else if(pt==='product'){L=L.concat(['---','## PAGE TYPE: Product','','### Content',content||'[No content]','','---','','### 1. Title & Meta','Title ([Product] - [Benefit] | [Brand]):','> ','','Meta:','> ','','### 2. Product Schema (JSON-LD)','Write complete code.','','### 3. Description','Rewrite with benefits, specs, use cases, social proof. Add comparison table.','','### 4. Trust','AggregateRating schema + 5 buyer FAQ.','','### 5. GEO','3 AI-citable product statements.','','### 6. Actions','1. 2. 3.']);}
        else if(pt==='landing'){L=L.concat(['---','## PAGE TYPE: Landing Page','','### Content',content||'[No content]','','---','','### 1. Above-the-Fold','Headline clarity /10, CTA visibility /10, Value prop in 3s: YES/NO','Suggested headline:','> ','','### 2. Title & Meta','Title:','> ','','Meta (urgency+CTA):','> ','','### 3. Trust Signals','| Signal | Present? | Fix |','|--------|----------|-----|','| Testimonials | | |','| Security | | |','| Guarantee | | |','| Social proof | | |','','### 4. CTA','Primary:','> ','Secondary:','> ','','### 5. Schema (WebPage+FAQ)','Write JSON-LD.','','### 6. Fixes','1. 2. 3.']);}
        else if(pt==='service'){L=L.concat(['---','## PAGE TYPE: Service','','### Content',content||'[No content]','','---','','### 1. E-E-A-T (YMYL)','| Signal | /10 | Fix |','|--------|-----|-----|','| Credentials | | |','| Case studies | | |','| Contact info | | |','| Privacy policy | | |','','### 2. Title & Meta','Title ([Service] in [Location]):','> ','','Meta:','> ','','### 3. Service Schema','Write JSON-LD.','','### 4. Local SEO','NAP, local keywords, GBP tips.','','### 5. FAQ (5 Qs)','','### 6. GEO','3 expert paragraphs for AI citation.','','### 7. Actions','1. 2. 3.']);}
        else if(pt==='custom-code'){L=L.concat(['---','## PAGE TYPE: Custom Code (Elementor/HTML)','','### IMPORTANT: Return FULL OPTIMIZED CODE','','### Original Code','```html',content||'<!-- No code -->','```','','---','','### 1. Issues Found','| # | Issue | Element | Severity |','|---|-------|---------|----------|','','### 2. OPTIMIZED Code (COMPLETE)','Apply: semantic HTML, heading hierarchy, alt text, schema JSON-LD, ARIA labels, lazy loading.','Mark fixes: <!-- SEO FIX: desc -->','','```html','<!-- Return COMPLETE optimized code -->','```','','### 3. Changes','| # | Change | Why |','|---|--------|-----|','','### 4. Schema','```json','{}','```','','### 5. Meta Tags','```html','<title>...</title>','<meta name="description" content="...">','```','','### 6. Other Recommendations']);}
        if(extra){L=L.concat(['','---','## Extra Data',extra]);}
        L=L.concat(['','---','## Rules','- NEVER invent volumes/rankings','- All rewrites: copy-paste ready','- Custom code: return COMPLETE code','- Flag AI-generated content risk']);
        return L.join('\n');
      }
    }
  };


  /* ══════════════════════════════════════════════════════════
     PLATFORM INPUT SELECTORS & INJECTION
     ══════════════════════════════════════════════════════════ */

  const INPUT_SELECTORS = [
    // ChatGPT
    '#prompt-textarea',
    // Claude — Lexical editor or ProseMirror
    'div[contenteditable="true"][data-lexical-editor]',
    'div[contenteditable="true"].ProseMirror',
    'fieldset textarea',
    'div.ProseMirror[contenteditable="true"]',
    // ChatGPT / Claude fallback
    '[data-testid="composer-text-input"]',
    // Gemini — rich textarea
    'rich-textarea .ql-editor[contenteditable="true"]',
    'rich-textarea textarea',
    // Copilot
    'textarea#searchbox',
    'cib-text-input textarea',
    // DeepSeek
    'textarea#chat-input',
    // Grok
    'textarea[placeholder*="Ask"]',
    // Perplexity
    'textarea[placeholder*="Follow"]',
    // Generic — these must remain last
    'textarea#userInput',
    'textarea[rows]',
    '[contenteditable="true"][role="textbox"]',
    'textarea',
    '[contenteditable="true"]',
  ];

  function findChatInput() {
    for (const sel of INPUT_SELECTORS) {
      try {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.height > 20 && r.width > 100 && el.offsetParent !== null) return el;
        }
      } catch (_) {}
    }
    return null;
  }

  /* ── React Fiber Value Setter ────────────────────────── */
  function setReactValue(el, value) {
    try {
      const key = Object.keys(el).find(
        k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
      );
      if (!key) return false;
      let fiber = el[key];
      for (let d = 0; d < 30 && fiber; d++) {
        const p = fiber.memoizedProps || fiber.pendingProps;
        if (p && (typeof p.onChange === 'function' || typeof p.onInput === 'function')) {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
                      : el.tagName === 'INPUT' ? HTMLInputElement.prototype : null;
          if (proto) {
            const desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (desc && desc.set) {
              desc.set.call(el, value);
              el.dispatchEvent(new Event('input',  { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        }
        fiber = fiber.return;
      }
    } catch (_) {}
    return false;
  }

  /* ── ContentEditable Injection (3-method cascade) ──── */
  function injectContentEditable(el, text) {
    el.focus();
    // Method 1: execCommand (Lexical & ProseMirror)
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      if (document.execCommand('insertText', false, text)) {
        el.dispatchEvent(new InputEvent('input', {
          bubbles: true, inputType: 'insertText', data: text
        }));
        return true;
      }
    } catch (_) {}
    // Method 2: Text node replacement
    try {
      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(document.createTextNode(text));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_) {}
    // Method 3: Clipboard paste simulation
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true, cancelable: true, clipboardData: dt
      }));
      return true;
    } catch (_) {}
    return false;
  }

  /* ── Master Inject ────────────────────────────────── */
  function injectIntoInput(text) {
    const el = findChatInput();
    if (!el) return false;
    try {
      el.focus();
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        if (setReactValue(el, text)) return true;
        try {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const d = Object.getOwnPropertyDescriptor(proto, 'value');
          if (d && d.set) d.set.call(el, text); else el.value = text;
        } catch (_) { el.value = text; }
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      if (el.contentEditable === 'true') return injectContentEditable(el, text);
      return false;
    } catch (e) { return false; }
  }

  /* ── Language Detection ───────────────────────────── */
  function detectLanguage(text) {
    const ar = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const en = (text.match(/[a-zA-Z]/g) || []).length;
    return ar > en ? 'ar' : 'en';
  }



  /* ══════════════════════════════════════════════════════════
     PROMPT HISTORY (last 20 prompts, persisted in storage)
     ══════════════════════════════════════════════════════════ */

  var PromptHistory = {
    MAX: 20,
    _cache: null,

    load: function(cb) {
      try {
        chrome.storage.local.get('promptHistory', function(r) {
          PromptHistory._cache = Array.isArray(r.promptHistory) ? r.promptHistory : [];
          if (cb) cb(PromptHistory._cache);
        });
      } catch(_) { if (cb) cb([]); }
    },

    save: function(entry) {
      // entry: { idea, template, outputLang, prompt, ts }
      PromptHistory.load(function(list) {
        list.unshift(entry);
        if (list.length > PromptHistory.MAX) list = list.slice(0, PromptHistory.MAX);
        PromptHistory._cache = list;
        try { chrome.storage.local.set({ promptHistory: list }); } catch(_) {}
      });
    },

    clear: function() {
      PromptHistory._cache = [];
      try { chrome.storage.local.set({ promptHistory: [] }); } catch(_) {}
    }
  };

  /* ══════════════════════════════════════════════════════════
     CONTEXT-AWARE: Read last AI response from page
     ══════════════════════════════════════════════════════════ */

  function getLastAIResponse() {
    // Try platform-specific selectors then fall back to generic
    var selectors = [
      // ChatGPT
      '[data-message-author-role="assistant"] .markdown',
      '[data-message-author-role="assistant"]',
      // Claude — action-bar detection: find last message with feedback button
      // (feedback buttons only exist on AI responses, not human messages)
      '.font-claude-message',
      '[class*="claude-message"]',
      '[class*="response-message"]',
      // Gemini
      'model-response .markdown',
      'model-response',
      // Copilot
      'cib-message[source="bot"]',
      '[data-content="ai-message"]',
      // DeepSeek / Grok / Generic
      '[class*="assistant"] [class*="content"]',
      '[class*="bot"] [class*="message"]',
      '[class*="ai-response"]',
      'article:last-of-type'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var els = document.querySelectorAll(selectors[i]);
      if (els.length > 0) {
        var last = els[els.length - 1];
        var text = (last.innerText || last.textContent || '').trim();
        if (text.length > 20) return text.slice(0, 800); // cap at 800 chars
      }
    }

    // Claude special fallback: find the last message block that has a feedback button
    var actionBars = document.querySelectorAll('[role="group"][aria-label="Message actions"]');
    for (var j = actionBars.length - 1; j >= 0; j--) {
      var bar = actionBars[j];
      var hasFeedback = bar.querySelector('button[aria-label*="feedback"], button[aria-label*="Feedback"]');
      if (hasFeedback) {
        // This is an AI message — find its content
        var container = bar.closest('[data-testid]')
                     || bar.closest('[class*="message"]')
                     || (bar.parentElement && bar.parentElement.parentElement);
        if (container) {
          var text = (container.innerText || container.textContent || '').trim();
          if (text.length > 20) return text.slice(0, 800);
        }
      }
    }

    return null;
  }


  /* ══════════════════════════════════════════════════════════
     UI CONSTRUCTION
     ══════════════════════════════════════════════════════════ */

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ach-prompt-overlay';
    overlay.setAttribute('data-ach', 'true');

    // Read saved language preference
    try {
      chrome.storage.local.get(['uiLang']).then(res => {
        if (res && res.uiLang) applyOverlayLang(overlay, res.uiLang);
      }).catch(() => {});
    } catch (_) {}

    const tmplButtons = Object.entries(PROMPT_TEMPLATES).map(([key, t]) =>
      '<button class="ach-tmpl-btn" data-key="' + key + '" data-label-en="' + t.label + '" data-label-ar="' + (t.labelAr || t.label) + '" title="' + t.label + '">' +
      t.icon + '<span>' + t.label + '</span></button>'
    ).join('');

    overlay.innerHTML =
      '<div id="ach-panel-inner">' +
        '<div id="ach-header">' +
          '<div id="ach-header-left">' +
            '<span id="ach-logo">\u2726</span>' +
            '<span id="ach-title" data-en="Prompt Engineer" data-ar="مهندس البرومبت">Prompt Engineer</span>' +
            '<span id="ach-badge">Pro</span>' +
          '</div>' +
          '<button id="ach-close" aria-label="Close">\u2715</button>' +
        '</div>' +
        '<div id="ach-idea-area">' +
          '<label for="ach-idea-input" id="ach-idea-label" data-en="Your idea (any language)" data-ar="فكرتك (بأي لغة)">Your idea (any language)</label>' +
          '<textarea id="ach-idea-input" dir="auto" data-placeholder-en="e.g. I want to build a todo app with React..." data-placeholder-ar="مثلاً: عايز أعمل تطبيق مهام بـ React..." placeholder="e.g. I want to build a todo app with React..." rows="3" spellcheck="true"></textarea>' +
        '</div>' +
        '<div id="ach-seo-form" hidden>' +
          '<div id="ach-seo-type-row">' +
            '<label data-en="Page Type:" data-ar="نوع الصفحة:">Page Type:</label>' +
            '<div id="ach-seo-types">' +
              '<button type="button" class="ach-seo-type active" data-type="article" data-en="📝 Article" data-ar="📝 مقال">📝 Article</button>' +
              '<button type="button" class="ach-seo-type" data-type="product" data-en="🛒 Product" data-ar="🛒 منتج">🛒 Product</button>' +
              '<button type="button" class="ach-seo-type" data-type="landing" data-en="🚀 Landing" data-ar="🚀 هبوط">🚀 Landing</button>' +
              '<button type="button" class="ach-seo-type" data-type="service" data-en="⚙️ Service" data-ar="⚙️ خدمة">⚙️ Service</button>' +
              '<button type="button" class="ach-seo-type" data-type="custom-code" data-en="💻 Elementor/HTML" data-ar="💻 كود مخصص">💻 Elementor/HTML</button>' +
            '</div>' +
          '</div>' +
          '<input type="text" id="ach-seo-url" data-placeholder-en="Page URL (optional)..." data-placeholder-ar="رابط الصفحة (اختياري)..." placeholder="Page URL (optional)...">' +
          '<input type="text" id="ach-seo-keyword" data-placeholder-en="Target Keyword (optional)..." data-placeholder-ar="الكلمة المفتاحية المستهدفة (اختياري)..." placeholder="Target Keyword (optional)...">' +
          '<textarea id="ach-seo-content" rows="3" data-placeholder-en="Paste your article text..." data-placeholder-ar="الصق نص المقال..." placeholder="Paste your article text..."></textarea>' +
          '<textarea id="ach-seo-extra" rows="2" data-placeholder-en="Extra context, guidelines or requirements (optional)..." data-placeholder-ar="سياق إضافي، إرشادات أو متطلبات (اختياري)..." placeholder="Extra context, guidelines or requirements (optional)..."></textarea>' +
        '</div>' +
        '<div id="ach-template-row" role="radiogroup" aria-label="Prompt type">' +
          tmplButtons +
        '</div>' +
        '<div id="ach-mode-hint" dir="auto">' +
          '<div id="ach-mode-desc"></div>' +
          '<div id="ach-mode-example"></div>' +
        '</div>' +
        '<div id="ach-output-lang-row">' +
          '<span id="ach-output-lang-label" data-en="AI Response Language:" data-ar="لغة رد الـ AI:">AI Response Language:</span>' +
          '<button class="ach-lang-pill active" data-outlang="en">English</button>' +
          '<button class="ach-lang-pill" data-outlang="ar">عربي</button>' +
        '</div>' +
        '<div id="ach-actions">' +
          '<button id="ach-generate-btn" type="button">' +
            '<span id="ach-gen-text" data-en="\u2726 Generate Smart Prompt" data-ar="\u2726 إنشاء برومبت ذكي">\u2726 Generate Smart Prompt</span>' +
          '</button>' +
          '<div id="ach-extra-btns">' +
            '<button id="ach-context-btn" type="button" title="Fill from last AI response" data-en="\uD83E\uDDE0 Use Context" data-ar="\uD83E\uDDE0 استخدم السياق">\uD83E\uDDE0 Use Context</button>' +
            '<button id="ach-history-btn" type="button" title="Prompt history" data-en="\uD83D\uDDD3 History" data-ar="\uD83D\uDDD3 السجل">\uD83D\uDDD3 History</button>' +
          '</div>' +
        '</div>' +
        '<div id="ach-history-panel" hidden>' +
          '<div id="ach-history-header">' +
            '<span data-en="Recent Prompts" data-ar="البرومبتات الأخيرة">Recent Prompts</span>' +
            '<button id="ach-history-clear" data-en="Clear" data-ar="مسح">Clear</button>' +
          '</div>' +
          '<div id="ach-history-list"></div>' +
        '</div>' +
        '<div id="ach-result-area" hidden>' +
          '<div id="ach-result-header">' +
            '<span id="ach-result-label" data-en="GENERATED PROMPT" data-ar="البرومبت الناتج">GENERATED PROMPT</span>' +
            '<div id="ach-result-btns">' +
              '<button id="ach-copy-result" type="button" data-en="\uD83D\uDCCB Copy" data-ar="\uD83D\uDCCB نسخ" title="Copy">\uD83D\uDCCB Copy</button>' +
              '<button id="ach-insert-result" type="button" data-en="\u2B06 Insert" data-ar="\u2B06 إدراج" title="Insert">\u2B06 Insert</button>' +
            '</div>' +
          '</div>' +
          '<div id="ach-result-text" dir="auto"></div>' +
        '</div>' +
      '</div>';

    return overlay;
  }

  /** Apply language to the overlay elements */
  function applyOverlayLang(overlay, lang) {
    if (!overlay) return;
    const key = lang === 'ar' ? 'ar' : 'en';

    // Set direction and alignment
    overlay.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
    overlay.style.textAlign = lang === 'ar' ? 'right' : 'left';
    if (lang === 'ar') {
      overlay.classList.add('ach-rtl');
    } else {
      overlay.classList.remove('ach-rtl');
    }

    // Elements with data-en / data-ar attributes
    overlay.querySelectorAll('[data-' + key + ']').forEach(el => {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.placeholder = el.getAttribute('data-placeholder-' + key) || el.placeholder;
      } else {
        el.textContent = el.getAttribute('data-' + key);
      }
    });

    // Fix textarea placeholder specifically
    const textarea = overlay.querySelector('#ach-idea-input');
    if (textarea) {
      const ph = textarea.getAttribute('data-placeholder-' + key);
      if (ph) textarea.placeholder = ph;
    }

    // Template buttons
    overlay.querySelectorAll('.ach-tmpl-btn').forEach(btn => {
      const label = btn.getAttribute('data-label-' + key);
      if (label) {
        const span = btn.querySelector('span');
        if (span) span.textContent = label;
      }
    });
  }


  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */

  function injectStyles() {
    if (document.getElementById('ach-styles')) return;
    var s = document.createElement('style');
    s.id = 'ach-styles';
    s.textContent = [
      '#ach-prompt-overlay{position:fixed;bottom:90px;right:20px;width:420px;max-width:calc(100vw - 32px);max-height:85vh;overflow-y:auto;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;direction:ltr;text-align:left;scrollbar-width:thin;scrollbar-color:rgba(124,58,237,0.4) transparent}',
      '#ach-prompt-overlay.ach-rtl{direction:rtl;text-align:right}',
      '#ach-prompt-overlay.ach-rtl #ach-idea-label, #ach-prompt-overlay.ach-rtl #ach-output-lang-label, #ach-prompt-overlay.ach-rtl #ach-result-label{text-align:right}',
      '@media(max-width:480px){#ach-prompt-overlay{bottom:0;right:0;left:0;width:100%;max-width:100%;border-radius:20px 20px 0 0}}',
      '#ach-panel-inner{background:rgba(12,12,28,0.98);border:1px solid rgba(124,58,237,0.3);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);padding:16px;animation:ach-slide-up .25s ease-out both}',
      '@keyframes ach-slide-up{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}',
      '#ach-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}',
      '#ach-header-left{display:flex;align-items:center;gap:8px}',
      '#ach-logo{font-size:18px;background:linear-gradient(135deg,#7c3aed,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 8px rgba(124,58,237,.5))}',
      '#ach-title{font-size:15px;font-weight:700;background:linear-gradient(135deg,#c4b5fd,#93c5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent}',
      '#ach-badge{padding:2px 7px;font-size:9px;font-weight:700;color:#7c3aed;background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.3);border-radius:12px;letter-spacing:.04em}',
      '#ach-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .2s}',
      '#ach-close:hover{background:rgba(239,68,68,.2);color:#ef4444;border-color:rgba(239,68,68,.3)}',
      '#ach-idea-label{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:rgba(196,181,253,.7);margin-bottom:6px}',
      '#ach-idea-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#e2e8f0;font-size:13.5px;line-height:1.6;padding:10px 12px;resize:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}',
      '#ach-idea-input:focus{outline:none;border-color:rgba(124,58,237,.5);box-shadow:0 0 0 3px rgba(124,58,237,.12)}',
      '#ach-idea-input::placeholder{color:rgba(255,255,255,.25)}',
      '#ach-template-row{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}',
      '.ach-tmpl-btn{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;color:rgba(255,255,255,.55);font-size:11.5px;font-weight:500;padding:4px 10px;cursor:pointer;font-family:inherit;transition:all .18s}',
      '.ach-tmpl-btn:hover{background:rgba(124,58,237,.15);border-color:rgba(124,58,237,.35);color:#c4b5fd}',
      '.ach-tmpl-btn.active{background:rgba(124,58,237,.25);border-color:rgba(124,58,237,.55);color:#c4b5fd;box-shadow:0 0 12px rgba(124,58,237,.2)}',
      '#ach-seo-form{padding:0 16px}',
      '#ach-seo-type-row{margin-bottom:8px}',
      '#ach-seo-type-row label{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px;display:block}',
      '#ach-seo-types{display:flex;gap:4px;flex-wrap:wrap}',
      '.ach-seo-type{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:rgba(255,255,255,.7);font-size:11px;padding:5px 8px;cursor:pointer;transition:all .2s;font-family:inherit}',
      '.ach-seo-type:hover{background:rgba(255,255,255,.1);color:#fff}',
      '.ach-seo-type.active{background:linear-gradient(135deg,rgba(124,58,237,.3),rgba(59,130,246,.3));border-color:rgba(124,58,237,.5);color:#fff}',
      '#ach-seo-url,#ach-seo-keyword{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:12px;padding:8px 12px;margin-top:6px;font-family:inherit;outline:none;transition:border-color .2s}',
      '#ach-seo-url:focus,#ach-seo-keyword:focus{border-color:rgba(124,58,237,.5)}',
      '#ach-seo-content,#ach-seo-extra{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:12px;padding:8px 12px;margin-top:6px;font-family:inherit;outline:none;resize:vertical;transition:border-color .2s}',
      '#ach-seo-content:focus,#ach-seo-extra:focus{border-color:rgba(124,58,237,.5)}',
      '#ach-seo-url::placeholder,#ach-seo-keyword::placeholder,#ach-seo-content::placeholder,#ach-seo-extra::placeholder{color:rgba(255,255,255,.25)}',
      '#ach-generate-btn{width:100%;background:linear-gradient(135deg,#7c3aed,#3b82f6);border:none;border-radius:10px;color:#fff;font-size:13.5px;font-weight:600;padding:11px 16px;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(124,58,237,.35)}',
      '#ach-generate-btn:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(124,58,237,.5)}',
      '#ach-generate-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}',
      '#ach-output-lang-row{display:flex;align-items:center;gap:6px;margin:8px 0 4px}',
      '#ach-output-lang-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:rgba(196,181,253,.6)}',
      '.ach-lang-pill{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:rgba(255,255,255,.5);font-size:11px;padding:3px 10px;cursor:pointer;font-family:inherit;transition:all .15s}',
      '.ach-lang-pill:hover{background:rgba(124,58,237,.15);color:#c4b5fd}',
      '.ach-lang-pill.active{background:rgba(124,58,237,.25);border-color:rgba(124,58,237,.5);color:#c4b5fd}',
      '#ach-result-area{margin-top:12px;border:1px solid rgba(124,58,237,.25);border-radius:10px;overflow:hidden;animation:ach-fade-in .3s ease}',
      '@keyframes ach-fade-in{from{opacity:0}to{opacity:1}}',
      '#ach-result-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(124,58,237,.12);border-bottom:1px solid rgba(124,58,237,.2)}',
      '#ach-result-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:rgba(196,181,253,.8)}',
      '#ach-result-btns{display:flex;gap:6px}',
      '#ach-result-btns button{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:rgba(255,255,255,.65);font-size:11px;padding:3px 9px;cursor:pointer;font-family:inherit;transition:all .18s}',
      '#ach-copy-result:hover{background:rgba(16,185,129,.2);border-color:rgba(16,185,129,.4);color:#10b981}',
      '#ach-insert-result:hover{background:rgba(59,130,246,.2);border-color:rgba(59,130,246,.4);color:#60a5fa}',
      '#ach-result-text{padding:12px;font-size:12.5px;line-height:1.65;color:rgba(226,232,240,.85);white-space:pre-wrap;word-break:break-word;max-height:250px;overflow-y:auto;background:rgba(0,0,0,.2);scrollbar-width:thin;scrollbar-color:rgba(124,58,237,.3) transparent}',
      /* Extra buttons row */
      '#ach-extra-btns{display:flex;gap:6px;margin-top:6px}',
      '#ach-context-btn,#ach-history-btn{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(255,255,255,.5);font-size:11px;padding:5px 8px;cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap}',
      '#ach-context-btn:hover{background:rgba(6,182,212,.15);border-color:rgba(6,182,212,.4);color:#06b6d4}',
      '#ach-history-btn:hover{background:rgba(124,58,237,.15);border-color:rgba(124,58,237,.35);color:#c4b5fd}',
      /* History panel */
      '#ach-history-panel{margin-top:8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden;animation:ach-fade-in .2s ease}',
      '#ach-history-header{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.06)}',
      '#ach-history-header span{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:rgba(196,181,253,.7)}',
      '#ach-history-clear{background:none;border:none;color:rgba(239,68,68,.6);font-size:10px;cursor:pointer;font-family:inherit;padding:0}',
      '#ach-history-clear:hover{color:#ef4444}',
      '#ach-history-list{max-height:160px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(124,58,237,.3) transparent}',
      '.ach-hist-item{padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}',
      '.ach-hist-item:hover{background:rgba(124,58,237,.12)}',
      '.ach-hist-item:last-child{border-bottom:none}',
      '.ach-hist-preview{display:block;font-size:12px;color:rgba(226,232,240,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ach-hist-meta{display:block;font-size:10px;color:rgba(255,255,255,.3);margin-top:2px}',
      '.ach-hist-empty{padding:12px;text-align:center;font-size:12px;color:rgba(255,255,255,.3)}',
      /* Mode description hint */
      '#ach-mode-hint{margin:0 0 6px;padding:8px 10px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.15);border-radius:8px;animation:ach-fade-in .2s ease}',
      '#ach-mode-hint[hidden]{display:none}',
      '#ach-mode-desc{font-size:11.5px;color:rgba(196,181,253,.85);line-height:1.5;margin-bottom:3px}',
      '#ach-mode-example{font-size:10.5px;color:rgba(255,255,255,.35);font-style:italic}',
    ].join('\n');
    document.head.appendChild(s);
  }


  /* ══════════════════════════════════════════════════════════
     INITIALIZATION & EVENT BINDING
     ══════════════════════════════════════════════════════════ */

  function init() {
    injectStyles();

    // Toggle off if already open
    var existing = document.getElementById('ach-prompt-overlay');
    if (existing) { existing.remove(); return; }

    var overlay = createOverlay();
    document.body.appendChild(overlay);

    // Register live-lang listener once per page load (not per open)
    _ensureLangListener();

    var selectedTemplate = 'general';
    var selectedOutputLang = 'en';
    var firstBtn = overlay.querySelector('.ach-tmpl-btn[data-key="general"]');
    if (firstBtn) firstBtn.classList.add('active');

    // ── Mode hint elements ──
    var modeHint    = overlay.querySelector('#ach-mode-hint');
    var modeDesc    = overlay.querySelector('#ach-mode-desc');
    var modeExample = overlay.querySelector('#ach-mode-example');

    function showModeHint(key) {
      var tmpl = PROMPT_TEMPLATES[key];
      if (!tmpl || !modeHint) return;
      // Detect UI language
      var isAr = overlay.classList.contains('ach-rtl');
      modeDesc.textContent    = isAr ? (tmpl.descAr || tmpl.descEn) : tmpl.descEn;
      modeExample.textContent = isAr ? (tmpl.exampleAr || tmpl.exampleEn) : tmpl.exampleEn;
      modeHint.hidden = false;
    }

    // Show default hint for 'general'
    showModeHint('general');

    // Template buttons
    overlay.querySelectorAll('.ach-tmpl-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.querySelectorAll('.ach-tmpl-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedTemplate = btn.dataset.key;
        showModeHint(btn.dataset.key);
        var seoForm = overlay.querySelector('#ach-seo-form');
        var ideaArea = overlay.querySelector('#ach-idea-area');
        if (seoForm && ideaArea) {
          if (btn.dataset.key === 'seo') { seoForm.hidden = false; ideaArea.style.display = 'none'; }
          else { seoForm.hidden = true; ideaArea.style.display = ''; }
        }
      });
    });

    // Output language pills
    overlay.querySelectorAll('.ach-lang-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        overlay.querySelectorAll('.ach-lang-pill').forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');
        selectedOutputLang = pill.dataset.outlang;
      });
    });

    // SEO page type buttons
    overlay.querySelectorAll('.ach-seo-type').forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.querySelectorAll('.ach-seo-type').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var ca = overlay.querySelector('#ach-seo-content');
        if (ca) {
          var ph = {'article':'Paste your article text...','product':'Paste product name, description, price...','landing':'Paste landing page content...','service':'Paste service description...','custom-code':'Paste your HTML/CSS code (Elementor, etc.)...'};
          var phAr = {'article':'\u0627\u0644\u0635\u0642 \u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0644...','product':'\u0627\u0644\u0635\u0642 \u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062a\u062c \u0648\u0627\u0644\u0648\u0635\u0641...','landing':'\u0627\u0644\u0635\u0642 \u0645\u062d\u062a\u0648\u0649 \u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0628\u0648\u0637...','service':'\u0627\u0644\u0635\u0642 \u0648\u0635\u0641 \u0627\u0644\u062e\u062f\u0645\u0629...','custom-code':'\u0627\u0644\u0635\u0642 \u0643\u0648\u062f HTML/CSS...'};
          var isAr = overlay.classList.contains('ach-rtl');
          ca.placeholder = isAr ? (phAr[btn.dataset.type]||'') : (ph[btn.dataset.type]||'');
        }
      });
    });

    // Close
    overlay.querySelector('#ach-close').addEventListener('click', function() {
      overlay.style.opacity = '0';
      overlay.style.transform = 'translateY(10px)';
      setTimeout(function() { overlay.remove(); }, 200);
    });

    var genBtn    = overlay.querySelector('#ach-generate-btn');
    var genText   = overlay.querySelector('#ach-gen-text');
    var resultBox = overlay.querySelector('#ach-result-area');
    var resultTxt = overlay.querySelector('#ach-result-text');
    var ideaInput = overlay.querySelector('#ach-idea-input');

    // Generate — NO spinner, just text swap
    genBtn.addEventListener('click', function() {
      var idea;
      if (selectedTemplate === 'seo') {
        var seoContent = (overlay.querySelector('#ach-seo-content') || {}).value || '';
        if (!seoContent.trim()) {
          var sc = overlay.querySelector('#ach-seo-content');
          if (sc) { sc.style.borderColor = 'rgba(239,68,68,.5)'; sc.focus(); setTimeout(function(){ sc.style.borderColor=''; }, 1500); }
          return;
        }
        var selectedSeoType = 'article';
        var activeTypeBtn = overlay.querySelector('.ach-seo-type.active');
        if (activeTypeBtn) selectedSeoType = activeTypeBtn.dataset.type;
        idea = { pageType: selectedSeoType, url: (overlay.querySelector('#ach-seo-url')||{}).value||'', keyword: (overlay.querySelector('#ach-seo-keyword')||{}).value||'', content: seoContent.trim(), extraData: (overlay.querySelector('#ach-seo-extra')||{}).value||'' };
      } else {
        idea = ideaInput.value.trim();
        if (!idea) {
          ideaInput.style.borderColor = 'rgba(239,68,68,.5)';
          ideaInput.focus();
          setTimeout(function() { ideaInput.style.borderColor = ''; }, 1500);
          return;
        }
      }
      genBtn.disabled = true;
      genText.textContent = '⏳';

      setTimeout(function() {
        var tmpl = PROMPT_TEMPLATES[selectedTemplate] || PROMPT_TEMPLATES.general;
        var prompt = tmpl.build(idea, 'en');

        // Append output language instruction
        if (selectedOutputLang === 'ar') {
          prompt += '\n\n## Language\nIMPORTANT: You MUST respond entirely in Arabic (العربية). Write everything in Arabic.';
        } else {
          prompt += '\n\n## Language\nIMPORTANT: You MUST respond entirely in English regardless of the input language.';
        }

        resultTxt.textContent = prompt;
        resultBox.hidden = false;
        genBtn.disabled = false;
        genText.textContent = genText.getAttribute('data-en') || '\u2726 Generate Smart Prompt';
        // Restore correct language label
        try {
          chrome.storage.local.get('uiLang', function(r) {
            if (r.uiLang) genText.textContent = genText.getAttribute('data-' + r.uiLang) || genText.textContent;
          });
        } catch(_) {}
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Save to history
        PromptHistory.save({ idea: (typeof idea === 'object' ? JSON.stringify(idea) : idea), template: selectedTemplate, outputLang: selectedOutputLang, prompt: prompt, ts: Date.now() });
      }, 100);
    });

    // Copy
    overlay.querySelector('#ach-copy-result').addEventListener('click', function() {
      var text = resultTxt.textContent;
      if (!text) return;
      navigator.clipboard.writeText(text).then(function() {
        var btn = overlay.querySelector('#ach-copy-result');
        var original = btn.textContent;
        btn.textContent = '\u2713';
        btn.style.color = '#10b981';
        setTimeout(function() { btn.textContent = original; btn.style.color = ''; }, 1500);
      });
    });

    // Insert — async, non-blocking
    overlay.querySelector('#ach-insert-result').addEventListener('click', function() {
      var text = resultTxt.textContent;
      if (!text) return;
      var btn = overlay.querySelector('#ach-insert-result');
      btn.disabled = true;
      btn.textContent = '⏳';
      // Defer heavy injection to next frame so UI stays responsive
      requestAnimationFrame(function() {
        setTimeout(function() {
          var ok = injectIntoInput(text);
          if (ok) {
            btn.textContent = '\u2713';
            btn.style.color = '#60a5fa';
            btn.disabled = false;
            setTimeout(function() { btn.textContent = '\u2B06 Insert'; btn.style.color = ''; }, 1500);
          } else {
            navigator.clipboard.writeText(text);
            btn.textContent = '\uD83D\uDCCB Copied!';
            btn.disabled = false;
            setTimeout(function() { btn.textContent = '\u2B06 Insert'; }, 2000);
          }
        }, 50);
      });
    });

    // Context-Aware button: fill idea from last AI response on page
    var ctxBtn = overlay.querySelector('#ach-context-btn');
    ctxBtn.addEventListener('click', function() {
      var lastResp = getLastAIResponse();
      if (lastResp) {
        ideaInput.value = 'Based on this AI response, '  + lastResp.slice(0, 300);
        ideaInput.focus();
        ctxBtn.textContent = '\u2713';
        ctxBtn.style.color = '#10b981';
        setTimeout(function() {
          ctxBtn.textContent = ctxBtn.getAttribute('data-en') || '\uD83E\uDDE0 Use Context';
          ctxBtn.style.color = '';
        }, 1500);
      } else {
        ctxBtn.textContent = '? No response found';
        setTimeout(function() { ctxBtn.textContent = ctxBtn.getAttribute('data-en') || '\uD83E\uDDE0 Use Context'; }, 2000);
      }
    });

    // History panel toggle
    var histBtn   = overlay.querySelector('#ach-history-btn');
    var histPanel = overlay.querySelector('#ach-history-panel');
    var histList  = overlay.querySelector('#ach-history-list');

    function renderHistory() {
      PromptHistory.load(function(items) {
        if (!items.length) {
          histList.textContent = '';
          var emptyDiv = document.createElement('div');
          emptyDiv.className = 'ach-hist-empty';
          emptyDiv.textContent = 'No history yet';
          histList.appendChild(emptyDiv);
          return;
        }
        histList.textContent = '';
        items.forEach(function(item, idx) {
          var d = new Date(item.ts);
          var time = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
          var preview = (item.idea || '').slice(0, 60) + ((item.idea || '').length > 60 ? '\u2026' : '');

          var row = document.createElement('div');
          row.className = 'ach-hist-item';
          row.setAttribute('data-idx', idx);

          var prevSpan = document.createElement('span');
          prevSpan.className = 'ach-hist-preview';
          prevSpan.textContent = preview;  // safe: textContent, no XSS

          var metaSpan = document.createElement('span');
          metaSpan.className = 'ach-hist-meta';
          metaSpan.textContent = (item.template || 'general') + ' \u00b7 ' + time;

          row.appendChild(prevSpan);
          row.appendChild(metaSpan);

          row.addEventListener('click', function() {
            var clickedItem = items[idx];
            if (!clickedItem) return;
            ideaInput.value = clickedItem.idea || '';
            if (clickedItem.template) {
              overlay.querySelectorAll('.ach-tmpl-btn').forEach(function(b) { b.classList.remove('active'); });
              var tb = overlay.querySelector('.ach-tmpl-btn[data-key="' + clickedItem.template + '"]');
              if (tb) { tb.classList.add('active'); selectedTemplate = clickedItem.template; }
            }
            histPanel.hidden = true;
            ideaInput.focus();
          });

          histList.appendChild(row);
        });
      });
    }

    histBtn.addEventListener('click', function() {
      histPanel.hidden = !histPanel.hidden;
      if (!histPanel.hidden) renderHistory();
    });

    overlay.querySelector('#ach-history-clear').addEventListener('click', function() {
      PromptHistory.clear();
      renderHistory();
    });

    ideaInput.focus();
  }

  /* ── Public API ────────────────────────────────── */
  window.__aiChatHelperPromptEngineer = {
    toggle: init,
    isOpen: function() { return !!document.getElementById('ach-prompt-overlay'); }
  };

  init();
})();
