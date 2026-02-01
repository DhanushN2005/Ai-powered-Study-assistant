const Material = require('../models/Material');
const Quiz = require('../models/Quiz');
const { asyncHandler } = require('../middleware/error');
const aiService = require('../services/aiService');

/**
 * @desc    Generate practice questions from material
 * @route   POST /api/ai/questions
 * @access  Private
 */
exports.generateQuestions = asyncHandler(async (req, res) => {
  const { materialId, subject, topic, difficulty, count, type } = req.body;

  let content;

  if (materialId) {
    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check ownership or assignment
    const isOwner = material.user.toString() === req.user.id;
    const isAssigned = material.assignedTo && material.assignedTo.includes(req.user.id);
    const isShared = material.shared;

    if (!isOwner && !isAssigned && !isShared) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this material'
      });
    }

    content = material.content;
  } else if (req.body.content) {
    content = req.body.content;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please provide either materialId or content'
    });
  }

  // Generate questions using AI
  const questions = await aiService.generateQuestions(content, {
    subject: subject || 'General',
    topic: topic || 'Unknown',
    difficulty: difficulty || 'medium',
    count: count || 5,
    type: type || 'mixed'
  });

  // Create quiz
  const quiz = await Quiz.create({
    user: req.user.id,
    material: materialId,
    subject: subject || 'General',
    topic: topic || 'Unknown',
    questions: questions,
    difficulty: difficulty || 'medium',
    aiGenerated: true,
    score: {
      correct: 0,
      total: questions.length,
      percentage: 0
    },
    completed: false
  });

  res.status(201).json({
    success: true,
    data: quiz
  });
});

/**
 * @desc    Explain a concept simply
 * @route   POST /api/ai/explain
 * @access  Private
 */
exports.explainConcept = asyncHandler(async (req, res) => {
  const { concept, context, audienceLevel, useAnalogies, includeExamples } = req.body;

  if (!concept) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a concept to explain'
    });
  }

  const explanation = await aiService.explainConcept(
    concept,
    context || '',
    {
      audienceLevel: audienceLevel || 'high-school',
      useAnalogies: useAnalogies !== false,
      includeExamples: includeExamples !== false
    }
  );

  res.status(200).json({
    success: true,
    data: {
      concept,
      explanation
    }
  });
});
exports.summarizeText = asyncHandler(async (req, res) => {
  const { content, length, focus } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Please provide content to summarize'
    });
  }

  const summary = await aiService.summarizeContent(content, {
    length: length || 'medium',
    focus: focus || 'key-concepts'
  });

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

/**
 * @desc    Identify knowledge gaps from quiz results
 * @route   POST /api/ai/analyze-gaps
 * @access  Private
 */
exports.analyzeKnowledgeGaps = asyncHandler(async (req, res) => {
  const { quizId } = req.body;

  const quiz = await Quiz.findById(quizId).populate('material');

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  if (quiz.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (!quiz.completed) {
    return res.status(400).json({
      success: false,
      message: 'Quiz must be completed first'
    });
  }

  // Prepare quiz results for analysis
  const quizResults = {
    subject: quiz.subject,
    topic: quiz.topic,
    score: quiz.score,
    questions: quiz.questions.map(q => ({
      question: q.question,
      userAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: q.isCorrect,
      difficulty: q.difficulty
    }))
  };

  const materialContent = quiz.material ? quiz.material.content : '';

  // Analyze gaps using AI
  const analysis = await aiService.identifyKnowledgeGaps(quizResults, materialContent);

  res.status(200).json({
    success: true,
    data: analysis
  });
});

/**
 * @desc    Generate personalized study plan
 * @route   POST /api/ai/study-plan
 * @access  Private
 */
exports.generateStudyPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user profile
  const User = require('../models/User');
  const user = await User.findById(userId);

  // Get user's materials
  const materials = await Material.find({ user: userId });

  // Get weak topics from progress
  const Progress = require('../models/Progress');
  const weakTopics = await Progress.identifyGaps(userId);

  // Prepare user profile
  const userProfile = {
    dailyStudyTime: user.studyGoals?.dailyStudyTime || 120,
    subjects: user.subjects || [],
    difficulty: user.studyPreferences?.difficulty || 'intermediate'
  };

  // Generate plan using AI
  const studyPlan = await aiService.createStudyPlan(
    userProfile,
    materials,
    weakTopics
  );

  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

/**
 * @desc    Get AI-powered study recommendations
 * @route   GET /api/ai/recommendations
 * @access  Private
 */
exports.getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get recent quiz performance
  const recentQuizzes = await Quiz.find({
    user: userId,
    completed: true
  })
    .sort({ completedAt: -1 })
    .limit(10);

  // Get materials
  const materials = await Material.find({ user: userId });

  // Calculate subject performance
  const subjectPerformance = {};
  recentQuizzes.forEach(quiz => {
    if (!subjectPerformance[quiz.subject]) {
      subjectPerformance[quiz.subject] = {
        totalQuizzes: 0,
        totalScore: 0,
        avgScore: 0
      };
    }
    subjectPerformance[quiz.subject].totalQuizzes++;
    subjectPerformance[quiz.subject].totalScore += quiz.score.percentage;
  });

  Object.keys(subjectPerformance).forEach(subject => {
    const perf = subjectPerformance[subject];
    perf.avgScore = Math.round(perf.totalScore / perf.totalQuizzes);
  });

  // Generate recommendations
  const recommendations = [];

  // Recommend focusing on weak subjects
  const weakSubjects = Object.entries(subjectPerformance)
    .filter(([_, perf]) => perf.avgScore < 70)
    .sort((a, b) => a[1].avgScore - b[1].avgScore)
    .slice(0, 3);

  weakSubjects.forEach(([subject, perf]) => {
    recommendations.push({
      type: 'focus',
      subject,
      reason: `Low average score: ${perf.avgScore}%`,
      priority: 'high',
      action: 'Review materials and take practice quizzes'
    });
  });

  // Recommend reviewing old materials
  const oldMaterials = materials
    .filter(m => {
      const daysSince = (Date.now() - new Date(m.lastStudied || m.createdAt)) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    })
    .slice(0, 3);

  oldMaterials.forEach(material => {
    recommendations.push({
      type: 'review',
      material: material._id,
      subject: material.subject,
      topic: material.topic,
      reason: 'Not studied recently',
      priority: 'medium',
      action: 'Review this material to maintain retention'
    });
  });

  // Recommend practicing flashcards
  const materialsWithDueCards = materials.filter(m => m.dueFlashcards > 0);
  if (materialsWithDueCards.length > 0) {
    recommendations.push({
      type: 'flashcards',
      count: materialsWithDueCards.reduce((sum, m) => sum + m.dueFlashcards, 0),
      reason: 'Flashcards due for review',
      priority: 'high',
      action: 'Review due flashcards using spaced repetition'
    });
  }

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations,
      performance: subjectPerformance
    }
  });
});
