'use strict';

/**
 * AI Chat Helper — Popup UI Logic
 * Handles copy, summarize, settings, and communication with content scripts.
 */

// ═══════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════

const DOM = {
  // Platform
  platformBadge: null,
  platformDot: null,
  platformName: null,

  // Copy
  btnCopy: null,
  copyCard: null,
  copySuccess: null,
  formatSelector: null,

  // Summarize
  btnSummarize: null,
  lengthSelector: null,

  // Summary result
  summaryResult: null,
  summaryText: null,
  btnCopySummary: null,
  keyPointsSection: null,
  keyPointsList: null,
  topicsSection: null,
  topicsTags: null,

  // Stats
  statMessagesValue: null,
  statWordsValue: null,
  statCharsValue: null,

  // Settings
  settingsToggle: null,
  settingsContent: null,
  toggleFab: null,
  toggleAutoDetect: null,

  // Toast
  toast: null,
  toastIcon: null,
  toastMessage: null,

  // Footer
  footerVersion: null,
};


// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

/** @type {string} Selected copy format */
let selectedFormat = 'markdown';

/** @type {string} Selected summary length */
let selectedLength = 'medium';

/** @type {number|null} Active tab ID */
let activeTabId = null;

/** @type {string|null} Active tab URL */
let activeTabUrl = null;

/** @type {Object|null} Detected platform info */
let detectedPlatform = null;

/** @type {AIChatSummarizer} Summarizer instance */
let summarizer = null;

/** @type {number|null} Toast timeout ID */
let toastTimeout = null;


// ═══════════════════════════════════════════════════════════
// SUPPORTED PLATFORMS
// ═══════════════════════════════════════════════════════════

const PLATFORMS = [
  { name: 'ChatGPT', pattern: /^https?:\/\/(chat\.openai\.com|chatgpt\.com)/i, icon: '🤖' },
  { name: 'Google Gemini', pattern: /^https?:\/\/gemini\.google\.com/i, icon: '✨' },
  { name: 'Claude', pattern: /^https?:\/\/claude\.ai/i, icon: '🧠' },
  { name: 'Microsoft Copilot', pattern: /^https?:\/\/(copilot\.microsoft\.com|www\.bing\.com\/chat)/i, icon: '🔷' },
  { name: 'Perplexity', pattern: /^https?:\/\/(www\.)?perplexity\.ai/i, icon: '🔍' },
  { name: 'DeepSeek', pattern: /^https?:\/\/(chat\.)?deepseek\.com/i, icon: '🌊' },
  { name: 'HuggingChat', pattern: /^https?:\/\/huggingface\.co\/chat/i, icon: '🤗' },
  { name: 'Grok', pattern: /^https?:\/\/(grok\.com|x\.com\/i\/grok)/i, icon: '⚡' },
  { name: 'Poe', pattern: /^https?:\/\/poe\.com/i, icon: '💬' },
  { name: 'You.com', pattern: /^https?:\/\/(you\.com)/i, icon: '🟣' },
];


// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Cache DOM references
  initDOM();

  // Initialize summarizer
  if (typeof AIChatSummarizer !== 'undefined') {
    summarizer = new AIChatSummarizer();
  }

  // Bind event listeners
  bindEventListeners();

  // Load settings
  await loadSettings();

  // Detect platform and update UI
  await detectPlatform();

  // Set version from manifest
  setVersion();
});


/**
 * Cache all DOM element references.
 */
function initDOM() {
  DOM.platformBadge = document.getElementById('platformBadge');
  DOM.platformDot = document.getElementById('platformDot');
  DOM.platformName = document.getElementById('platformName');

  DOM.btnCopy = document.getElementById('btnCopy');
  DOM.copyCard = document.getElementById('copyCard');
  DOM.copySuccess = document.getElementById('copySuccess');
  DOM.formatSelector = document.getElementById('formatSelector');

  DOM.btnSummarize = document.getElementById('btnSummarize');
  DOM.lengthSelector = document.getElementById('lengthSelector');

  DOM.summaryResult = document.getElementById('summaryResult');
  DOM.summaryText = document.getElementById('summaryText');
  DOM.btnCopySummary = document.getElementById('btnCopySummary');
  DOM.keyPointsSection = document.getElementById('keyPointsSection');
  DOM.keyPointsList = document.getElementById('keyPointsList');
  DOM.topicsSection = document.getElementById('topicsSection');
  DOM.topicsTags = document.getElementById('topicsTags');

  DOM.statMessagesValue = document.getElementById('statMessagesValue');
  DOM.statWordsValue = document.getElementById('statWordsValue');
  DOM.statCharsValue = document.getElementById('statCharsValue');

  DOM.settingsToggle = document.getElementById('settingsToggle');
  DOM.settingsContent = document.getElementById('settingsContent');
  DOM.toggleFab = document.getElementById('toggleFab');
  DOM.toggleAutoDetect = document.getElementById('toggleAutoDetect');

  DOM.toast = document.getElementById('toast');
  DOM.toastIcon = document.getElementById('toastIcon');
  DOM.toastMessage = document.getElementById('toastMessage');

  DOM.footerVersion = document.getElementById('footerVersion');

  // Export
  DOM.btnExport = document.getElementById('btnExport');
  DOM.exportFormatSelector = document.getElementById('exportFormatSelector');

  // Prompt Engineer
  DOM.btnPromptEngineer = document.getElementById('btnPromptEngineer');
}


// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function bindEventListeners() {
  // Copy button
  if (DOM.btnCopy) {
    DOM.btnCopy.addEventListener('click', handleCopyClick);
  }

  // Summarize button
  if (DOM.btnSummarize) {
    DOM.btnSummarize.addEventListener('click', handleSummarizeClick);
  }

  // Format selector pills
  if (DOM.formatSelector) {
    DOM.formatSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.format-pill');
      if (!pill) return;

      // Update active state
      DOM.formatSelector.querySelectorAll('.format-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');

      selectedFormat = pill.dataset.format;
    });
  }

  // Length selector pills
  if (DOM.lengthSelector) {
    DOM.lengthSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.format-pill');
      if (!pill) return;

      DOM.lengthSelector.querySelectorAll('.format-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');

      selectedLength = pill.dataset.length;
    });
  }

  // Copy summary button
  if (DOM.btnCopySummary) {
    DOM.btnCopySummary.addEventListener('click', handleCopySummary);
  }

  // Settings toggle
  if (DOM.settingsToggle) {
    DOM.settingsToggle.addEventListener('click', toggleSettings);
  }

  // Setting toggles
  if (DOM.toggleFab) {
    DOM.toggleFab.addEventListener('change', handleFabToggle);
  }
  if (DOM.toggleAutoDetect) {
    DOM.toggleAutoDetect.addEventListener('change', handleAutoDetectToggle);
  }

  // Export format pills
  if (DOM.exportFormatSelector) {
    DOM.exportFormatSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.format-pill');
      if (!pill) return;
      DOM.exportFormatSelector.querySelectorAll('.format-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');
    });
  }

  // Export button
  if (DOM.btnExport) {
    DOM.btnExport.addEventListener('click', handleExportClick);
  }

  // Prompt Engineer button
  if (DOM.btnPromptEngineer) {
    DOM.btnPromptEngineer.addEventListener('click', handlePromptEngineerClick);
  }

  // Language toggle (AR / EN)
  initLanguageToggle();
}


// ═══════════════════════════════════════════════════════════
// PLATFORM DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Detect if the active tab is on a supported AI platform.
 */
async function detectPlatform() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      setPlatformState('unknown', TRANSLATIONS[currentLang].platformUnknown);
      return;
    }

    const tab = tabs[0];
    activeTabId = tab.id;
    activeTabUrl = tab.url || '';

    // Check against known platforms
    detectedPlatform = null;
    for (const platform of PLATFORMS) {
      if (platform.pattern.test(activeTabUrl)) {
        detectedPlatform = platform;
        break;
      }
    }

    if (detectedPlatform) {
      setPlatformState('detected', detectedPlatform.icon + ' ' + detectedPlatform.name);
    } else {
      setPlatformState('unsupported', TRANSLATIONS[currentLang].platformUnsupported);
    }
  } catch (error) {
    console.error('[Popup] Platform detection error:', error);
    setPlatformState('unknown', TRANSLATIONS[currentLang].platformUnknown);
  }
}


/**
 * Update the platform badge UI.
 * @param {'detected'|'unsupported'|'unknown'} state
 * @param {string} label
 */
function setPlatformState(state, label) {
  if (!DOM.platformBadge || !DOM.platformName) return;

  DOM.platformBadge.classList.remove('detected', 'unsupported', 'unknown');

  if (state === 'detected') {
    DOM.platformBadge.classList.add('detected');
  } else if (state === 'unsupported') {
    DOM.platformBadge.classList.add('unsupported');
  } else if (state === 'unknown') {
    DOM.platformBadge.classList.add('unknown');
  }

  DOM.platformName.textContent = label;
}


