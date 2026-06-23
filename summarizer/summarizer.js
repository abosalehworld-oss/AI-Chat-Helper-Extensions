'use strict';

/**
 * AIChatSummarizer - Local extractive text summarization engine
 * Works entirely offline. No API calls, no external services.
 * Supports Arabic and English text with mixed-language conversations.
 *
 * v1.1.0 — Fixed:
 *   • Deduplication: removes repeated/duplicate messages before summarizing
 *   • Cleans "## You said:" / "User:" prefixes from extracted text
 *   • Proper grouping: only AI responses go into summary body
 *   • Key points now come from AI content ONLY, not user messages
 *   • Topics extracted from headings + bold text in AI responses
 */
class AIChatSummarizer {
  constructor() {
    // English stop words
    this.enStopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'because', 'but', 'and', 'or', 'if', 'while', 'although',
      'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we',
      'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
      'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
      'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
      'themselves', 'what', 'which', 'who', 'whom', 'about', 'up', 'down',
      'also', 'well', 'back', 'even', 'still', 'way', 'take', 'come', 'go',
      'make', 'like', 'get', 'got', 'much', 'many', 'one', 'two', 'first',
      'last', 'long', 'great', 'little', 'right', 'old', 'big', 'high',
      'different', 'small', 'large', 'next', 'early', 'young', 'important',
      'new', 'now', 'know', 'say', 'said', 'think', 'thought', 'tell',
      'told', 'see', 'look', 'want', 'give', 'use', 'find', 'thing',
      'man', 'world', 'life', 'day', 'hand', 'part', 'child', 'eye',
      'woman', 'place', 'work', 'week', 'case', 'point', 'company',
      'number', 'group', 'problem', 'fact'
    ]);

    // Arabic stop words
    this.arStopWords = new Set([
      'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
      'التي', 'الذي', 'اللذين', 'اللتين', 'الذين', 'اللاتي', 'اللواتي',
      'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن',
      'كان', 'كانت', 'كانوا', 'يكون', 'تكون', 'أن', 'إن', 'لا', 'ما',
      'لم', 'لن', 'قد', 'حتى', 'إذا', 'إذ', 'لو', 'كل', 'بعض', 'غير',
      'بين', 'حين', 'حيث', 'بعد', 'قبل', 'ثم', 'أو', 'و', 'ف', 'ب',
      'ل', 'ك', 'لكن', 'أما', 'بل', 'منذ', 'خلال', 'ضد', 'عند',
      'فوق', 'تحت', 'أمام', 'وراء', 'نحو', 'هنا', 'هناك', 'الآن',
      'كيف', 'أين', 'متى', 'لماذا', 'ماذا', 'أي', 'كم', 'ذا', 'تم',
      'يتم', 'سوف', 'ليس', 'ليست', 'هل', 'أ', 'يا', 'آل', 'ال',
      'عليه', 'عليها', 'عليهم', 'فيه', 'فيها', 'فيهم', 'به', 'بها',
      'بهم', 'له', 'لها', 'لهم', 'منه', 'منها', 'منهم', 'وهو', 'وهي',
      'التى', 'حول', 'دون', 'وقد', 'ولا', 'أيضا', 'ذلك', 'ولم',
      'عبر', 'وفي', 'ومن', 'جدا', 'أكثر', 'ليسوا', 'فقط', 'ولكن'
    ]);

    // English keyword indicators (high-value signal words)
    this.enKeywordIndicators = new Set([
      'important', 'summary', 'conclusion', 'result', 'key', 'main',
      'significant', 'essential', 'critical', 'fundamental', 'primary',
      'crucial', 'therefore', 'consequently', 'hence', 'thus',
      'recommend', 'suggest', 'advise', 'note', 'remember',
      'finally', 'overall', 'ultimately', 'solution', 'answer',
      'definition', 'means', 'specifically', 'basically', 'essentially',
      'in short', 'to summarize', 'in conclusion', 'in summary',
      'the point is', 'the key is', 'most importantly', 'above all',
      'steps', 'process', 'method', 'approach', 'technique', 'strategy'
    ]);

    // Arabic keyword indicators
    this.arKeywordIndicators = new Set([
      'الخلاصة', 'المهم', 'النتيجة', 'باختصار', 'ملخص', 'أساسي',
      'جوهري', 'رئيسي', 'ضروري', 'حاسم', 'بالتالي', 'لذلك', 'إذن',
      'نتيجة', 'الحل', 'الإجابة', 'التعريف', 'يعني', 'تحديدا',
      'أساسا', 'الخطوات', 'الطريقة', 'النهج', 'الأسلوب', 'الاستراتيجية',
      'يجب', 'ينبغي', 'أنصح', 'تذكر', 'لاحظ', 'أخيرا', 'بشكل عام',
      'في النهاية', 'الأهم', 'فوق كل شيء', 'الحقيقة', 'الواقع',
      'المعنى', 'التوصية', 'الاقتراح', 'النصيحة', 'الهدف'
    ]);

    // Length config: how many sentences to select per summary length
    this.lengthConfig = {
      short:  { min: 3,  max: 5  },
      medium: { min: 7,  max: 10 },
      long:   { min: 15, max: 20 }
    };
  }

  // ─── PUBLIC API ──────────────────────────────────────────

  /**
   * Summarize an array of chat messages using extractive summarization.
   * @param {Array} messages - [{role: 'user'|'assistant', content: 'text', index: 0}, ...]
   * @param {Object} options - { length: 'short'|'medium'|'long', language: 'auto'|'en'|'ar' }
   * @returns {Object} { summary: 'text', keyPoints: [...], topicsCovered: [...] }
   */
  summarize(messages, options = {}) {
    const length   = options.length   || 'medium';
    const language = options.language || 'auto';

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return { summary: '', keyPoints: [], topicsCovered: [] };
    }

    // ── Step 0: Clean & Deduplicate ──────────────────────
    const cleaned = this._cleanMessages(messages);

    // Separate user and assistant messages
    const assistantMessages = cleaned.filter(m => m && m.role === 'assistant');
    const userMessages      = cleaned.filter(m => m && m.role === 'user');

    if (assistantMessages.length === 0) {
      return { summary: '', keyPoints: [], topicsCovered: [] };
    }

    // Detect language
    const detectedLanguage = language === 'auto'
      ? this._detectLanguage(assistantMessages.map(m => m.content).join(' '))
      : language;

    // ── Step 1: Build document from AI responses only ────
    const document = assistantMessages.map(m => m.content || '').join('\n\n');

    // ── Step 2: Split into sentences ─────────────────────
    const sentences = this._splitIntoSentences(document, assistantMessages);

    if (sentences.length === 0) {
      return { summary: '', keyPoints: [], topicsCovered: [] };
    }

    // ── Step 3: TF across document ───────────────────────
    const tf = this._computeTF(document, detectedLanguage);

    // User question word sets for relevance scoring
    const userQuestions = userMessages.map(m => {
      const words = this._tokenize(m.content || '', detectedLanguage);
      return new Set(words);
    });

    // ── Step 4: Score each sentence ──────────────────────
    const scoredSentences = sentences.map((sent, idx) => {
      const score = this._scoreSentence(
        sent, idx, sentences.length, tf, userQuestions, detectedLanguage
      );
      return { ...sent, score };
    });

    // ── Step 5: Select top N sentences ───────────────────
    const config      = this.lengthConfig[length] || this.lengthConfig.medium;
    const targetCount = Math.min(
      Math.max(config.min, Math.ceil(sentences.length * 0.3)),
      config.max,
      sentences.length
    );

    const topSentences = [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount);

    // Re-order by original position for natural reading flow
    topSentences.sort((a, b) => a.originalIndex - b.originalIndex);

    const summary = topSentences.map(s => s.text.trim()).join(' ');

    // ── Step 6: Key points (top 5 from AI only) ──────────
    const keyPoints = this._extractKeyPoints(scoredSentences, 5);

    // ── Step 7: Topics ────────────────────────────────────
    const topicsCovered = this._extractTopics(document, detectedLanguage);

    // ── Step 8: Build conversation overview ──────────────
    const conversationOverview = this._buildOverview(
      userMessages, assistantMessages, detectedLanguage
    );

    return {
      summary,
      keyPoints,
      topicsCovered,
      conversationOverview,
      messageCount: cleaned.length,
      aiResponseCount: assistantMessages.length
    };
  }

  /**
   * Attempt to use Chrome's Built-in Summarizer API.
   * Returns null if not available — caller should fall back to extractive.
   * @param {string} text - Text to summarize
   * @param {Object} options - { length: 'short'|'medium'|'long' }
   * @returns {Promise<Object|null>}
   */
  async summarizeWithBuiltInAI(text, options = {}) {
    try {
      if (typeof window !== 'undefined' && 'ai' in window && 'summarizer' in window.ai) {
        const canSummarize = await window.ai.summarizer.capabilities();

        if (canSummarize && canSummarize.available !== 'no') {
          const lengthMap = {
            short:  'tl;dr',
            medium: 'key-points',
            long:   'teaser'
          };

          const summarizerOptions = {
            type:   lengthMap[options.length] || 'key-points',
            format: 'plain-text',
            length: options.length || 'medium'
          };

          let summarizer;
          if (canSummarize.available === 'readily') {
            summarizer = await window.ai.summarizer.create(summarizerOptions);
          } else {
            summarizer = await window.ai.summarizer.create(summarizerOptions);
            if (summarizer.ready) await summarizer.ready;
          }

          const result = await summarizer.summarize(text);
          if (summarizer.destroy) summarizer.destroy();

          return {
            summary:          result,
            keyPoints:        [],
            topicsCovered:    [],
            source:           'chrome-built-in-ai'
          };
        }
      }
    } catch (error) {
      console.warn('[AIChatSummarizer] Built-in AI not available:', error.message);
    }
    return null;
  }

  // ─── PRIVATE: MESSAGE CLEANING & DEDUPLICATION ───────────

  /**
   * Clean raw extracted messages:
   *   1. Remove "## You said:" / "User:" / "Assistant:" prefixes added by extractor
   *   2. Remove exact-duplicate messages (same content repeated)
   *   3. Remove near-duplicate messages (>85% similarity)
   * @param {Array} messages
   * @returns {Array}
   */
  _cleanMessages(messages) {
    const seen    = new Set();
    const cleaned = [];

    // Patterns added by extractors that should not appear in content
    const prefixPatterns = [
      /^##\s*(You said|User|Human|يوزر|المستخدم)\s*:?\s*/i,
      /^(You said|User said|Human said|قلت|قلت أنت)\s*:?\s*/i,
      /^\*\*(You|User|Human|Assistant|AI|Claude|Gemini|ChatGPT)\s*\*\*\s*:?\s*/i,
      /^(👤\s*User|🤖\s*Assistant)\s*:?\s*/i,
    ];

    for (const msg of messages) {
      if (!msg || !msg.content) continue;

      let content = msg.content.trim();

      // Remove extractor-added role prefixes
      for (const pat of prefixPatterns) {
        content = content.replace(pat, '').trim();
      }

      // Skip if empty after cleaning
      if (content.length < 3) continue;

      // Deduplicate: skip exact duplicates
      const normalised = content.replace(/\s+/g, ' ').toLowerCase();
      if (seen.has(normalised)) continue;
      seen.add(normalised);

      cleaned.push({ ...msg, content });
    }

    // Remove near-duplicates (same message repeated with slight variation)
    return this._removeNearDuplicates(cleaned);
  }

  /**
   * Remove messages that are >85% similar to a previous message of the same role.
   */
  _removeNearDuplicates(messages) {
    const result = [];
    for (const msg of messages) {
      let isDuplicate = false;
      for (const kept of result) {
        if (kept.role !== msg.role) continue;
        const sim = this._similarity(kept.content, msg.content);
        if (sim > 0.85) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) result.push(msg);
    }
    return result;
  }

  /**
   * Jaccard similarity between two strings (word level).
   * Returns 0-1 where 1 = identical.
   */
  _similarity(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    const union = wordsA.size + wordsB.size - intersection;
    return union === 0 ? 1 : intersection / union;
  }

  /**
   * Build a human-readable overview of the conversation topics.
   * e.g. "3-turn conversation about CSS, WordPress Plugin, and SEO"
   */
  _buildOverview(userMessages, assistantMessages, language) {
    const turnCount = Math.max(userMessages.length, assistantMessages.length);
    // Extract first user message as topic hint
    const firstUser = userMessages[0] ? userMessages[0].content.slice(0, 120) : '';
    if (language === 'ar') {
      return `محادثة من ${turnCount} رسائل تتضمن: ${firstUser}...`;
    }
    return `${turnCount}-turn conversation covering: ${firstUser}...`;
  }

  // ─── PRIVATE: LANGUAGE DETECTION ─────────────────────────

  _detectLanguage(text) {
    if (!text) return 'en';
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const latinPattern  = /[a-zA-Z]/g;
    const arabicMatches = (text.match(arabicPattern) || []).length;
    const latinMatches  = (text.match(latinPattern)  || []).length;
    return arabicMatches > latinMatches ? 'ar' : 'en';
  }

  // ─── PRIVATE: SENTENCE SPLITTING ────────────────────────

  _splitIntoSentences(document, assistantMessages) {
    const sentences  = [];
    let globalIndex  = 0;

    for (let msgIdx = 0; msgIdx < assistantMessages.length; msgIdx++) {
      const content = assistantMessages[msgIdx].content || '';
      if (!content.trim()) continue;

      const rawSentences = content
        .split(/(?<=[.!?؟])\s+|(?<=\n)\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 5);

      for (let i = 0; i < rawSentences.length; i++) {
        sentences.push({
          text:           rawSentences[i],
          originalIndex:  globalIndex,
          messageIndex:   msgIdx,
          isFirst:        i === 0,
          isLast:         i === rawSentences.length - 1,
          totalInMessage: rawSentences.length
        });
        globalIndex++;
      }
    }

    return sentences;
  }

  // ─── PRIVATE: TOKENIZATION ──────────────────────────────

  _tokenize(text, language) {
    if (!text) return [];
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const stopWords         = language === 'ar' ? this.arStopWords : this.enStopWords;
    const combinedStopWords = new Set([...this.enStopWords, ...this.arStopWords]);
    const filterSet         = language === 'auto' ? combinedStopWords : stopWords;

    return words.filter(w => !filterSet.has(w));
  }

  // ─── PRIVATE: TERM FREQUENCY ────────────────────────────

  _computeTF(document, language) {
    const words = this._tokenize(document, language);
    const tf    = new Map();

    for (const word of words) {
      tf.set(word, (tf.get(word) || 0) + 1);
    }

    const maxFreq = Math.max(...tf.values(), 1);
    for (const [word, count] of tf) {
      tf.set(word, count / maxFreq);
    }

    return tf;
  }

  // ─── PRIVATE: SENTENCE SCORING ──────────────────────────

  _scoreSentence(sentence, idx, totalSentences, tf, userQuestions, language) {
    let score = 0;

    // 1. TF Score
    const words = this._tokenize(sentence.text, language);
    if (words.length > 0) {
      const tfScore = words.reduce((sum, w) => sum + (tf.get(w) || 0), 0) / words.length;
      score += tfScore * 2.0;
    }

    // 2. Position Score
    if (sentence.isFirst) score += 1.5;
    if (sentence.isLast)  score += 1.0;
    if (idx < totalSentences * 0.2) score += 0.5;

    // 3. Keyword Indicator Score
    const lowerText    = sentence.text.toLowerCase();
    const allIndicators = new Set([...this.enKeywordIndicators, ...this.arKeywordIndicators]);
    for (const keyword of allIndicators) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1.5;
        break;
      }
    }

    // 4. Length Penalty/Bonus
    const wordCount = sentence.text.split(/\s+/).length;
    if (wordCount < 4)                         score -= 1.0;
    else if (wordCount > 50)                   score -= 0.5;
    else if (wordCount >= 8 && wordCount <= 30) score += 0.5;

    // 5. Question-Answer Relevance
    if (userQuestions.length > 0) {
      let maxRelevance    = 0;
      const sentenceWords = new Set(words);
      for (const questionWords of userQuestions) {
        if (questionWords.size === 0) continue;
        let overlap = 0;
        for (const qw of questionWords) {
          if (sentenceWords.has(qw)) overlap++;
        }
        const relevance = overlap / Math.max(questionWords.size, 1);
        maxRelevance    = Math.max(maxRelevance, relevance);
      }
      score += maxRelevance * 2.0;
    }

    // 6. Bonus: code snippets
    if (sentence.text.includes('`')) score += 0.3;

    // 7. Bonus: numbers (often factual)
    if (/\d+/.test(sentence.text)) score += 0.2;

    return score;
  }

  // ─── PRIVATE: KEY POINT EXTRACTION ──────────────────────

  _extractKeyPoints(scoredSentences, count) {
    return [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(s => {
        let text = s.text.trim();
        // Remove leading bullets/numbers
        text = text.replace(/^[\d\-\*\•]+[\.)\s]+/, '');
        // Truncate very long key points
        if (text.length > 200) text = text.substring(0, 197) + '...';
        return text;
      })
      .filter(t => t.length > 0);
  }

  // ─── PRIVATE: TOPIC EXTRACTION ──────────────────────────

  _extractTopics(document, language) {
    const topics = new Set();

    // 1. Markdown headers
    const headerPattern = /^#{1,4}\s+(.+)$/gm;
    let match;
    while ((match = headerPattern.exec(document)) !== null) {
      const header = match[1].trim().replace(/[#*`]/g, '');
      if (header.length > 2 && header.length < 80) topics.add(header);
    }

    // 2. Bold text
    const boldPattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    while ((match = boldPattern.exec(document)) !== null) {
      const bold = (match[1] || match[2]).trim();
      if (bold.length > 2 && bold.length < 60 && !/^\d+$/.test(bold)) {
        topics.add(bold);
      }
    }

    // 3. Frequent bigrams
    const words   = this._tokenize(document, language);
    const bigrams = new Map();
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }

    const sortedBigrams = [...bigrams.entries()]
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [bigram] of sortedBigrams) {
      const formatted = bigram.charAt(0).toUpperCase() + bigram.slice(1);
      topics.add(formatted);
    }

    return [...topics].slice(0, 10);
  }
}

// Export for use in popup and content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIChatSummarizer;
}
