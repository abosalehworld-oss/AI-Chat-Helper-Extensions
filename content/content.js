'use strict';

/**
 * AI Chat Helper — Content Extraction System
 * ============================================
 * Injected into AI chat pages to extract conversations.
 *
 * Supported platforms:
 *   • ChatGPT   (chatgpt.com, chat.openai.com)
 *   • Claude     (claude.ai)
 *   • Gemini     (gemini.google.com)
 *   • Copilot    (copilot.microsoft.com)
 *   • Perplexity (perplexity.ai)
 *   • Generic    (fallback for any chat-like page)
 *
 * Security: No eval(), no external requests, no DOM mutations,
 *           no cookie/localStorage access.
 */

/* ──────────────────────────────────────────────
   §1  Platform Detection
   ────────────────────────────────────────────── */

/**
 * Detect the current AI platform from the page hostname.
 * @returns {{ id: string, name: string }}
 */
function detectPlatform() {
  const host = window.location.hostname.toLowerCase();

  if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
    return { id: 'chatgpt', name: 'ChatGPT' };
  }
  if (host.includes('claude.ai')) {
    return { id: 'claude', name: 'Claude' };
  }
  if (host.includes('gemini.google.com')) {
    return { id: 'gemini', name: 'Google Gemini' };
  }
  if (host.includes('copilot.microsoft.com') || host.includes('bing.com')) {
    return { id: 'copilot', name: 'Microsoft Copilot' };
  }
  if (host.includes('perplexity.ai')) {
    return { id: 'perplexity', name: 'Perplexity' };
  }
  if (host.includes('deepseek.com')) {
    return { id: 'deepseek', name: 'DeepSeek' };
  }
  if (host.includes('grok.com') || host.includes('x.com')) {
    return { id: 'grok', name: 'Grok' };
  }
  if (host.includes('huggingface.co')) {
    return { id: 'huggingface', name: 'HuggingFace Chat' };
  }
  if (host.includes('poe.com')) {
    return { id: 'poe', name: 'Poe' };
  }
  if (host.includes('you.com')) {
    return { id: 'you', name: 'You.com' };
  }

  return { id: 'unknown', name: 'Unknown AI Chat' };
}


/* ──────────────────────────────────────────────
   §2  Rich-Text → Markdown Conversion
   ────────────────────────────────────────────── */

/**
 * Recursively convert a DOM subtree to Markdown-like plain text,
 * preserving code blocks, lists, headers, links, bold/italic,
 * tables, and image alt text.
 *
 * @param {Node} node
 * @param {Object} ctx  – recursive context (listDepth, ordered, index)
 * @returns {string}
 */
function nodeToMarkdown(node, ctx) {
  if (!ctx) ctx = { listDepth: 0 };

  // --- Text node ---
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  // --- Element node ---
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName.toLowerCase();

  // Skip hidden elements
  const style = window.getComputedStyle(node);
  if (style && style.display === 'none') return '';

  // ---- Code blocks (<pre><code>) ----
  if (tag === 'pre') {
    const codeEl = node.querySelector('code');
    const raw = codeEl ? codeEl.textContent : node.textContent;
    // Try to detect language from class (e.g. language-python, hljs language-js)
    let lang = '';
    if (codeEl) {
      const cls = codeEl.className || '';
      const match = cls.match(/(?:language-|lang-)(\w+)/);
      if (match) lang = match[1];
    }
    return '\n```' + lang + '\n' + raw.replace(/\n+$/, '') + '\n```\n';
  }

  // ---- Inline code ----
  if (tag === 'code') {
    // Only inline if not inside <pre>
    if (!node.closest('pre')) {
      return '`' + node.textContent + '`';
    }
    return node.textContent;
  }

  // ---- Headers ----
  const headerMatch = tag.match(/^h([1-6])$/);
  if (headerMatch) {
    const level = parseInt(headerMatch[1], 10);
    const inner = childrenToMarkdown(node, ctx);
    return '\n' + '#'.repeat(level) + ' ' + inner.trim() + '\n';
  }

  // ---- Bold / Strong ----
  if (tag === 'strong' || tag === 'b') {
    const inner = childrenToMarkdown(node, ctx);
    return '**' + inner.trim() + '**';
  }

  // ---- Italic / Em ----
  if (tag === 'em' || tag === 'i') {
    const inner = childrenToMarkdown(node, ctx);
    return '*' + inner.trim() + '*';
  }

  // ---- Links ----
  if (tag === 'a') {
    const inner = childrenToMarkdown(node, ctx);
    const href = node.getAttribute('href') || '';
    if (href && href !== '#') {
      return '[' + inner.trim() + '](' + href + ')';
    }
    return inner;
  }

  // ---- Images ----
  if (tag === 'img') {
    const alt = node.getAttribute('alt') || 'image';
    const src = node.getAttribute('src') || '';
    return '![' + alt + '](' + src + ')';
  }

  // ---- Unordered list ----
  if (tag === 'ul') {
    let result = '\n';
    const items = node.querySelectorAll(':scope > li');
    items.forEach(function (li) {
      const inner = nodeToMarkdown(li, { listDepth: ctx.listDepth + 1, ordered: false, index: 0 });
      const indent = '  '.repeat(ctx.listDepth);
      result += indent + '- ' + inner.trim() + '\n';
    });
    return result;
  }

  // ---- Ordered list ----
  if (tag === 'ol') {
    let result = '\n';
    const items = node.querySelectorAll(':scope > li');
    let idx = parseInt(node.getAttribute('start'), 10) || 1;
    items.forEach(function (li) {
      const inner = nodeToMarkdown(li, { listDepth: ctx.listDepth + 1, ordered: true, index: idx });
      const indent = '  '.repeat(ctx.listDepth);
      result += indent + idx + '. ' + inner.trim() + '\n';
      idx++;
    });
    return result;
  }

  // ---- Table ----
  if (tag === 'table') {
    return convertTable(node);
  }

  // ---- Line breaks ----
  if (tag === 'br') {
    return '\n';
  }

  // ---- Horizontal rule ----
  if (tag === 'hr') {
    return '\n---\n';
  }

  // ---- Block elements: wrap with newlines ----
  if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article'
      || tag === 'blockquote' || tag === 'details' || tag === 'summary') {
    let inner = childrenToMarkdown(node, ctx);
    if (tag === 'blockquote') {
      inner = inner.split('\n').map(function (line) { return '> ' + line; }).join('\n');
    }
    if (tag === 'p' || tag === 'div') {
      return '\n' + inner + '\n';
    }
    return inner;
  }

  // ---- Default: recurse into children ----
  return childrenToMarkdown(node, ctx);
}

