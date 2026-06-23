'use strict';

/**
 * AI Chat Helper - Service Worker (Background Script)
 * 
 * Responsibilities:
 * - Managing communication between popup and content scripts
 * - Injecting content scripts dynamically via chrome.scripting
 * - Managing user settings persistence
 * - Handling floating action button toggle
 * 
 * Security: No remote code, no eval, all data stays local
 */

/* ===========================
   Listener Registration
   (Must be at top level, synchronous)
   =========================== */

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      settings: {
        showFloatingButton: false,
        autoDetectPlatform: true,
        preferredFormat: 'markdown',
        summaryLength: 'medium',
        theme: 'dark'
      }
    });
    console.log('[AI Chat Helper] Extension installed successfully.');
  } else if (details.reason === 'update') {
    console.log(`[AI Chat Helper] Updated to version ${chrome.runtime.getManifest().version}`);
  }

  // Context menu: "Improve with Prompt Engineer" on text selection
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ach-improve-prompt',
      title: '✦ Improve with Prompt Engineer',
      contexts: ['selection'],
      documentUrlPatterns: [
        'https://chatgpt.com/*',
        'https://chat.openai.com/*',
        'https://claude.ai/*',
        'https://gemini.google.com/*',
        'https://copilot.microsoft.com/*',
        'https://www.perplexity.ai/*',
        'https://perplexity.ai/*',
        'https://chat.deepseek.com/*',
        'https://grok.com/*',
        'https://poe.com/*',
        'https://you.com/*',
        'https://huggingface.co/chat/*'
      ]
    });
  });
});

// Context menu click — inject prompt-engineer with selected text
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'ach-improve-prompt' || !tab) return;
  const selectedText = info.selectionText || '';
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/prompt-engineer.js']
  }).then(() => {
    // After injection, pre-fill the idea input with the selected text
    if (selectedText) {
      setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            const input = document.getElementById('ach-idea-input');
            if (input) { input.value = text; input.focus(); }
          },
          args: [selectedText]
        });
      }, 300);
    }
  }).catch(err => console.error('[ACH] Context menu inject failed:', err));
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verify message comes from our own extension
  if (sender.id !== chrome.runtime.id) {
    return;
  }

  // Validate message structure
  if (!message || typeof message.type !== 'string') {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }

  switch (message.type) {
    // Keepalive ping — popup sends this before critical calls to wake the SW
    case 'PING':
      sendResponse({ success: true, pong: true });
      return true;

    case 'OPEN_PROMPT_ENGINEER':
      handleOpenPromptEngineer(message)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'INJECT_CONTENT_SCRIPT':
      handleInjectContentScript(message, sender)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response

    case 'EXTRACT_CHAT':
      handleExtractChat(message)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_FORMATTED_TEXT':
      handleGetFormattedText(message)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'TOGGLE_FAB':
      handleToggleFAB(message)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'SAVE_SETTINGS':
      handleSaveSettings(message.settings)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_SETTINGS':
      handleGetSettings()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CHECK_PLATFORM':
      handleCheckPlatform(message.tabId)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      return true;
  }
});


/* ===========================
   Message Handlers
   =========================== */

/**
 * Inject the content script into the specified tab
 */
async function handleInjectContentScript(message, sender) {
  const tabId = message.tabId;

  if (!tabId) {
    throw new Error('Tab ID is required');
  }

  try {
    // Check if content script is already injected
    const checkResults = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => typeof window.__aiChatHelper !== 'undefined'
    });

    const alreadyInjected = checkResults && checkResults[0] && checkResults[0].result;

    if (!alreadyInjected) {
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
      });

      // Inject content CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content/content.css']
      });
    }

    return { success: true, alreadyInjected: alreadyInjected };
  } catch (error) {
    console.error('[AI Chat Helper] Injection failed:', error);
    throw new Error(`Cannot access this page. Make sure you're on an AI chat page. (${error.message})`);
  }
}

/**
 * Inject content script and extract chat data
 */
async function handleExtractChat(message) {
  const tabId = message.tabId;

  if (!tabId) {
    throw new Error('Tab ID is required');
  }

  // First, ensure content script is injected
  await handleInjectContentScript({ tabId }, { id: chrome.runtime.id });

  // Then extract chat data — use extractAsync to scroll & load full conversation
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      if (typeof window.__aiChatHelper !== 'undefined' && typeof window.__aiChatHelper.extractAsync === 'function') {
        return window.__aiChatHelper.extractAsync();
      }
      // fallback for old injection
      if (typeof window.__aiChatHelper !== 'undefined' && typeof window.__aiChatHelper.extract === 'function') {
        return window.__aiChatHelper.extract();
      }
      return { error: 'Content script not ready' };
    }
  });

  if (results && results[0] && results[0].result) {
    if (results[0].result.error) {
      throw new Error(results[0].result.error);
    }
    return { success: true, data: results[0].result };
  }

  throw new Error('Failed to extract chat data');
}