// ═══════════════════════════════════════════════════════════
// CORE: COPY CHAT
// ═══════════════════════════════════════════════════════════

/**
 * Handle copy button click.
 */
async function handleCopyClick() {
  if (!activeTabId) {
    showToast('No active tab found', 'error');
    return;
  }

  setLoading(DOM.btnCopy, true);

  try {
    const result = await extractChat(selectedFormat);

    if (!result || !result.text) {
      showToast('No messages found on this page', 'error');
      setLoading(DOM.btnCopy, false);
      return;
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(result.text);

    // Update stats
    updateStats(result.stats);

    // Show success
    showCopySuccess();
    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('[Popup] Copy error:', error);
    showToast('Failed to copy: ' + (error.message || 'Unknown error'), 'error');
  } finally {
    setLoading(DOM.btnCopy, false);
  }
}


// ═══════════════════════════════════════════════════════════
// CORE: SUMMARIZE CHAT
// ═══════════════════════════════════════════════════════════

/**
 * Handle summarize button click.
 */
async function handleSummarizeClick() {
  if (!activeTabId) {
    showToast('No active tab found', 'error');
    return;
  }

  if (!summarizer) {
    showToast('Summarizer not loaded', 'error');
    return;
  }

  setLoading(DOM.btnSummarize, true);
  showSummarySkeleton();

  try {
    // Extract raw messages
    const result = await extractChat('json');

    if (!result || !result.text) {
      showToast('No messages found to summarize', 'error');
      hideSummaryResult();
      setLoading(DOM.btnSummarize, false);
      return;
    }

    // Parse messages array properly from JSON result
    let messages;
    try {
      const parsed = JSON.parse(result.text);
      // Handle both: full data object {messages:[...]} and plain array
      if (Array.isArray(parsed)) {
        messages = parsed;
      } else if (parsed && Array.isArray(parsed.messages)) {
        messages = parsed.messages;
      } else {
        messages = [{ role: 'assistant', content: result.text, index: 0 }];
      }
    } catch (_) {
      messages = [{ role: 'assistant', content: result.text, index: 0 }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      showToast('No messages found to summarize', 'error');
      hideSummaryResult();
      setLoading(DOM.btnSummarize, false);
      return;
    }

    // Try Chrome Built-in AI first
    const allText = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join('\n\n');

    let summaryResult = null;

    if (allText.length > 0) {
      summaryResult = await summarizer.summarizeWithBuiltInAI(allText, {
        length: selectedLength
      });
    }

    // Fall back to extractive summarization
    if (!summaryResult) {
      summaryResult = summarizer.summarize(messages, {
        length: selectedLength,
        language: 'auto'
      });
    }

    // Display results
    displaySummary(summaryResult);

    // Update stats
    if (result.stats) {
      updateStats(result.stats);
    }

    showToast('Summary generated!', 'success');
  } catch (error) {
    console.error('[Popup] Summarize error:', error);
    showToast('Failed to summarize: ' + (error.message || 'Unknown error'), 'error');
    hideSummaryResult();
  } finally {
    setLoading(DOM.btnSummarize, false);
  }
}


// ═══════════════════════════════════════════════════════════
// CHAT EXTRACTION (Content Script Injection)
// ═══════════════════════════════════════════════════════════

/**
 * Send a message to service worker with automatic retry if worker is inactive.
 * MV3 service workers can terminate; this wakes them up before critical calls.
 * @param {Object} msg
 * @param {number} retries
 */
async function sendMessageWithRetry(msg, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      if (i === retries - 1) throw err;
      // Small backoff — worker may be waking up
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
}


/**
 * Wait until window.__aiChatHelper is ready in the injected content script.
 * Retries up to 50 times with 200ms gaps (max 10s) — needed for long pages.
 * @param {number} tabId
 */
async function waitForContentScript(tabId) {
  for (let i = 0; i < 50; i++) {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => typeof window.__aiChatHelper !== 'undefined'
    });
    if (res && res[0] && res[0].result === true) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}


/**
 * Extract chat from the active tab by injecting content script.
 * @param {string} format - 'markdown'|'text'|'html'|'json'
 * @returns {Promise<{text: string, stats: Object, messages: Array|null}>}
 */
async function extractChat(format) {
  if (!activeTabId) throw new Error('No active tab');

  // ── Step 1: Inject content script (idempotent — safe to re-inject) ──
  try {
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['content/content.js']
    });
  } catch (err) {
    if (err.message && err.message.includes('Cannot access')) {
      throw new Error('Cannot access this page. Make sure you are on an AI chat page.');
    }
    // Otherwise might already be injected — continue
  }

  // ── Step 2: Wait for content script to be ready ──
  const ready = await waitForContentScript(activeTabId);
  if (!ready) throw new Error('Content script did not load in time. Refresh the page and try again.');

  // ── Step 3: Inject CSS (idempotent) ──
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: activeTabId },
      files: ['content/content.css']
    });
  } catch (_) { /* CSS may already be injected */ }

  // ── Step 4: Get formatted text (async — auto-scrolls to load ALL messages) ──
  const fmtResults = await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: async (fmt) => {
      if (window.__aiChatHelper && window.__aiChatHelper.getFormattedTextAsync) {
        return await window.__aiChatHelper.getFormattedTextAsync(fmt);
      }
      // Fallback to sync if async not available
      if (window.__aiChatHelper && window.__aiChatHelper.getFormattedText) {
        return window.__aiChatHelper.getFormattedText(fmt);
      }
      return null;
    },
    args: [format]
  });

  const fmtText = fmtResults && fmtResults[0] && fmtResults[0].result;
  if (!fmtText) return null;

  // ── Step 5: Also get raw messages array for summarizer ──
  let messages = null;
  if (format === 'json') {
    try {
      const rawData = JSON.parse(fmtText);
      // extract messages array from full data object
      messages = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.messages) ? rawData.messages : null);
    } catch (_) { messages = null; }
  }

  return {
    text: fmtText,
    stats: computeTextStats(fmtText),
    messages: messages
  };
}