/**
 * Convert all child nodes to markdown.
 */
function childrenToMarkdown(el, ctx) {
  let result = '';
  el.childNodes.forEach(function (child) {
    result += nodeToMarkdown(child, ctx);
  });
  return result;
}

/**
 * Convert an HTML <table> to Markdown table syntax.
 * @param {HTMLTableElement} table
 * @returns {string}
 */
function convertTable(table) {
  const rows = [];
  table.querySelectorAll('tr').forEach(function (tr) {
    const cells = [];
    tr.querySelectorAll('th, td').forEach(function (cell) {
      cells.push(cell.textContent.trim().replace(/\|/g, '\\|'));
    });
    rows.push(cells);
  });

  if (rows.length === 0) return '';

  let md = '\n';
  // Header row
  md += '| ' + rows[0].join(' | ') + ' |\n';
  md += '| ' + rows[0].map(function () { return '---'; }).join(' | ') + ' |\n';
  // Data rows
  for (let i = 1; i < rows.length; i++) {
    md += '| ' + rows[i].join(' | ') + ' |\n';
  }
  return md + '\n';
}


/* ──────────────────────────────────────────────
   §3  Platform-Specific Extractors
   ────────────────────────────────────────────── */

/**
 * Each extractor returns an array of { role, content } objects.
 * They use a cascading selector strategy:
 *   L1 → data-testid / data-* attributes   (most stable)
 *   L2 → ARIA roles / semantic HTML
 *   L3 → Structural patterns
 *   L4 → Generic text extraction
 */

