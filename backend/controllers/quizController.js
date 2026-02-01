const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const { asyncHandler } = require('../middleware/error');

/**
 * @desc    Get all quizzes for user
 * @route   GET /api/quizzes
 * @access  Private
 */
exports.getQuizzes = asyncHandler(async (req, res) => {
  const { subject, completed } = req.query;

  const query = { user: req.user.id };
  if (subject) query.subject = subject;
  if (completed !== undefined) query.completed = completed === 'true';

  const quizzes = await Quiz.find(query)
    .sort({ createdAt: -1 })
    .select('-questions.explanation'); // Don't send explanations in list

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
});

/**
 * @desc    Get single quiz
 * @route   GET /api/quizzes/:id
 * @access  Private
 */
exports.getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

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

  // If quiz is not completed, don't send correct answers
  if (!quiz.completed) {
    quiz.questions.forEach(q => {
      delete q.correctAnswer;
      delete q.explanation;
    });
  }

  res.status(200).json({
    success: true,
    data: quiz
  });
});

/**
 * @desc    Submit quiz answers
 * @route   PUT /api/quizzes/:id/submit
 * @access  Private
 */
exports.submitQuiz = asyncHandler(async (req, res) => {
  const { answers, timeSpent } = req.body;

  const quiz = await Quiz.findById(req.params.id);

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

  if (quiz.completed) {
    return res.status(400).json({
      success: false,
      message: 'Quiz already completed'
    });
  }

  // Grade the quiz
  quiz.questions.forEach((question, index) => {
    const userAnswer = answers[index];
    question.userAnswer = userAnswer;
    question.isCorrect = this.compareAnswers(
      userAnswer,
      question.correctAnswer,
      question.type
    );
  });

  quiz.completed = true;
  quiz.completedAt = new Date();
  quiz.timeSpent = timeSpent || 0;

  await quiz.save(); // This will trigger pre-save hook to calculate score

  // Record progress
  // Add time spent on quiz to total study time (convert seconds to minutes)
  const studyTimeMinutes = Math.ceil((timeSpent || 0) / 60);

  await Progress.recordProgress(req.user.id, quiz.subject, quiz.topic, {
    quizzesTaken: 1,
    quizAccuracy: quiz.score.percentage,
    studyTime: studyTimeMinutes
  });

  // Gamification: Award XP
  let xpEarned = Math.round(quiz.score.percentage); // Base XP = Score
  if (quiz.score.percentage === 100) xpEarned += 50; // Perfection Bonus

  const user = await require('../models/User').findById(req.user.id);
  user.xp += xpEarned;

  // Level up logic (Level = 1 + XP/1000)
  const newLevel = Math.floor(user.xp / 1000) + 1;
  const leveledUp = newLevel > user.level;
  user.level = newLevel;

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      score: quiz.score,
      questions: quiz.questions,
      xpEarned,
      leveledUp,
      newTotalXp: user.xp,
      currentLevel: user.level
    }
  });
});

/**
 * Helper function to compare answers
 */
exports.compareAnswers = (userAnswer, correctAnswer, questionType) => {
  if (!userAnswer) return false;

  const normalize = (str) =>
    str.toString().toLowerCase().trim().replace(/\s+/g, ' ');

  if (questionType === 'multiple-choice' || questionType === 'true-false') {
    return normalize(userAnswer) === normalize(correctAnswer);
  }

  if (questionType === 'short-answer') {
    // For short answers, allow some flexibility
    const user = normalize(userAnswer);
    const correct = normalize(correctAnswer);

    // Exact match
    if (user === correct) return true;

    // Check if answer contains correct answer
    if (user.includes(correct) || correct.includes(user)) {
      return user.length > correct.length * 0.7; // At least 70% match
    }

    return false;
  }

  return false;
};

/**
 * @desc    Delete quiz
 * @route   DELETE /api/quizzes/:id
 * @access  Private
 */
exports.deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

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

  await quiz.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get quiz statistics
 * @route   GET /api/quizzes/stats
 * @access  Private
 */
exports.getQuizStats = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({
    user: req.user.id,
    completed: true
  });

  if (quizzes.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalQuizzes: 0,
        averageScore: 0,
        bySubject: {},
        byDifficulty: {},
        recentPerformance: []
      }
    });
  }

  // Calculate overall stats
  const totalScore = quizzes.reduce((sum, q) => sum + q.score.percentage, 0);
  const averageScore = Math.round(totalScore / quizzes.length);

  // Stats by subject
  const bySubject = {};
  quizzes.forEach(quiz => {
    if (!bySubject[quiz.subject]) {
      bySubject[quiz.subject] = {
        count: 0,
        totalScore: 0,
        avgScore: 0
      };
    }
    bySubject[quiz.subject].count++;
    bySubject[quiz.subject].totalScore += quiz.score.percentage;
  });

  Object.keys(bySubject).forEach(subject => {
    const stats = bySubject[subject];
    stats.avgScore = Math.round(stats.totalScore / stats.count);
    delete stats.totalScore;
  });

  // Stats by difficulty
  const byDifficulty = {};
  quizzes.forEach(quiz => {
    if (!byDifficulty[quiz.difficulty]) {
      byDifficulty[quiz.difficulty] = {
        count: 0,
        totalScore: 0,
        avgScore: 0
      };
    }
    byDifficulty[quiz.difficulty].count++;
    byDifficulty[quiz.difficulty].totalScore += quiz.score.percentage;
  });

  Object.keys(byDifficulty).forEach(difficulty => {
    const stats = byDifficulty[difficulty];
    stats.avgScore = Math.round(stats.totalScore / stats.count);
    delete stats.totalScore;
  });

  // Recent performance (last 10 quizzes)
  const recentPerformance = quizzes
    .slice(-10)
    .reverse()
    .map(q => ({
      date: q.completedAt,
      subject: q.subject,
      score: q.score.percentage
    }));

  res.status(200).json({
    success: true,
    data: {
      totalQuizzes: quizzes.length,
      averageScore,
      bySubject,
      byDifficulty,
      recentPerformance
    }
  });
});

/**
 * @desc    Get quizzes assigned to current user
 * @route   GET /api/quizzes/assigned
 * @access  Private
 */
exports.getAssignedQuizzes = asyncHandler(async (req, res) => {
  const assignedQuizzes = await Quiz.find({
    assignedTo: req.user.id,
    completed: false
  })
    .populate('material', 'title subject topic')
    .sort({ dueDate: 1, createdAt: -1 })
    .select('-questions.correctAnswer -questions.explanation');

  res.status(200).json({
    success: true,
    count: assignedQuizzes.length,
    data: assignedQuizzes
  });
});