/**
 * Compute basic text statistics.
 * @param {string} text
 * @returns {Object}
 */
function computeTextStats(text) {
  if (!text) return { messages: 0, words: 0, chars: 0 };

  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;

  // Estimate message count from common patterns
  const messageMarkers = text.match(/^(User|Assistant|Human|AI|You|ChatGPT|Claude|Gemini|Copilot)[\s]*:/gmi);
  const messages = messageMarkers ? messageMarkers.length : 0;

  return { messages, words, chars };
}


// ═══════════════════════════════════════════════════════════
// UI: SUMMARY DISPLAY
// ═══════════════════════════════════════════════════════════

/**
 * Display the summary result in the UI.
 * @param {Object} result - { summary, keyPoints, topicsCovered }
 */
function displaySummary(result) {
  if (!DOM.summaryResult) return;

  DOM.summaryResult.hidden = false;

  // Summary text (use textContent to prevent XSS)
  if (DOM.summaryText) {
    DOM.summaryText.textContent = result.summary || 'No summary could be generated.';
  }

  // Key points
  if (DOM.keyPointsSection && DOM.keyPointsList) {
    if (result.keyPoints && result.keyPoints.length > 0) {
      DOM.keyPointsSection.hidden = false;
      // Clear existing
      DOM.keyPointsList.textContent = '';

      for (const point of result.keyPoints) {
        const li = document.createElement('li');
        li.textContent = point; // Safe: textContent prevents XSS
        DOM.keyPointsList.appendChild(li);
      }
    } else {
      DOM.keyPointsSection.hidden = true;
    }
  }

  // Topics covered
  if (DOM.topicsSection && DOM.topicsTags) {
    if (result.topicsCovered && result.topicsCovered.length > 0) {
      DOM.topicsSection.hidden = false;
      // Clear existing
      DOM.topicsTags.textContent = '';

      for (const topic of result.topicsCovered) {
        const tag = document.createElement('span');
        tag.className = 'topic-tag';
        tag.textContent = topic; // Safe
        DOM.topicsTags.appendChild(tag);
      }
    } else {
      DOM.topicsSection.hidden = true;
    }
  }
}


/**
 * Show skeleton loading in the summary area.
 */
function showSummarySkeleton() {
  if (!DOM.summaryResult || !DOM.summaryText) return;

  DOM.summaryResult.hidden = false;

  // Create skeleton lines
  DOM.summaryText.textContent = '';
  DOM.summaryText.classList.add('skeleton');

  for (let i = 0; i < 4; i++) {
    const line = document.createElement('div');
    line.className = 'skeleton-line skeleton';
    DOM.summaryText.appendChild(line);
  }

  // Hide key points and topics during loading
  if (DOM.keyPointsSection) DOM.keyPointsSection.hidden = true;
  if (DOM.topicsSection) DOM.topicsSection.hidden = true;
}


/**
 * Hide the summary result area.
 */
function hideSummaryResult() {
  if (DOM.summaryResult) {
    DOM.summaryResult.hidden = true;
  }
}


/**
 * Handle copy summary button click.
 */