// ---- 3a. ChatGPT ----
function extractChatGPT() {
  let messages = [];

  // L1: data-message-author-role attribute (most reliable)
  const l1 = document.querySelectorAll('[data-message-author-role]');
  if (l1.length > 0) {
    l1.forEach(function (el) {
      const role = el.getAttribute('data-message-author-role');
      const normalizedRole = (role === 'user') ? 'user' : 'assistant';
      // The message content is usually inside a .markdown or the element itself
      const contentEl = el.querySelector('[data-message-id]') || el;
      messages.push({
        role: normalizedRole,
        content: nodeToMarkdown(contentEl, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L2: data-testid conversation turns
  const l2 = document.querySelectorAll('[data-testid*="conversation-turn"]');
  if (l2.length > 0) {
    l2.forEach(function (turn) {
      // Determine role from data-testid or inner structure
      const testId = turn.getAttribute('data-testid') || '';
      let role = 'assistant';
      if (testId.includes('user') || turn.querySelector('[data-message-author-role="user"]')) {
        role = 'user';
      }
      const contentArea = turn.querySelector('[data-message-id]')
                       || turn.querySelector('.markdown')
                       || turn;
      messages.push({
        role: role,
        content: nodeToMarkdown(contentArea, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L3: article elements inside main
  const l3 = document.querySelectorAll('main article');
  if (l3.length > 0) {
    l3.forEach(function (article, i) {
      messages.push({
        role: (i % 2 === 0) ? 'user' : 'assistant',
        content: nodeToMarkdown(article, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L4: generic fallback for ChatGPT
  return extractGeneric();
}

// ---- 3b. Claude ----
function extractClaude() {
  var messages = [];

  // ═══════════════════════════════════════════════════════
  // STRATEGY 1: Action-bar based detection (MOST RELIABLE 2024-2026)
  // Claude puts a "Message actions" group on every message.
  // AI messages have a "Give positive feedback" button; human ones don't.
  // ═══════════════════════════════════════════════════════
  var actionBars = document.querySelectorAll('[role="group"][aria-label="Message actions"]');
  if (actionBars.length > 0) {
    var allTurns = [];
    actionBars.forEach(function (bar) {
      // Walk up to find the message container (usually 2-4 levels up)
      var msgContainer = bar.closest('[data-testid]')
                      || bar.closest('[class*="message"]')
                      || bar.parentElement && bar.parentElement.parentElement
                      || bar.parentElement;

      if (!msgContainer) return;

      // Determine role: AI messages have a thumbs-up feedback button
      var hasFeedback = bar.querySelector('button[aria-label*="feedback"], button[aria-label*="Feedback"]');
      var role = hasFeedback ? 'assistant' : 'user';

      // Find the actual content element (sibling or child, NOT the action bar itself)
      var contentEl = null;

      // Try to find a content area that's a sibling of the action bar's parent
      var barParent = bar.parentElement;
      if (barParent) {
        var siblings = barParent.parentElement ? barParent.parentElement.children : [];
        for (var s = 0; s < siblings.length; s++) {
          var sib = siblings[s];
          if (sib !== barParent && sib.textContent && sib.textContent.trim().length > 0) {
            // Pick the sibling with actual text content (the message body)
            if (!sib.querySelector('[role="group"][aria-label="Message actions"]')) {
              contentEl = sib;
              break;
            }
          }
        }
      }

      if (!contentEl) {
        // Fallback: use the whole message container but skip the action bar
        contentEl = msgContainer;
      }

      allTurns.push({ el: contentEl, role: role, anchor: bar });
    });

    // Sort by document position
    allTurns.sort(function (a, b) {
      var pos = a.anchor.compareDocumentPosition(b.anchor);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    allTurns.forEach(function (item) {
      var text = nodeToMarkdown(item.el, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({ role: item.role, content: text });
      }
    });

    if (messages.length > 0) return messages;
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 2: data-testid selectors (older Claude versions)
  // ═══════════════════════════════════════════════════════
  var l1Human = document.querySelectorAll(
    '[data-testid="human-turn"], [data-testid*="human-message"], [data-testid*="user-turn"], [data-testid*="user-message"]'
  );
  var l1Assistant = document.querySelectorAll(
    '[data-testid="ai-turn"], [data-testid*="ai-message"], [data-testid*="assistant-turn"], [data-testid*="assistant-message"], [data-testid*="claude-message"]'
  );

  if (l1Human.length > 0 || l1Assistant.length > 0) {
    var allTestIdTurns = [];
    l1Human.forEach(function (el) { allTestIdTurns.push({ el: el, role: 'user' }); });
    l1Assistant.forEach(function (el) { allTestIdTurns.push({ el: el, role: 'assistant' }); });

    allTestIdTurns.sort(function (a, b) {
      var pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    allTestIdTurns.forEach(function (item) {
      messages.push({
        role: item.role,
        content: nodeToMarkdown(item.el, { listDepth: 0 }).trim()
      });
    });
    if (messages.length > 0) return messages;
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 3: Claude-specific class patterns
  // Claude uses classes like "font-claude-message", "[class*='claude']"
  // ═══════════════════════════════════════════════════════
  var claudeMessages = document.querySelectorAll(
    '.font-claude-message, [class*="claude-message"], [class*="response-message"]'
  );
  var humanMessages = document.querySelectorAll(
    '[class*="human-message"], [class*="user-message"]'
  );

  if (claudeMessages.length > 0 || humanMessages.length > 0) {
    var allClassTurns = [];
    humanMessages.forEach(function (el) { allClassTurns.push({ el: el, role: 'user' }); });
    claudeMessages.forEach(function (el) { allClassTurns.push({ el: el, role: 'assistant' }); });

    allClassTurns.sort(function (a, b) {
      var pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    allClassTurns.forEach(function (item) {
      var text = nodeToMarkdown(item.el, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({ role: item.role, content: text });
      }
    });
    if (messages.length > 0) return messages;
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 4: Conversation thread — find the scrollable chat area
  // and detect role by content length heuristic + copy button presence
  // ═══════════════════════════════════════════════════════
  var threadContainer = document.querySelector('[class*="thread"], [class*="conversation"], [class*="chat-messages"]')
                     || document.querySelector('[role="main"]')
                     || document.querySelector('main');

  if (threadContainer) {
    // Look for direct child divs that are message-like
    var childDivs = threadContainer.querySelectorAll(':scope > div > div');
    if (childDivs.length === 0) {
      childDivs = threadContainer.querySelectorAll(':scope > div');
    }

    if (childDivs.length > 1) {
      var foundMessages = [];
      childDivs.forEach(function (child) {
        var text = nodeToMarkdown(child, { listDepth: 0 }).trim();
        if (text.length < 5) return; // skip empty/tiny divs

        // Heuristic: AI messages typically have copy buttons and are longer
        var hasCopyBtn = child.querySelector('button[data-testid*="copy"], button[aria-label*="Copy"], button[aria-label*="copy"]');
        var hasFeedbackBtn = child.querySelector('button[aria-label*="feedback"], button[aria-label*="Feedback"]');

        var role;
        if (hasFeedbackBtn || hasCopyBtn) {
          role = 'assistant';
        } else if (text.length < 500 && !hasCopyBtn) {
          role = 'user';
        } else {
          // If it has substantial content, assume assistant
          role = 'assistant';
        }

        foundMessages.push({ role: role, content: text });
      });

      // Validate: ensure we have at least one user and one assistant
      var hasUser = foundMessages.some(function (m) { return m.role === 'user'; });
      var hasAssistant = foundMessages.some(function (m) { return m.role === 'assistant'; });

      if (foundMessages.length > 0 && hasUser && hasAssistant) {
        return foundMessages;
      }

      // If only one role detected, try alternating pattern
      if (foundMessages.length > 1 && (!hasUser || !hasAssistant)) {
        var altMessages = [];
        foundMessages.forEach(function (m, i) {
          altMessages.push({
            role: (i % 2 === 0) ? 'user' : 'assistant',
            content: m.content
          });
        });
        return altMessages;
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 5: ARIA / semantic — role="presentation" or "log"
  // ═══════════════════════════════════════════════════════
  var ariaEls = document.querySelectorAll('[role="presentation"], [role="log"] > *, [role="region"]');
  if (ariaEls.length > 0) {
    ariaEls.forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (text.length < 5) return;
      var role = 'assistant';
      if (el.querySelector('[contenteditable]') || text.length < 300) {
        role = 'user';
      }
      messages.push({
        role: role,
        content: nodeToMarkdown(el, { listDepth: 0 }).trim()
      });
    });
    if (messages.length > 0) return messages;
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 6: Brute-force — grab ALL substantial text blocks from <main>
  // and use alternating pattern (user/assistant/user/assistant...)
  // This is the last resort but ensures SOMETHING is always returned.
  // ═══════════════════════════════════════════════════════
  var mainEl = document.querySelector('[role="main"]') || document.querySelector('main') || document.body;
  var textBlocks = [];

  // Find all text-containing divs that are likely message blocks
  var allDivs = mainEl.querySelectorAll('div');
  allDivs.forEach(function (div) {
    // Skip if it's a child of another matched div (avoid nesting)
    var text = div.textContent || '';
    if (text.trim().length < 20) return;
    // Only include "leaf" content divs (that have actual text, not just wrappers)
    var directText = '';
    for (var c = 0; c < div.childNodes.length; c++) {
      if (div.childNodes[c].nodeType === Node.TEXT_NODE) {
        directText += div.childNodes[c].textContent;
      }
    }
    // Must have some direct text or contain p/pre/code/li elements
    var hasContentChildren = div.querySelector('p, pre, code, li, h1, h2, h3, h4, ol, ul, table, blockquote');
    if (directText.trim().length > 10 || hasContentChildren) {
      // Check this div isn't a parent of an already-found div
      var isParentOfExisting = textBlocks.some(function (existing) {
        return div.contains(existing.el);
      });
      if (!isParentOfExisting) {
        // Remove any existing that is a parent of this div
        textBlocks = textBlocks.filter(function (existing) {
          return !existing.el.contains(div);
        });
        textBlocks.push({ el: div, text: text.trim() });
      }
    }
  });

  // Filter to only substantial blocks (likely messages)
  textBlocks = textBlocks.filter(function (b) { return b.text.length > 20; });

  if (textBlocks.length > 1) {
    textBlocks.forEach(function (block, i) {
      messages.push({
        role: (i % 2 === 0) ? 'user' : 'assistant',
        content: nodeToMarkdown(block.el, { listDepth: 0 }).trim()
      });
    });
    if (messages.length > 0) return messages;
  }

  // L_FINAL: generic fallback
  return extractGeneric();
}

// ---- 3c. Google Gemini ----
function extractGemini() {
  let messages = [];

  // L1: model-response and user-query custom elements / data attributes
  const userQueries = document.querySelectorAll(
    'user-query, [data-testid="user-query"], [data-query-id]'
  );
  const modelResponses = document.querySelectorAll(
    'model-response, [data-testid="model-response"], [data-response-id]'
  );

  if (userQueries.length > 0 || modelResponses.length > 0) {
    const allTurns = [];
    userQueries.forEach(function (el) { allTurns.push({ el: el, role: 'user' }); });
    modelResponses.forEach(function (el) { allTurns.push({ el: el, role: 'assistant' }); });

    allTurns.sort(function (a, b) {
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    allTurns.forEach(function (item) {
      const contentEl = item.el.querySelector('message-content, .message-content')
                     || item.el;
      messages.push({
        role: item.role,
        content: nodeToMarkdown(contentEl, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L2: ARIA / semantic selectors
  const l2 = document.querySelectorAll('[role="listitem"], [role="article"]');
  if (l2.length > 0) {
    l2.forEach(function (el, i) {
      messages.push({
        role: (i % 2 === 0) ? 'user' : 'assistant',
        content: nodeToMarkdown(el, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L3: conversation container patterns
  const container = document.querySelector('.conversation-container, [class*="conversation"]');
  if (container) {
    const turns = container.querySelectorAll(':scope > div');
    turns.forEach(function (turn, i) {
      const text = nodeToMarkdown(turn, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({
          role: (i % 2 === 0) ? 'user' : 'assistant',
          content: text
        });
      }
    });
    if (messages.length > 0) return messages;
  }

  // L4: generic
  return extractGeneric();
}

// ---- 3d. Copilot ----
function extractCopilot() {
  let messages = [];

  // L1: cib-message-group custom elements
  const cibGroups = document.querySelectorAll(
    'cib-message-group, [data-testid="message-group"], [data-testid*="cib-message"]'
  );
  if (cibGroups.length > 0) {
    cibGroups.forEach(function (group) {
      const source = group.getAttribute('source') || '';
      const role = (source === 'user') ? 'user' : 'assistant';

      // Dive into shadow DOM if necessary
      let contentEl = group;
      if (group.shadowRoot) {
        contentEl = group.shadowRoot.querySelector('.content, .response-message-group') || group;
      }

      const cibMessages = contentEl.querySelectorAll
        ? contentEl.querySelectorAll('cib-message, [data-testid="message"]')
        : [];

      if (cibMessages.length > 0) {
        cibMessages.forEach(function (msg) {
          let inner = msg;
          if (msg.shadowRoot) {
            inner = msg.shadowRoot.querySelector('.content, .text-message-content') || msg;
          }
          messages.push({
            role: role,
            content: nodeToMarkdown(inner, { listDepth: 0 }).trim()
          });
        });
      } else {
        messages.push({
          role: role,
          content: nodeToMarkdown(contentEl, { listDepth: 0 }).trim()
        });
      }
    });
    return messages;
  }

  // L2: data-content attribute or ARIA roles
  const l2 = document.querySelectorAll('[data-content="ai-message"], [data-content="user-message"]');
  if (l2.length > 0) {
    l2.forEach(function (el) {
      const content = el.getAttribute('data-content') || '';
      const role = content.includes('user') ? 'user' : 'assistant';
      messages.push({
        role: role,
        content: nodeToMarkdown(el, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L3: response containers
  const responses = document.querySelectorAll('[class*="response"], [class*="message"]');
  if (responses.length > 0) {
    responses.forEach(function (el, i) {
      const text = nodeToMarkdown(el, { listDepth: 0 }).trim();
      if (text.length > 20) {
        messages.push({
          role: (i % 2 === 0) ? 'user' : 'assistant',
          content: text
        });
      }
    });
    if (messages.length > 0) return messages;
  }

  // L4: generic
  return extractGeneric();
}

// ---- 3e. Perplexity ----
function extractPerplexity() {
  let messages = [];

  // L1: data-testid patterns
  const l1 = document.querySelectorAll(
    '[data-testid*="query"], [data-testid*="answer"], [data-testid*="message"]'
  );
  if (l1.length > 0) {
    l1.forEach(function (el) {
      const testId = el.getAttribute('data-testid') || '';
      let role = 'assistant';
      if (testId.includes('query') || testId.includes('user')) {
        role = 'user';
      }
      messages.push({
        role: role,
        content: nodeToMarkdown(el, { listDepth: 0 }).trim()
      });
    });
    return messages;
  }

  // L2: .prose class (commonly used for answer content) and ARIA roles
  const queries = document.querySelectorAll('[role="heading"], .query-text, [class*="query"]');
  const answers = document.querySelectorAll('.prose, [class*="answer"], [role="article"]');

  if (queries.length > 0 || answers.length > 0) {
    const allTurns = [];
    queries.forEach(function (el) { allTurns.push({ el: el, role: 'user' }); });
    answers.forEach(function (el) { allTurns.push({ el: el, role: 'assistant' }); });

    allTurns.sort(function (a, b) {
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    allTurns.forEach(function (item) {
      const text = nodeToMarkdown(item.el, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({ role: item.role, content: text });
      }
    });
    if (messages.length > 0) return messages;
  }

  // L3: thread-based structure
  const thread = document.querySelector('[class*="thread"], [class*="conversation"]');
  if (thread) {
    const blocks = thread.querySelectorAll(':scope > div');
    blocks.forEach(function (block, i) {
      const text = nodeToMarkdown(block, { listDepth: 0 }).trim();
      if (text.length > 10) {
        messages.push({
          role: (i % 2 === 0) ? 'user' : 'assistant',
          content: text
        });
      }
    });
    if (messages.length > 0) return messages;
  }

  // L4: generic
  return extractGeneric();
}


/* ──────────────────────────────────────────────
   §4  Generic / Fallback Extractor
   ────────────────────────────────────────────── */

/**
 * Attempt to intelligently extract chat-like content from any page.
 * Uses ARIA roles, semantic HTML, and structural patterns.
 * @returns {Array<{ role: string, content: string }>}
 */
function extractGeneric() {
  const messages = [];

  // Strategy A: look for role="log" (chat log landmark)
  const chatLog = document.querySelector('[role="log"]');
  if (chatLog) {
    const children = chatLog.querySelectorAll(':scope > *');
    children.forEach(function (child, i) {
      const text = nodeToMarkdown(child, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({
          role: (i % 2 === 0) ? 'user' : 'assistant',
          content: text
        });
      }
    });
    if (messages.length > 0) return messages;
  }

  // Strategy B: look for article elements
  const articles = document.querySelectorAll('main article, [role="main"] article');
  if (articles.length > 0) {
    articles.forEach(function (article, i) {
      const text = nodeToMarkdown(article, { listDepth: 0 }).trim();
      if (text.length > 0) {
        messages.push({
          role: (i % 2 === 0) ? 'user' : 'assistant',
          content: text
        });
      }
    });
    if (messages.length > 0) return messages;
  }

  // Strategy C: data-role or data-author attributes anywhere
  const dataRoleEls = document.querySelectorAll('[data-role], [data-author]');
  if (dataRoleEls.length > 0) {
    dataRoleEls.forEach(function (el) {
      const dr = (el.getAttribute('data-role') || el.getAttribute('data-author') || '').toLowerCase();
      let role = 'assistant';
      if (dr === 'user' || dr === 'human') role = 'user';
      messages.push({
        role: role,
        content: nodeToMarkdown(el, { listDepth: 0 }).trim()
      });
    });
    if (messages.length > 0) return messages;
  }

  // Strategy D: main content area — grab all substantial text blocks
  const mainEl = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  const blocks = mainEl.querySelectorAll('p, pre, h1, h2, h3, h4, h5, h6, li, blockquote, table');
  if (blocks.length > 0) {
    let combined = '';
    blocks.forEach(function (block) {
      combined += nodeToMarkdown(block, { listDepth: 0 }) + '\n';
    });
    combined = combined.trim();
    if (combined.length > 0) {
      messages.push({ role: 'assistant', content: combined });
    }
  }

  return messages;
}


/* ──────────────────────────────────────────────
   §5  Title Extraction
   ────────────────────────────────────────────── */

/**
 * Try to obtain a meaningful conversation title.
 * @param {Array} messages – already-extracted messages
 * @returns {string}
 */
function getConversationTitle(messages) {
  // 1. Try the page <title>
  const pageTitle = (document.title || '').trim();

  // Filter out generic titles
  const genericTitles = [
    'chatgpt', 'claude', 'gemini', 'copilot', 'perplexity',
    'new chat', 'new conversation', 'untitled', ''
  ];

  if (pageTitle && !genericTitles.some(function (g) {
    return pageTitle.toLowerCase().replace(/[^a-z0-9]/g, '') === g;
  })) {
    return pageTitle;
  }

  // 2. Use the first user message (truncated)
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const first = messages[i].content.split('\n')[0].trim();
      return first.length > 100 ? first.substring(0, 100) + '…' : first;
    }
  }

  // 3. Fallback
  return 'AI Chat Conversation';
}


/* ──────────────────────────────────────────────
   §6  Statistics
   ────────────────────────────────────────────── */

/**
 * Compute conversation statistics.
 * @param {Array} messages
 * @returns {{ messageCount: number, wordCount: number, userMessages: number, assistantMessages: number }}
 */
function computeStats(messages) {
  let wordCount = 0;
  let userMessages = 0;
  let assistantMessages = 0;

  messages.forEach(function (msg) {
    // Count words (handle mixed LTR/RTL text)
    const words = msg.content.split(/\s+/).filter(function (w) { return w.length > 0; });
    wordCount += words.length;

    if (msg.role === 'user') {
      userMessages++;
    } else {
      assistantMessages++;
    }
  });

  return {
    messageCount: messages.length,
    wordCount: wordCount,
    userMessages: userMessages,
    assistantMessages: assistantMessages
  };
}


/* ──────────────────────────────────────────────
   §7  Auto-Scroll to Load Full Conversation
   ────────────────────────────────────────────── */

/**
 * Scrolls the conversation container to the TOP so the browser renders
 * all older messages (virtual scrolling), then waits for DOM to settle,
 * then restores scroll position.
 *
 * Most AI platforms use virtual/windowed rendering — only ~20 messages
 * are in the DOM at a time. Scrolling to top forces them all to render.
 *
 * @returns {Promise<void>}
 */
async function scrollToLoadAll() {
  // Find the scrollable conversation container
  const scrollTargets = [
    // ChatGPT
    document.querySelector('main'),
    // Claude
    document.querySelector('[role="main"]'),
    // Gemini
    document.querySelector('.conversation-container'),
    // Generic
    document.querySelector('[class*="overflow-y-auto"]'),
    document.querySelector('[class*="scroll"]'),
    document.documentElement,
    document.body
  ].filter(Boolean);

  const container = scrollTargets[0];
  if (!container) return;

  const originalScrollTop = container.scrollTop || window.scrollY;

  // Step 1: Scroll to very top
  container.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Step 2: Wait for virtual DOM to render old messages
  // We poll until scroll height stops growing (meaning all messages are loaded)
  let lastHeight = container.scrollHeight || document.body.scrollHeight;
  let stableCount = 0;
  for (let i = 0; i < 30; i++) {  // max 3 seconds
    await new Promise(r => setTimeout(r, 100));
    const currentHeight = container.scrollHeight || document.body.scrollHeight;
    if (currentHeight === lastHeight) {
      stableCount++;
      if (stableCount >= 3) break;  // stable for 300ms = done
    } else {
      stableCount = 0;
      lastHeight = currentHeight;
    }
  }

  // Step 3: Small extra wait for any lazy images/content
  await new Promise(r => setTimeout(r, 200));
}

/**
 * Full async extract: scrolls to top first to load all messages,
 * then extracts. Use this for Copy / Summarize / Export.
 * @returns {Promise<Object>}
 */
async function extractAsync() {
  await scrollToLoadAll();
  return extract();
}


/* ──────────────────────────────────────────────
   §7b  Main Extract Method (sync)
   ────────────────────────────────────────────── */

/**
 * Extract all chat messages from the current page (sync, no scroll).
 * For full conversations use extractAsync() instead.
 * @returns {Object} Structured conversation data.
 */
function extract() {
  const platform = detectPlatform();

  // Dispatch to the appropriate extractor
  let rawMessages;
  switch (platform.id) {
    case 'chatgpt':    rawMessages = extractChatGPT();    break;
    case 'claude':     rawMessages = extractClaude();      break;
    case 'gemini':     rawMessages = extractGemini();      break;
    case 'copilot':    rawMessages = extractCopilot();     break;
    case 'perplexity': rawMessages = extractPerplexity();  break;
    default:           rawMessages = extractGeneric();     break;
  }

  // Filter out empty messages and add indices
  const messages = [];
  rawMessages.forEach(function (msg, i) {
    if (msg.content && msg.content.length > 0) {
      messages.push({
        role: msg.role,
        content: msg.content,
        index: messages.length
      });
    }
  });

  const title = getConversationTitle(messages);
  const stats = computeStats(messages);

  return {
    platform: platform.id,
    platformName: platform.name,
    title: title,
    url: window.location.href,
    extractedAt: new Date().toISOString(),
    messages: messages,
    stats: stats
  };
}


/* ──────────────────────────────────────────────
   §8  Formatted Output
   ────────────────────────────────────────────── */

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Get the extracted conversation in the requested format.
 * @param {'markdown'|'plaintext'|'html'|'json'} format
 * @returns {string}
 */
function getFormattedText(format) {
  const data = extract();

  switch (format) {

    // ---- Markdown ----
    case 'markdown': {
      let md = '# ' + data.title + '\n\n';
      md += '> **Platform:** ' + data.platformName + '  \n';
      md += '> **Extracted:** ' + data.extractedAt + '  \n';
      md += '> **Messages:** ' + data.stats.messageCount
          + ' (' + data.stats.userMessages + ' user, '
          + data.stats.assistantMessages + ' assistant)  \n';
      md += '> **Words:** ' + data.stats.wordCount + '\n\n';
      md += '---\n\n';

      data.messages.forEach(function (msg) {
        const roleLabel = (msg.role === 'user') ? '**👤 User**' : '**🤖 Assistant**';
        md += '### ' + roleLabel + '\n\n';
        md += msg.content + '\n\n';
        md += '---\n\n';
      });

      return md;
    }

    // ---- Plain text ----
    case 'plaintext': {
      let txt = data.title + '\n';
      txt += '='.repeat(Math.min(data.title.length, 60)) + '\n';
      txt += 'Platform: ' + data.platformName + '\n';
      txt += 'Extracted: ' + data.extractedAt + '\n';
      txt += 'Messages: ' + data.stats.messageCount + '\n';
      txt += 'Words: ' + data.stats.wordCount + '\n';
      txt += '\n' + '─'.repeat(60) + '\n\n';

      data.messages.forEach(function (msg) {
        const roleIcon = (msg.role === 'user') ? '👤 User:' : '🤖 Assistant:';
        txt += roleIcon + '\n';
        // Strip markdown formatting for plain text
        const plainContent = msg.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        txt += plainContent + '\n';
        txt += '\n' + '─'.repeat(60) + '\n\n';
      });

      return txt;
    }

    // ---- HTML ----
    case 'html': {
      let html = '<!DOCTYPE html>\n<html lang="en" dir="auto">\n<head>\n';
      html += '<meta charset="UTF-8">\n';
      html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
      html += '<title>' + escapeHTML(data.title) + '</title>\n';
      html += '<style>\n';
      html += '  * { margin: 0; padding: 0; box-sizing: border-box; }\n';
      html += '  body { font-family: "Inter", "Segoe UI", system-ui, sans-serif; ';
      html += 'background: #0f0f0f; color: #e0e0e0; padding: 2rem; line-height: 1.6; }\n';
      html += '  .header { text-align: center; margin-bottom: 2rem; }\n';
      html += '  .header h1 { font-size: 1.5rem; color: #fff; margin-bottom: 0.5rem; }\n';
      html += '  .header .meta { font-size: 0.85rem; color: #888; }\n';
      html += '  .msg { max-width: 800px; margin: 1rem auto; padding: 1.25rem; ';
      html += 'border-radius: 12px; }\n';
      html += '  .msg-user { background: #1a1a2e; border-left: 3px solid #6c63ff; }\n';
      html += '  .msg-assistant { background: #1a2e1a; border-left: 3px solid #00c896; }\n';
      html += '  .msg .role { font-weight: 700; font-size: 0.8rem; text-transform: uppercase; ';
      html += 'letter-spacing: 0.05em; margin-bottom: 0.5rem; }\n';
      html += '  .msg-user .role { color: #6c63ff; }\n';
      html += '  .msg-assistant .role { color: #00c896; }\n';
      html += '  .msg .content { white-space: pre-wrap; word-wrap: break-word; }\n';
      html += '  pre { background: #111; padding: 1rem; border-radius: 8px; ';
      html += 'overflow-x: auto; margin: 0.5rem 0; }\n';
      html += '  code { font-family: "Fira Code", "Consolas", monospace; font-size: 0.9em; }\n';
      html += '</style>\n</head>\n<body>\n';

      html += '<div class="header">\n';
      html += '  <h1>' + escapeHTML(data.title) + '</h1>\n';
      html += '  <div class="meta">' + escapeHTML(data.platformName)
           + ' &bull; ' + data.stats.messageCount + ' messages &bull; '
           + data.stats.wordCount + ' words &bull; '
           + data.extractedAt + '</div>\n';
      html += '</div>\n';

      data.messages.forEach(function (msg) {
        const cls = (msg.role === 'user') ? 'msg-user' : 'msg-assistant';
        const roleLabel = (msg.role === 'user') ? '👤 User' : '🤖 Assistant';
        html += '<div class="msg ' + cls + '">\n';
        html += '  <div class="role">' + roleLabel + '</div>\n';
        html += '  <div class="content">' + escapeHTML(msg.content) + '</div>\n';
        html += '</div>\n';
      });

      html += '</body>\n</html>';
      return html;
    }

    // ---- JSON ----
    case 'json':
      return JSON.stringify(data, null, 2);

    default:
      return JSON.stringify(data, null, 2);
  }
}


/* ──────────────────────────────────────────────
   §9  Public API — window.__aiChatHelper
   ────────────────────────────────────────────── */

window.__aiChatHelper = {
  /**
   * Extract the full conversation (sync — only what's in DOM right now).
   * @returns {Object}
   */
  extract: extract,

  /**
   * Extract the full conversation with auto-scroll to load all messages.
   * USE THIS for Copy / Summarize / Export on long conversations.
   * @returns {Promise<Object>}
   */
  extractAsync: extractAsync,

  /**
   * Get the conversation formatted as a string (sync).
   * @param {'markdown'|'plaintext'|'html'|'json'} format
   * @returns {string}
   */
  getFormattedText: getFormattedText,

  /**
   * Get the conversation formatted as a string (async, with full scroll).
   * @param {'markdown'|'plaintext'|'html'|'json'} format
   * @returns {Promise<string>}
   */
  getFormattedTextAsync: async function(format) {
    await scrollToLoadAll();
    return getFormattedText(format);
  },

  /** Library version */
  version: '1.0.0'
};