/**
 * Get formatted text in specified format
 */
async function handleGetFormattedText(message) {
  const { tabId, format } = message;

  if (!tabId) {
    throw new Error('Tab ID is required');
  }

  const validFormats = ['markdown', 'plaintext', 'text', 'html', 'json'];
  const selectedFormat = validFormats.includes(format) ? format : 'markdown';

  // Ensure content script is injected
  await handleInjectContentScript({ tabId }, { id: chrome.runtime.id });

  // Get formatted text — async version scrolls first
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (fmt) => {
      if (typeof window.__aiChatHelper !== 'undefined' && typeof window.__aiChatHelper.getFormattedTextAsync === 'function') {
        return window.__aiChatHelper.getFormattedTextAsync(fmt);
      }
      if (typeof window.__aiChatHelper !== 'undefined' && typeof window.__aiChatHelper.getFormattedText === 'function') {
        return window.__aiChatHelper.getFormattedText(fmt);
      }
      return null;
    },
    args: [selectedFormat]
  });

  if (results && results[0] && results[0].result !== null) {
    return { success: true, text: results[0].result };
  }

  throw new Error('Failed to format chat data');
}

/**
 * Toggle the floating action button on a tab
 */
async function handleToggleFAB(message) {
  const { tabId, enabled } = message;

  if (!tabId) {
    throw new Error('Tab ID is required');
  }

  // Ensure content script is injected
  await handleInjectContentScript({ tabId }, { id: chrome.runtime.id });

  // Toggle FAB visibility
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (show) => {
      if (typeof window.__aiChatHelper !== 'undefined' && typeof window.__aiChatHelper.toggleFAB === 'function') {
        window.__aiChatHelper.toggleFAB(show);
        return true;
      }
      return false;
    },
    args: [enabled]
  });

  return { success: true };
}

/**
 * Save user settings
 */
async function handleSaveSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings object');
  }

  // Only save known setting keys (whitelist approach for security)
  const allowedKeys = ['showFab', 'autoDetect', 'showFloatingButton', 'autoDetectPlatform', 'preferredFormat', 'summaryLength', 'theme'];
  const sanitized = {};

  for (const key of allowedKeys) {
    if (key in settings) {
      sanitized[key] = settings[key];
    }
  }

  // Merge with existing settings
  const existing = await chrome.storage.local.get('settings');
  const merged = { ...(existing.settings || {}), ...sanitized };

  await chrome.storage.local.set({ settings: merged });
  return { success: true, settings: merged };
}

/**
 * Get user settings
 */
async function handleGetSettings() {
  const result = await chrome.storage.local.get('settings');
  return {
    success: true,
    settings: result.settings || {
      showFloatingButton: false,
      autoDetectPlatform: true,
      preferredFormat: 'markdown',
      summaryLength: 'medium',
      theme: 'dark'
    }
  };
}

/**
 * Open Prompt Engineer overlay in active tab (called from popup shortcut button)
 */
async function handleOpenPromptEngineer(message) {
  const tabId = message.tabId;
  if (!tabId) throw new Error('Tab ID is required');
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content/prompt-engineer.js']
  });
  return { success: true };
}

/**
 * Check if a tab is on a supported AI platform
 */
async function handleCheckPlatform(tabId) {
  if (!tabId) {
    throw new Error('Tab ID is required');
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    const hostname = new URL(url).hostname.toLowerCase();

    const platforms = {
      'chatgpt.com': { id: 'chatgpt', name: 'ChatGPT' },
      'chat.openai.com': { id: 'chatgpt', name: 'ChatGPT' },
      'claude.ai': { id: 'claude', name: 'Claude' },
      'gemini.google.com': { id: 'gemini', name: 'Google Gemini' },
      'copilot.microsoft.com': { id: 'copilot', name: 'Microsoft Copilot' },
      'perplexity.ai': { id: 'perplexity', name: 'Perplexity' },
      'chat.deepseek.com': { id: 'deepseek', name: 'DeepSeek' },
      'deepseek.com': { id: 'deepseek', name: 'DeepSeek' },
      'grok.com': { id: 'grok', name: 'Grok' },
      'poe.com': { id: 'poe', name: 'Poe' },
      'you.com': { id: 'you', name: 'You.com' },
      'huggingface.co': { id: 'huggingface', name: 'HuggingChat' }
    };

    for (const [domain, platform] of Object.entries(platforms)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { success: true, platform: platform, supported: true, url: url };
      }
    }

    return { success: true, platform: null, supported: false, url: url };
  } catch (error) {
    return { success: true, platform: null, supported: false, url: '' };
  }
}