async function handleCopySummary() {
  if (!DOM.summaryText) return;

  const text = DOM.summaryText.textContent;
  if (!text) {
    showToast('No summary to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('Summary copied!', 'success');
  } catch (err) {
    console.error('[Popup] Copy summary error:', err);
    showToast('Failed to copy summary', 'error');
  }
}


// ═══════════════════════════════════════════════════════════
// UI: TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  if (!DOM.toast || !DOM.toastMessage || !DOM.toastIcon) return;

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  // Set icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  DOM.toastIcon.textContent = icons[type] || icons.info;
  DOM.toastMessage.textContent = message; // Safe: textContent

  // Set style class
  DOM.toast.classList.remove('success', 'error', 'info');
  DOM.toast.classList.add(type);

  // Show
  DOM.toast.hidden = false;
  // Force reflow for animation
  DOM.toast.offsetHeight; // eslint-disable-line no-unused-expressions
  DOM.toast.classList.add('show');

  // Auto-hide after 3 seconds
  toastTimeout = setTimeout(() => {
    DOM.toast.classList.remove('show');
    setTimeout(() => {
      DOM.toast.hidden = true;
    }, 350); // Match transition duration
  }, 3000);
}


// ═══════════════════════════════════════════════════════════
// UI: LOADING STATE
// ═══════════════════════════════════════════════════════════

/**
 * Set loading state on a button.
 * @param {HTMLElement} button
 * @param {boolean} loading
 */
function setLoading(button, loading) {
  if (!button) return;

  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}


// ═══════════════════════════════════════════════════════════
// UI: COPY SUCCESS ANIMATION
// ═══════════════════════════════════════════════════════════

/**
 * Show the copy success checkmark animation.
 */
function showCopySuccess() {
  if (!DOM.copySuccess || !DOM.copyCard) return;

  // Show checkmark
  DOM.copySuccess.classList.add('show');
  DOM.copyCard.classList.add('copy-done');

  // Hide after animation
  setTimeout(() => {
    DOM.copySuccess.classList.remove('show');
    DOM.copyCard.classList.remove('copy-done');
  }, 2000);
}


// ═══════════════════════════════════════════════════════════
// UI: STATS DISPLAY
// ═══════════════════════════════════════════════════════════

/**
 * Update the stats bar with message, word, and character counts.
 * @param {Object} stats - { messages, words, chars }
 */
function updateStats(stats) {
  if (!stats) return;

  if (DOM.statMessagesValue) {
    DOM.statMessagesValue.textContent = formatNumber(stats.messages || 0);
  }
  if (DOM.statWordsValue) {
    DOM.statWordsValue.textContent = formatNumber(stats.words || 0);
  }
  if (DOM.statCharsValue) {
    DOM.statCharsValue.textContent = formatNumber(stats.chars || 0);
  }
}


/**
 * Format a number for display (e.g., 1234 → 1.2K).
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return String(num);
}


// ═══════════════════════════════════════════════════════════
// SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Toggle the settings section visibility.
 */
function toggleSettings() {
  if (!DOM.settingsToggle || !DOM.settingsContent) return;

  const isExpanded = DOM.settingsToggle.getAttribute('aria-expanded') === 'true';
  const newState = !isExpanded;

  DOM.settingsToggle.setAttribute('aria-expanded', String(newState));
  DOM.settingsContent.hidden = !newState;
}


/**
 * Load settings from chrome.storage.local.
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['showFab', 'autoDetect']);

    if (DOM.toggleFab && typeof result.showFab === 'boolean') {
      DOM.toggleFab.checked = result.showFab;
    }
    if (DOM.toggleAutoDetect && typeof result.autoDetect === 'boolean') {
      DOM.toggleAutoDetect.checked = result.autoDetect;
    }
  } catch (error) {
    console.warn('[Popup] Failed to load settings:', error);
  }
}


/**
 * Save settings to chrome.storage.local and notify service worker.
 * @param {Object} settings
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.local.set(settings);

    // Notify the service worker
    chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: settings
    }).catch(() => {
      // Service worker might not be listening — that's OK
    });
  } catch (error) {
    console.error('[Popup] Failed to save settings:', error);
  }
}


/**
 * Handle floating button toggle change.
 */
async function handleFabToggle() {
  const enabled = DOM.toggleFab.checked;

  await saveSettings({ showFab: enabled });

  // Send message to toggle the FAB on the active tab
  if (activeTabId) {
    chrome.runtime.sendMessage({
      type: 'TOGGLE_FAB',
      enabled: enabled,
      tabId: activeTabId
    }).catch(() => {
      // Silent catch — service worker might be inactive
    });
  }

  showToast(
    enabled ? 'Floating button enabled' : 'Floating button disabled',
    'info'
  );
}


