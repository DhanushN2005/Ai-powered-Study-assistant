const fetch = require('node-fetch');

/**
 * AI Service Layer
 * Handles all AI-powered features using Claude API
 * Can be easily swapped with OpenAI or other providers
 */

class AIService {
  constructor() {
    this.providers = [];

    // Initialize available providers in priority order
    // Priority: Gemini (fast & free) -> OpenAI -> Groq

    if (process.env.GEMINI_API_KEY) {
      this.providers.push({
        id: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        baseURL: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent`
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        id: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        baseURL: 'https://api.openai.com/v1/chat/completions'
      });
    }

    if (process.env.GROQ_API_KEY) {
      this.providers.push({
        id: 'groq',
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        baseURL: 'https://api.groq.com/openai/v1/chat/completions'
      });
    }

    // Anthropic disabled due to credit balance issues
    // Uncomment and add credits to re-enable

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push({
        id: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        baseURL: 'https://api.anthropic.com/v1/messages'
      });
    }



    // Default provider index
    this.currentProviderIndex = 0;

    // Log available providers
    if (this.providers.length > 0) {
      console.log(`✅ AI Service initialized with ${this.providers.length} provider(s): ${this.providers.map(p => p.id).join(', ')}`);
    } else {
      console.warn('⚠️ No AI providers configured. Please set API keys in .env file.');
    }
  }

  /**
   * Core method to call LLM API
   */
  async callLLM(systemPrompt, userPrompt, maxTokens = 2000) {
    // Check if mock mode is enabled or no providers
    if (process.env.USE_MOCK_AI === 'true' || this.providers.length === 0) {
      if (this.providers.length === 0 && process.env.USE_MOCK_AI !== 'true') {
        console.warn('⚠️ No AI API keys found. Falling back to Mock AI.');
      }
      return this.getMockResponse(systemPrompt, userPrompt);
    }

    // Try providers in order, starting from the last successful one or first one
    let lastError = null;

    // We'll try each provider at most once
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      try {
        const response = await this.executeProviderRequest(provider, systemPrompt, userPrompt, maxTokens);

        // If successful, update the current provider index so we use it next time too
        this.currentProviderIndex = providerIndex;
        return response;
      } catch (error) {
        lastError = error;
        console.error(`AI Provider ${provider.id} failed:`, error.message);

        // If it's a rate limit or server error, continue to next provider
        if (error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('500')) {
          console.log(`Switching to next AI provider...`);
          continue;
        }

        // For other errors (like invalid prompt), we might want to throw immediately, 
        // but for robustness in a study assistant, we'll try the next provider anyway
        continue;
      }
    }

    // If we reached here, all providers failed - fallback to Mock AI
    console.warn('⚠️ All AI providers failed. Falling back to Mock AI...');
    return this.getMockResponse(systemPrompt, userPrompt);
  }

  async executeProviderRequest(provider, systemPrompt, userPrompt, maxTokens) {
    let url = provider.baseURL;
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (provider.id === 'anthropic') {
      headers['x-api-key'] = provider.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: provider.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
      };
    } else if (provider.id === 'openai' || provider.id === 'groq' || provider.id === 'ollama') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      body = {
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens
      };
    } else if (provider.id === 'gemini') {
      url = `${provider.baseURL}?key=${provider.apiKey}`;
      body = {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: Return only valid JSON for study material. Do not include introductory text.` }]
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        }
      };
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: abortController.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error?.message || JSON.stringify(errorData);
        } catch (e) {
          errorDetail = response.statusText;
        }
        throw new Error(`[${provider.id}] API Error ${response.status}: ${errorDetail}`);
      }

      const data = await response.json();

      if (provider.id === 'anthropic') {
        return data.content[0].text;
      } else if (provider.id === 'openai' || provider.id === 'groq' || provider.id === 'ollama') {
        return data.choices[0].message.content;
      } else if (provider.id === 'gemini') {
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Gemini response was empty or blocked by safety filters.');
        }
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Generate mock responses using RAG (Retrieval-Augmented Generation) from document content
   */
  getMockResponse(systemPrompt, userPrompt) {
    // Detect what type of request this is based on prompts
    if (userPrompt.includes('Generate') && userPrompt.includes('questions')) {
      // Extract content from the prompt
      const contentMatch = userPrompt.match(/CONTENT:\s*([\s\S]+)/);
      const content = contentMatch ? contentMatch[1].substring(0, 2000) : '';

      // Extract topic and count
      const topicMatch = userPrompt.match(/TOPIC:\s*(.+)/);
      const topic = topicMatch ? topicMatch[1].trim() : 'General';
      const countMatch = userPrompt.match(/Generate (\d+)/);
      const count = countMatch ? parseInt(countMatch[1]) : 5;

      // Use RAG to generate questions from actual content
      return this.generateQuestionsFromContent(content, topic, count);
    } else if (userPrompt.includes('Summarize')) {
      // Extract content for summarization
      const contentLines = userPrompt.split('\n').slice(2); // Skip "Summarize the following..."
      const content = contentLines.join('\n').substring(0, 1000);
      return this.generateSummary(content);
    } else if (userPrompt.includes('flashcards')) {
      const contentMatch = userPrompt.match(/content:\s*([\s\S]+)/i);
      const content = contentMatch ? contentMatch[1].substring(0, 1500) : '';
      return this.generateFlashcardsFromContent(content);
    } else if (userPrompt.includes('Explain')) {
      const conceptMatch = userPrompt.match(/Explain this concept clearly:\s*(.+)/);
      const concept = conceptMatch ? conceptMatch[1] : 'the concept';
      return `${concept} can be understood by breaking it down into simpler parts. Think of it like building blocks - each piece contributes to the whole structure. In practical terms, this means understanding how individual components work together to create the complete picture.`;
    } else if (userPrompt.includes('Question:')) {
      // Mock answer for questions
      return "This is a simulated answer since no AI provider is currently available. To get a real AI answer, please configure an API key (Gemini, OpenAI, or Groq) in the .env file. \n\nIn the meantime, try breaking down the problem into smaller steps and reviewing the core concepts.";
    } else {
      return JSON.stringify({
        gaps: [],
        strengths: ["Good understanding of basics"],
        overallAssessment: "Continue practicing to strengthen knowledge",
        studyPriority: ["Review fundamentals", "Practice applications", "Test understanding"]
      });
    }
  }

  /**
   * RAG-based question generation from document content
   */
  generateQuestionsFromContent(content, topic, count) {
    if (!content || content.trim().length < 50) {
      // Fallback to generic questions if content is too short
      return this.generateGenericQuestions(count, topic);
    }

    // Split content into sentences and filter for meaningful ones
    const allSentences = content
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // INTELLIGENT FILTERING: Extract only meaningful, factual sentences
    const sentences = allSentences.filter(s => {
      // Must have a verb (is, are, has, have, does, etc.)
      const hasVerb = /\b(is|are|was|were|has|have|had|does|do|did|can|could|will|would|should|may|might|must)\b/i.test(s);

      // Must have substance (5-50 words)
      const wordCount = s.split(' ').length;
      const goodLength = wordCount >= 5 && wordCount <= 50;

      // Avoid questions and commands
      const notQuestion = !s.includes('?');

      // Prefer sentences with informational keywords
      const hasInfo = /\b(is|are|means|refers to|defined as|known as|called|because|therefore|such as|for example|including|contains|consists of|comprises)\b/i.test(s);

      return hasVerb && goodLength && notQuestion && hasInfo;
    });

    // If no meaningful sentences, use all sentences
    const finalSentences = sentences.length >= 3 ? sentences : allSentences.filter(s => s.length > 20);

    if (finalSentences.length < 3) {
      return this.generateGenericQuestions(count, topic);
    }

    const questions = [];
    const usedSentences = new Set();

    // Extract key terms (important words that appear multiple times)
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const wordFreq = {};
    const commonWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should', 'their', 'there', 'which', 'when', 'where', 'what', 'about', 'other', 'some', 'such', 'into', 'than', 'them', 'these', 'those']);

    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const keyTerms = Object.entries(wordFreq)
      .filter(([_, freq]) => freq >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    // Generate questions up to the requested count
    let attempts = 0;
    const maxAttempts = count * 3; // Prevent infinite loop

    while (questions.length < count && attempts < maxAttempts) {
      attempts++;

      const sentenceIndex = Math.floor(Math.random() * finalSentences.length);
      if (usedSentences.has(sentenceIndex) && finalSentences.length > count) {
        continue; // Skip if we've used this sentence and have enough sentences
      }

      const sentence = finalSentences[sentenceIndex];
      usedSentences.add(sentenceIndex);

      // Generate distractors from other sentences in the document
      const otherSentences = finalSentences
        .filter((_, idx) => idx !== sentenceIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(s => s.length > 100 ? s.substring(0, 97) + '...' : s);

      // Ensure we have 3 distractors
      while (otherSentences.length < 3) {
        otherSentences.push(`Alternative interpretation related to ${topic}`);
      }

      let question, correctAnswer, options, explanation;

      // INTELLIGENT QUESTION GENERATION
      const cleanSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

      // Try to extract definition (X is Y, X means Y, X refers to Y)
      const defMatch = sentence.match(/^(.+?)\s+(is|are|means|refers to|defined as|known as)\s+(.+)$/i);

      if (defMatch && questions.length < count / 2) {
        // DEFINITION QUESTION
        const subject = defMatch[1].trim();
        const verb = defMatch[2].toLowerCase();
        const definition = defMatch[3].trim();

        question = `What ${verb} ${subject}?`;
        correctAnswer = definition;
        explanation = `The material states: "${subject} ${verb} ${definition}"`;
      } else if (/\b(because|therefore|thus|hence|as a result|leads to|causes)\b/i.test(sentence)) {
        // CAUSE-EFFECT QUESTION
        question = `According to the material, what cause-and-effect relationship is described?`;
        correctAnswer = cleanSentence;
        explanation = `The material explains this relationship: "${sentence}"`;
      } else if (/\d+/.test(sentence)) {
        // NUMERICAL/FACTUAL QUESTION
        question = `Which statement contains accurate information from the material?`;
        correctAnswer = cleanSentence;
        explanation = `This fact is stated in the material: "${sentence}"`;
      } else if (keyTerms.length > 0) {
        // KEY TERM QUESTION
        const relevantTerm = keyTerms.find(term => sentence.toLowerCase().includes(term));
        if (relevantTerm) {
          question = `What does the material state about "${relevantTerm}"?`;
          correctAnswer = cleanSentence;
          explanation = `The material mentions: "${sentence}"`;
        } else {
          question = `According to the material, which statement is correct?`;
          correctAnswer = cleanSentence;
          explanation = `This is stated in the material: "${sentence}"`;
        }
      } else {
        // GENERAL FACTUAL QUESTION
        const questionTypes = [
          `According to the material, which of the following is true?`,
          `What information is provided in the material?`,
          `Which statement accurately reflects the content?`,
          `What does the material explain?`
        ];
        question = questionTypes[questions.length % questionTypes.length];
        correctAnswer = cleanSentence;
        explanation = `The material states: "${sentence.substring(0, 150)}${sentence.length > 150 ? '...' : ''}"`;
      }

      // Create options array with correct answer and distractors
      options = [correctAnswer, ...otherSentences];

      // Shuffle options
      options = this.shuffleArray(options);

      questions.push({
        question,
        type: 'multiple-choice',
        options,
        correctAnswer,
        explanation,
        difficulty: questions.length < count / 3 ? 'easy' : questions.length < 2 * count / 3 ? 'medium' : 'hard'
      });
    }

    // If we still don't have enough questions, fill with generic ones
    if (questions.length < count) {
      const genericQuestions = JSON.parse(this.generateGenericQuestions(count - questions.length, topic));
      questions.push(...genericQuestions.questions);
    }

    return JSON.stringify({ questions: questions.slice(0, count) });
  }

  /**
   * Generate summary from content
   */
  generateSummary(content) {
    if (!content || content.trim().length < 50) {
      return "This material covers fundamental concepts. Please upload more detailed content for a better summary.";
    }

    // Extract first few sentences as summary
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 5);

    return sentences.join('. ') + '.';
  }

  /**
   * Generate flashcards from content
   */
  generateFlashcardsFromContent(content) {
    if (!content || content.trim().length < 50) {
      return this.generateGenericFlashcards();
    }

    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 10);

    const flashcards = sentences.map((sentence, i) => ({
      question: `What is mentioned about ${i === 0 ? 'the main topic' : 'concept ' + (i + 1)}?`,
      answer: sentence,
      difficulty: 'medium'
    }));

    return JSON.stringify({ flashcards: flashcards.slice(0, 5) });
  }

  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Fallback generic questions - generates exact count requested
   */
  generateGenericQuestions(count, topic = 'the subject') {
    const questionTemplates = [
      {
        question: `What is the main concept discussed in ${topic}?`,
        options: ["Core principle A", "Core principle B", "Core principle C", "Core principle D"],
        correctAnswer: "Core principle A",
        explanation: "This is the primary focus of the study material.",
        difficulty: "easy"
      },
      {
        question: `Which of the following is a key principle in ${topic}?`,
        options: ["Fundamental concept 1", "Fundamental concept 2", "Fundamental concept 3", "Fundamental concept 4"],
        correctAnswer: "Fundamental concept 2",
        explanation: "This principle is fundamental to understanding the topic.",
        difficulty: "easy"
      },
      {
        question: `How does ${topic} apply in practice?`,
        options: ["Practical application A", "Practical application B", "Practical application C", "Practical application D"],
        correctAnswer: "Practical application B",
        explanation: "This is the most common practical application.",
        difficulty: "medium"
      },
      {
        question: `What is an important characteristic of ${topic}?`,
        options: ["Characteristic W", "Characteristic X", "Characteristic Y", "Characteristic Z"],
        correctAnswer: "Characteristic X",
        explanation: "This characteristic is essential to the concept.",
        difficulty: "medium"
      },
      {
        question: `Which statement best describes ${topic}?`,
        options: ["Description 1", "Description 2", "Description 3", "Description 4"],
        correctAnswer: "Description 2",
        explanation: "This description accurately captures the essence of the topic.",
        difficulty: "medium"
      },
      {
        question: `What is a common misconception about ${topic}?`,
        options: ["Misconception A", "Misconception B", "Misconception C", "Correct understanding"],
        correctAnswer: "Correct understanding",
        explanation: "Understanding the correct concept helps avoid common mistakes.",
        difficulty: "hard"
      },
      {
        question: `In what context is ${topic} most relevant?`,
        options: ["Context Alpha", "Context Beta", "Context Gamma", "Context Delta"],
        correctAnswer: "Context Beta",
        explanation: "This context provides the most relevant application.",
        difficulty: "medium"
      },
      {
        question: `What is the relationship between ${topic} and related concepts?`,
        options: ["Relationship type 1", "Relationship type 2", "Relationship type 3", "Relationship type 4"],
        correctAnswer: "Relationship type 3",
        explanation: "This relationship is key to understanding the broader context.",
        difficulty: "hard"
      },
      {
        question: `Which example best illustrates ${topic}?`,
        options: ["Example A", "Example B", "Example C", "Example D"],
        correctAnswer: "Example C",
        explanation: "This example clearly demonstrates the concept in action.",
        difficulty: "medium"
      },
      {
        question: `What is the primary purpose of studying ${topic}?`,
        options: ["Purpose 1", "Purpose 2", "Purpose 3", "Purpose 4"],
        correctAnswer: "Purpose 1",
        explanation: "This purpose aligns with the learning objectives.",
        difficulty: "easy"
      },
      {
        question: `How can you identify ${topic} in real-world scenarios?`,
        options: ["Indicator A", "Indicator B", "Indicator C", "Indicator D"],
        correctAnswer: "Indicator B",
        explanation: "This indicator is the most reliable way to identify the concept.",
        difficulty: "hard"
      },
      {
        question: `What distinguishes ${topic} from similar concepts?`,
        options: ["Distinction 1", "Distinction 2", "Distinction 3", "Distinction 4"],
        correctAnswer: "Distinction 3",
        explanation: "This distinction is crucial for proper understanding.",
        difficulty: "hard"
      },
      {
        question: `Which approach is recommended when working with ${topic}?`,
        options: ["Approach Alpha", "Approach Beta", "Approach Gamma", "Approach Delta"],
        correctAnswer: "Approach Gamma",
        explanation: "This approach has proven most effective.",
        difficulty: "medium"
      },
      {
        question: `What is a foundational element of ${topic}?`,
        options: ["Element I", "Element II", "Element III", "Element IV"],
        correctAnswer: "Element II",
        explanation: "This element forms the foundation of the concept.",
        difficulty: "easy"
      },
      {
        question: `How does ${topic} contribute to overall understanding?`,
        options: ["Contribution method 1", "Contribution method 2", "Contribution method 3", "Contribution method 4"],
        correctAnswer: "Contribution method 2",
        explanation: "This contribution is essential for comprehensive understanding.",
        difficulty: "medium"
      },
      {
        question: `What should you consider when applying ${topic}?`,
        options: ["Consideration A", "Consideration B", "Consideration C", "Consideration D"],
        correctAnswer: "Consideration C",
        explanation: "This consideration ensures proper application.",
        difficulty: "hard"
      },
      {
        question: `Which factor is most important in ${topic}?`,
        options: ["Factor X", "Factor Y", "Factor Z", "Factor W"],
        correctAnswer: "Factor Y",
        explanation: "This factor has the greatest impact.",
        difficulty: "medium"
      },
      {
        question: `What is the expected outcome when studying ${topic}?`,
        options: ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
        correctAnswer: "Outcome 3",
        explanation: "This outcome represents successful learning.",
        difficulty: "easy"
      },
      {
        question: `How can ${topic} be effectively learned?`,
        options: ["Method A", "Method B", "Method C", "Method D"],
        correctAnswer: "Method B",
        explanation: "This method has been shown to be most effective.",
        difficulty: "medium"
      },
      {
        question: `What advanced concept builds upon ${topic}?`,
        options: ["Advanced concept 1", "Advanced concept 2", "Advanced concept 3", "Advanced concept 4"],
        correctAnswer: "Advanced concept 3",
        explanation: "This advanced concept extends the foundational knowledge.",
        difficulty: "hard"
      }
    ];

    // Generate exactly the requested count
    const questions = [];
    for (let i = 0; i < count; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      questions.push({
        question: template.question,
        type: "multiple-choice",
        options: template.options,
        correctAnswer: template.correctAnswer,
        explanation: template.explanation,
        difficulty: template.difficulty
      });
    }

    return JSON.stringify({ questions });
  }

  /**
   * Fallback generic flashcards
   */
  generateGenericFlashcards() {
    return JSON.stringify({
      flashcards: [
        { question: "What is the main topic?", answer: "The primary subject of study", difficulty: "easy" },
        { question: "Define the key concept", answer: "A fundamental principle in this field", difficulty: "medium" },
        { question: "How is this applied?", answer: "Through practical implementation", difficulty: "medium" }
      ]
    });
  }

  /**
   * FEATURE 1: Generate Practice Questions
   * Takes study material and generates relevant questions
   */
  async generateQuestions(content, options = {}) {
    const {
      subject = 'General',
      topic = 'Unknown',
      difficulty = 'medium',
      count = 5,
      type = 'mixed' // 'multiple-choice', 'true-false', 'short-answer', 'mixed'
    } = options;

    const systemPrompt = `You are an expert educational content creator specializing in ${subject}.
Your task is to generate high-quality practice questions that test understanding, not just memorization.

REQUIREMENTS:
- Create exactly ${count} questions
- Difficulty level: ${difficulty}
- Question types: ${type}
- Questions should be clear, unambiguous, and educationally valuable
- For multiple choice: provide 4 options with only 1 correct answer
- Include brief explanations for correct answers
- Cover different aspects of the content (don't repeat concepts)

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "...",
      "type": "multiple-choice|true-false|short-answer",
      "options": ["A", "B", "C", "D"], // only for multiple-choice
      "correctAnswer": "...",
      "explanation": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    const userPrompt = `Generate ${count} ${difficulty} ${type} questions from this content:

TOPIC: ${topic}

CONTENT:
${content.substring(0, 3000)} // Limit to avoid token overflow

Generate questions that test critical thinking and understanding.`;

    const response = await this.callLLM(systemPrompt, userPrompt, 2500);

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * FEATURE 2: Summarize Study Material
   * Creates concise summaries of long content
   */
  async summarizeContent(content, options = {}) {
    const {
      length = 'medium', // 'short', 'medium', 'long'
      focus = 'key-concepts' // 'key-concepts', 'facts', 'overview'
    } = options;

    const lengthGuide = {
      short: '2-3 sentences',
      medium: '1-2 paragraphs',
      long: '3-4 paragraphs'
    };

    const systemPrompt = `You are an expert at distilling complex information into clear, concise summaries.

REQUIREMENTS:
- Length: ${lengthGuide[length]}
- Focus: ${focus}
- Preserve critical information
- Use clear, accessible language
- Highlight main ideas and key takeaways
- Organize logically with proper structure

Create a summary that helps students quickly review and understand the material.`;

    const userPrompt = `Summarize the following study material:

${content.substring(0, 4000)}

Create a ${length} summary focusing on ${focus}.`;

    const summary = await this.callLLM(systemPrompt, userPrompt, 1500);
    return summary.trim();
  }

  /**
   * FEATURE 3: Explain Complex Concepts Simply
   * Breaks down difficult topics into understandable explanations
   */
  async explainConcept(concept, context = '', options = {}) {
    const {
      audienceLevel = 'high-school', // 'middle-school', 'high-school', 'college', 'expert'
      useAnalogies = true,
      includeExamples = true
    } = options;

    const systemPrompt = `You are a patient, skilled educator who excels at explaining complex concepts simply.

AUDIENCE: ${audienceLevel} level students
APPROACH:
${useAnalogies ? '- Use relatable analogies and metaphors' : ''}
${includeExamples ? '- Provide concrete examples' : ''}
- Break down complex ideas into simpler components
- Build understanding progressively
- Use everyday language
- Anticipate and address common misconceptions

Your goal is to make the student say "Aha! Now I get it!"`;

    const userPrompt = `Explain this concept clearly: ${concept}

${context ? `Additional context:\n${context}` : ''}

Make it understandable for ${audienceLevel} students.`;

    const explanation = await this.callLLM(systemPrompt, userPrompt, 1500);
    return explanation.trim();
  }

  /**
   * FEATURE 4: Identify Knowledge Gaps
   * Analyzes quiz performance to find weak areas
   */
  async identifyKnowledgeGaps(quizResults, materialContent) {
    const systemPrompt = `You are an educational analyst specializing in personalized learning paths.

TASK: Analyze quiz performance to identify knowledge gaps and provide targeted recommendations.

OUTPUT FORMAT (JSON):
{
  "gaps": [
    {
      "topic": "...",
      "severity": "high|medium|low",
      "evidence": "...",
      "recommendation": "..."
    }
  ],
  "strengths": ["..."],
  "overallAssessment": "...",
  "studyPriority": ["topic1", "topic2", "topic3"]
}`;

    const userPrompt = `Analyze this quiz performance:

QUIZ RESULTS:
${JSON.stringify(quizResults, null, 2)}

STUDY MATERIAL:
${materialContent.substring(0, 2000)}

Identify knowledge gaps and provide actionable recommendations.`;

    const response = await this.callLLM(systemPrompt, userPrompt, 2000);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing gap analysis:', error);
      throw new Error('Failed to analyze knowledge gaps');
    }
  }

  /**
   * FEATURE 5: Generate Flashcards
   * Creates effective flashcards from content
   */
  async generateFlashcards(content, count = 10) {
    const systemPrompt = `You are a flashcard creation expert. Create effective flashcards that:
- Focus on key concepts and important details
- Use clear, concise language
- Test understanding, not just memorization
- Follow best practices (one concept per card, avoid yes/no questions)

OUTPUT FORMAT (JSON):
{
  "flashcards": [
    {
      "question": "...",
      "answer": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    const userPrompt = `Create ${count} flashcards from this content:

${content.substring(0, 3000)}

Make them effective for active recall and spaced repetition.`;

    const response = await this.callLLM(systemPrompt, userPrompt, 2000);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.flashcards || [];
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }

  /**
   * FEATURE 6: Create Study Plan
   * Generates personalized study schedule
   */
  async createStudyPlan(userProfile, materials, weakTopics = []) {
    const systemPrompt = `You are an expert study planner using cognitive science principles.

Create a personalized study plan that:
- Uses spaced repetition
- Prioritizes weak topics
- Balances different subjects
- Accounts for user's available time
- Includes regular review sessions
- Progressively increases difficulty

OUTPUT FORMAT (JSON):
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "sessions": [
        {
          "subject": "...",
          "topic": "...",
          "duration": 30,
          "type": "reading|practice|review",
          "priority": "high|medium|low"
        }
      ]
    }
  ],
  "rationale": "..."
}`;

    const userPrompt = `Create a study plan for:

USER PROFILE:
- Daily study time: ${userProfile.dailyStudyTime} minutes
- Subjects: ${userProfile.subjects.join(', ')}
- Difficulty level: ${userProfile.difficulty}

WEAK TOPICS:
${weakTopics.map(t => `- ${t.topic}: ${t.accuracy}% accuracy`).join('\n')}

AVAILABLE MATERIALS:
${materials.length} study materials across ${[...new Set(materials.map(m => m.subject))].length} subjects

Create a 7-day study plan optimized for retention and understanding.`;

    const response = await this.callLLM(systemPrompt, userPrompt, 2500);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing study plan:', error);
      throw new Error('Failed to create study plan');
    }
  }
}

// Export singleton instance
module.exports = new AIService();