/**
 * Handle auto-detect toggle change.
 */
async function handleAutoDetectToggle() {
  const enabled = DOM.toggleAutoDetect.checked;
  await saveSettings({ autoDetect: enabled });

  showToast(
    enabled ? 'Auto-detect enabled' : 'Auto-detect disabled',
    'info'
  );
}


// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Set the version number from the extension manifest.
 */
function setVersion() {
  if (!DOM.footerVersion) return;

  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version) {
      DOM.footerVersion.textContent = 'v' + manifest.version;
    }
  } catch (err) {
    // If manifest is not available (e.g., testing outside Chrome)
    DOM.footerVersion.textContent = 'v1.0.0';
  }
}


// ═══════════════════════════════════════════════════════════
// EXPORT CHAT TO FILE
// ═══════════════════════════════════════════════════════════

/**
 * Export the conversation as a downloadable file.
 */
async function handleExportClick() {
  if (!activeTabId) {
    showToast('No active AI tab detected.', 'error');
    return;
  }

  const activePill = DOM.exportFormatSelector
    ? DOM.exportFormatSelector.querySelector('.format-pill.active')
    : null;
  const format = activePill ? activePill.dataset.format : 'markdown';

  setButtonLoading(DOM.btnExport, true);

  try {
    // Use extractChat directly (handles injection + retry internally)
    const result = await extractChat(format);

    if (!result || !result.text || result.text.trim().length === 0) {
      throw new Error('No conversation found on this page.');
    }

    // Build filename + MIME
    const extMap  = { markdown: 'md', text: 'txt', html: 'html', json: 'json' };
    const mimeMap = {
      markdown: 'text/markdown;charset=utf-8',
      text:     'text/plain;charset=utf-8',
      html:     'text/html;charset=utf-8',
      json:     'application/json;charset=utf-8'
    };
    const ext  = extMap[format]  || 'txt';
    const mime = mimeMap[format] || 'text/plain;charset=utf-8';
    const platformSlug = detectedPlatform
      ? detectedPlatform.name.replace(/\s+/g, '-')
      : 'AI-Chat';
    const dateStr  = new Date().toISOString().slice(0, 10);
    const filename = `${platformSlug}-chat-${dateStr}.${ext}`;

    // Trigger browser download via Blob URL
    const blob = new Blob([result.text], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Update stats
    updateStats(result.stats);
    showToast(`✓ Saved: ${filename}`, 'success');

  } catch (err) {
    showToast(err.message || 'Export failed. Try again.', 'error');
  } finally {
    setButtonLoading(DOM.btnExport, false);
  }
}


// ═══════════════════════════════════════════════════════════
// PROMPT ENGINEER
// ═══════════════════════════════════════════════════════════

/** Track whether prompt engineer panel is open */
let promptEngineerOpen = false;

/**
 * Toggle the Prompt Engineer overlay on the active AI tab.
 */
async function handlePromptEngineerClick() {
  if (!activeTabId) {
    showToast(currentLang === 'ar' ? 'افتح صفحة AI أولاً' : 'Open an AI chat page first.', 'error');
    return;
  }

  setButtonLoading(DOM.btnPromptEngineer, true);

  try {
    // Inject (or toggle) the prompt engineer script
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['content/prompt-engineer.js']
    });

    promptEngineerOpen = !promptEngineerOpen;

    // Stop loading immediately
    setButtonLoading(DOM.btnPromptEngineer, false);

    // Close popup so user sees the overlay on the page
    if (promptEngineerOpen) {
      setTimeout(() => window.close(), 150);
    }

  } catch (err) {
    showToast(currentLang === 'ar' ? 'لا يمكن الحقن. افتح صفحة AI.' : 'Cannot inject on this page.', 'error');
    setButtonLoading(DOM.btnPromptEngineer, false);
  }
}


// ═══════════════════════════════════════════════════════════
// BUTTON LOADING HELPER (generic)
// ═══════════════════════════════════════════════════════════

/**
 * Show/hide loading spinner on any button.
 * @param {HTMLElement} btn
 * @param {boolean} loading
 */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  const textEl    = btn.querySelector('.btn-text');
  const spinnerEl = btn.querySelector('.btn-loading');
  if (textEl)    textEl.style.opacity    = loading ? '0' : '1';
  if (spinnerEl) spinnerEl.style.display = loading ? 'inline-block' : 'none';
}


// ═══════════════════════════════════════════════════════════
// LANGUAGE TOGGLE (Arabic / English)
// ═══════════════════════════════════════════════════════════

const TRANSLATIONS = {
  en: {
    headerTitle:       'AI Chat Helper',
    headerSubtitle:    'Copy · Summarize · Prompt',
    platformDetecting: 'Detecting platform...',
    platformUnsupported: 'Not on a supported AI platform',
    platformUnknown:    'Could not detect platform',
    copyLabel:         'Copy All Messages',
    summarizeLabel:    'Summarize Conversation',
    exportLabel:       'Export Chat',
    downloadBtn:       '⬇ Download File',
    promptLabel:       '✦ Prompt Engineer',
    promptDesc:        'Rewrite your idea into a professional prompt that gets great results from any AI.',
    formatMd:          'Markdown',
    formatTxt:         'Plain Text',
    formatHtml:        'HTML',
    formatJson:        'JSON',
    shortLen:          'Short',
    medLen:            'Medium',
    longLen:           'Long',
    settings:          'Settings',
    floatBtn:          'Floating Button',
    floatBtnDesc:      'Show floating action button on AI pages',
    autoDetect:        'Auto-detect Platform',
    autoDetectDesc:    'Automatically detect supported AI platforms',
    privacy:           '100% Local & Private',
    copySuccess:       'Copied to clipboard!',
    noMessages:        'No messages found on this page.',
    langBtn:           'عربي',
    // Stats
    statMessages:      'Messages',
    statWords:         'Words',
    statChars:         'Characters',
    // Summary
    summaryTitle:      'Summary',
    keyPoints:         'Key Points',
    topicsCovered:     'Topics Covered',
    // Action labels
    copyAllLabel:      'Copy All Messages',
    summarizeAllLabel: 'Summarize Conversation',
    exportChatLabel:   'Export Chat',
  },
  ar: {
    headerTitle:       'مساعد المحادثات',
    headerSubtitle:    'نسخ · تلخيص · برومبت',
    platformDetecting: 'جارٍ التعرف على المنصة...',
    platformUnsupported: 'ليست منصة ذكاء اصطناعي مدعومة',
    platformUnknown:    'تعذر الكشف عن المنصة',
    copyLabel:         'نسخ المحادثة كاملة',
    summarizeLabel:    'تلخيص المحادثة',
    exportLabel:       'تصدير المحادثة',
    downloadBtn:       '⬇ تحميل الملف',
    promptLabel:       '✦ مهندس البرومبت',
    promptDesc:        'أعد صياغة فكرتك إلى برومبت احترافي للحصول على أفضل النتائج من أي ذكاء اصطناعي.',
    formatMd:          'Markdown',
    formatTxt:         'نص عادي',
    formatHtml:        'HTML',
    formatJson:        'JSON',
    shortLen:          'قصير',
    medLen:            'متوسط',
    longLen:           'طويل',
    settings:          'الإعدادات',
    floatBtn:          'الزر العائم',
    floatBtnDesc:      'إظهار زر النسخ العائم على صفحات AI',
    autoDetect:        'اكتشاف المنصة تلقائياً',
    autoDetectDesc:    'الكشف عن منصات الذكاء الاصطناعي المدعومة تلقائياً',
    privacy:           'محلي وآمن 100%',
    copySuccess:       'تم النسخ إلى الحافظة!',
    noMessages:        'لم يتم العثور على رسائل في هذه الصفحة.',
    langBtn:           'English',
    // Stats
    statMessages:      'رسائل',
    statWords:         'كلمات',
    statChars:         'أحرف',
    // Summary
    summaryTitle:      'الملخص',
    keyPoints:         'النقاط الرئيسية',
    topicsCovered:     'المواضيع المتناولة',
    // Action labels
    copyAllLabel:      'نسخ المحادثة كاملة',
    summarizeAllLabel: 'تلخيص المحادثة',
    exportChatLabel:   'تصدير المحادثة',
  }
};

let currentLang = 'en';

function applyLanguage(lang) {
  const t   = TRANSLATIONS[lang];
  const doc = document;
  const $ = id => doc.getElementById(id);

  // Direction
  doc.documentElement.lang = lang;
  doc.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';

  // Header
  const ht = $('headerTitle');    if (ht) ht.textContent = t.headerTitle;
  const hs = $('headerSubtitle'); if (hs) hs.textContent = t.headerSubtitle;

  // Language button label
  const lb = $('langToggleBtn');  if (lb) lb.textContent = t.langBtn;

  // Platform badge
  const pn = $('platformName');
  if (pn) {
    if (detectedPlatform) {
      pn.textContent = detectedPlatform.icon + ' ' + detectedPlatform.name;
    } else if (DOM.platformBadge && DOM.platformBadge.classList.contains('unsupported')) {
      pn.textContent = t.platformUnsupported;
    } else if (DOM.platformBadge && DOM.platformBadge.classList.contains('unknown')) {
      pn.textContent = t.platformUnknown;
    } else {
      pn.textContent = t.platformDetecting;
    }
  }

  // Buttons — find by ID, update .btn-text inside
  const setText = (id, text) => {
    const el = $(id);
    if (!el) return;
    const bt = el.querySelector('.btn-text') || el;
    bt.textContent = text;
  };
  setText('btnCopy',          t.copyLabel);
  setText('btnSummarize',     t.summarizeLabel);
  setText('btnExport',        t.downloadBtn);
  setText('btnPromptEngineer',t.promptLabel);

  // Prompt Card Description
  const pd = doc.querySelector('#promptCard .action-desc');
  if (pd) pd.textContent = t.promptDesc;

  // Action card labels (header text for each card)
  // Order in DOM: 0=Copy, 1=Summarize, 2=PromptEngineer, 3=Export
  const actionLabels = doc.querySelectorAll('.action-label');
  if (actionLabels[0]) actionLabels[0].textContent = t.copyAllLabel;
  if (actionLabels[1]) actionLabels[1].textContent = t.summarizeAllLabel;
  if (actionLabels[2]) actionLabels[2].textContent = t.promptLabel;
  if (actionLabels[3]) actionLabels[3].textContent = t.exportChatLabel;

  // Format pills
  const pills = doc.querySelectorAll('#formatSelector .format-pill');
  const fmtMap = { markdown: t.formatMd, text: t.formatTxt, html: t.formatHtml, json: t.formatJson };
  pills.forEach(p => { if (fmtMap[p.dataset.format]) p.textContent = fmtMap[p.dataset.format]; });

  // Length pills
  const lenPills = doc.querySelectorAll('#lengthSelector .format-pill');
  const lenMap = { short: t.shortLen, medium: t.medLen, long: t.longLen };
  lenPills.forEach(p => { if (lenMap[p.dataset.length]) p.textContent = lenMap[p.dataset.length]; });

  // Stats labels
  const statLabels = doc.querySelectorAll('.stat-label');
  if (statLabels[0]) statLabels[0].textContent = t.statMessages;
  if (statLabels[1]) statLabels[1].textContent = t.statWords;
  if (statLabels[2]) statLabels[2].textContent = t.statChars;

  // Summary section
  const summaryTitle = doc.querySelector('.summary-title');
  if (summaryTitle) summaryTitle.textContent = t.summaryTitle;

  const sectionLabels = doc.querySelectorAll('.section-label');
  if (sectionLabels[0]) sectionLabels[0].textContent = t.keyPoints;
  if (sectionLabels[1]) sectionLabels[1].textContent = t.topicsCovered;

  // Settings labels
  const settingsToggleSpan = doc.querySelector('#settingsToggle span');
  if (settingsToggleSpan) settingsToggleSpan.textContent = t.settings;

  const sfName = doc.querySelector('#settingFab .setting-name');
  if (sfName) sfName.textContent = t.floatBtn;
  const sfDesc = doc.querySelector('#settingFab .setting-desc');
  if (sfDesc) sfDesc.textContent = t.floatBtnDesc;

  const sadName = doc.querySelector('#settingAutoDetect .setting-name');
  if (sadName) sadName.textContent = t.autoDetect;
  const sadDesc = doc.querySelector('#settingAutoDetect .setting-desc');
  if (sadDesc) sadDesc.textContent = t.autoDetectDesc;

  // Footer privacy
  const footerPriv = $('footerPrivacy');
  if (footerPriv) {
    const svg = footerPriv.querySelector('svg');
    footerPriv.textContent = '';
    if (svg) footerPriv.appendChild(svg);
    footerPriv.appendChild(doc.createTextNode(' ' + t.privacy));
  }

  // Save preference
  chrome.storage.local.set({ uiLang: lang });
}

function initLanguageToggle() {
  const btn = document.getElementById('langToggleBtn');
  if (!btn) return;

  // Load saved preference
  chrome.storage.local.get('uiLang', ({ uiLang }) => {
    currentLang = uiLang || 'en';
    applyLanguage(currentLang);
  });

  btn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(currentLang);
  });
}

