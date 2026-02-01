const StudySession = require('../models/StudySession');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const schedulerService = require('../services/schedulerService');

/**
 * SCHEDULER CONTROLLER
 */

/**
 * @desc    Get study schedule
 * @route   GET /api/scheduler/schedule
 * @access  Private
 */
exports.getSchedule = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const schedule = await schedulerService.generateSchedule(
    req.user.id,
    parseInt(days)
  );

  res.status(200).json({
    success: true,
    data: schedule
  });
});

/**
 * @desc    Create a new study session
 * @route   POST /api/scheduler/sessions
 * @access  Private
 */
exports.createSession = asyncHandler(async (req, res) => {
  const { subject, topic, duration, scheduledFor, materialId, type } = req.body;

  if (!subject || !topic || !scheduledFor || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Please provide subject, topic, date/time and duration'
    });
  }

  const session = await StudySession.create({
    user: req.user.id,
    subject,
    topic,
    scheduledDuration: duration,
    scheduledDate: scheduledFor,
    material: materialId,
    type: type || 'practice'
  });

  res.status(201).json({
    success: true,
    data: session
  });
});

/**
 * @desc    Get all study sessions
 * @route   GET /api/scheduler/sessions
 * @access  Private
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;

  const query = { user: req.user.id };

  if (status) query.status = status;

  if (startDate || endDate) {
    query.scheduledDate = {};
    if (startDate) query.scheduledDate.$gte = new Date(startDate);
    if (endDate) query.scheduledDate.$lte = new Date(endDate);
  }

  const sessions = await StudySession.find(query)
    .populate('material', 'title subject topic')
    .sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
});

/**
 * @desc    Start a study session
 * @route   PUT /api/scheduler/sessions/:id/start
 * @access  Private
 */
exports.startSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  session.status = 'in-progress';
  session.actualStartTime = new Date();
  await session.save();

  res.status(200).json({
    success: true,
    data: session
  });
});

/**
 * @desc    Complete a study session
 * @route   PUT /api/scheduler/sessions/:id/complete
 * @access  Private
 */
exports.completeSession = asyncHandler(async (req, res) => {
  const { productivity, notes } = req.body;

  const session = await StudySession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  session.actualEndTime = new Date();
  session.status = 'completed';
  session.completed = true;
  session.productivity = productivity || 3;
  session.notes = notes || '';

  // Calculate actual duration
  if (session.actualStartTime) {
    const durationMs = session.actualEndTime - session.actualStartTime;
    session.actualDuration = Math.round(durationMs / 60000);
  }

  await session.save();

  // Record progress
  await Progress.recordProgress(req.user.id, session.subject, session.topic, {
    studyTime: session.actualDuration || session.scheduledDuration,
    sessionsCompleted: 1,
    materialsStudied: session.material ? 1 : 0
  });

  // Update material last studied
  if (session.material) {
    await require('../models/Material').findByIdAndUpdate(
      session.material,
      { lastStudied: new Date() }
    );
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

/**
 * @desc    Delete a study session
 * @route   DELETE /api/scheduler/sessions/:id
 * @access  Private
 */
exports.deleteSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  await session.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get study streak
 * @route   GET /api/scheduler/streak
 * @access  Private
 */
exports.getStreak = asyncHandler(async (req, res) => {
  const streak = await schedulerService.getStreak(req.user.id);

  res.status(200).json({
    success: true,
    data: streak
  });
});

/**
 * ANALYTICS CONTROLLER
 */

/**
 * @desc    Get analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get progress data
  const progressData = await Progress.find({
    user: userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  // Calculate totals
  const totals = {
    studyTime: 0,
    sessionsCompleted: 0,
    quizzesTaken: 0,
    flashcardsReviewed: 0,
    materialsStudied: 0
  };

  progressData.forEach(p => {
    totals.studyTime += p.studyTime;
    totals.sessionsCompleted += p.sessionsCompleted;
    totals.quizzesTaken += p.quizzesTaken;
    totals.flashcardsReviewed += p.flashcardsReviewed;
    totals.materialsStudied += p.materialsStudied;
  });

  // Get subject breakdown
  const bySubject = {};
  progressData.forEach(p => {
    if (!bySubject[p.subject]) {
      bySubject[p.subject] = {
        studyTime: 0,
        quizzesTaken: 0,
        avgAccuracy: 0,
        accuracyCount: 0
      };
    }
    bySubject[p.subject].studyTime += p.studyTime;
    bySubject[p.subject].quizzesTaken += p.quizzesTaken;
    if (p.quizAccuracy > 0) {
      bySubject[p.subject].avgAccuracy += p.quizAccuracy;
      bySubject[p.subject].accuracyCount++;
    }
  });

  Object.keys(bySubject).forEach(subject => {
    const stats = bySubject[subject];
    if (stats.accuracyCount > 0) {
      stats.avgAccuracy = Math.round(stats.avgAccuracy / stats.accuracyCount);
    }
    delete stats.accuracyCount;
  });

  // Get streak
  const streak = await schedulerService.getStreak(userId);

  // Get weak topics
  const weakTopics = await Progress.identifyGaps(userId);

  res.status(200).json({
    success: true,
    data: {
      totals,
      bySubject,
      streak,
      weakTopics: weakTopics.slice(0, 5),
      dailyProgress: progressData.map(p => ({
        date: p.date,
        studyTime: p.studyTime,
        quizAccuracy: p.quizAccuracy
      }))
    }
  });
});

/**
 * @desc    Get progress for specific subject/topic
 * @route   GET /api/analytics/progress
 * @access  Private
 */
exports.getProgress = asyncHandler(async (req, res) => {
  const { subject, topic, days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const query = {
    user: req.user.id,
    date: { $gte: startDate }
  };

  if (subject) query.subject = subject;
  if (topic) query.topic = topic;

  const progressData = await Progress.find(query).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: progressData.length,
    data: progressData
  });
});

/**
 * @desc    Get knowledge gaps
 * @route   GET /api/analytics/gaps
 * @access  Private
 */
exports.getKnowledgeGaps = asyncHandler(async (req, res) => {
  const gaps = await Progress.identifyGaps(req.user.id);

  res.status(200).json({
    success: true,
    count: gaps.length,
    data: gaps
  });
});

/**
 * @desc    Get learning velocity (progress over time)
 * @route   GET /api/analytics/velocity
 * @access  Private
 */
exports.getLearningVelocity = asyncHandler(async (req, res) => {
  const { subject, days = 7 } = req.query;

  const velocity = await Progress.calculateVelocity(
    req.user.id,
    subject,
    parseInt(days)
  );

  res.status(200).json({
    success: true,
    data: {
      subject,
      period: `${days} days`,
      velocity
    }
  });
});

/**
 * @desc    Get leaderboard
 * @route   GET /api/analytics/leaderboard
 * @access  Private
 */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({ role: 'student' })
    .sort({ xp: -1 })
    .limit(10)
    .select('name xp level avatar');

  // Find current user's rank
  const userRank = await User.countDocuments({
    role: 'student',
    xp: { $gt: req.user.xp }
  }) + 1;

  res.status(200).json({
    success: true,
    data: {
      leaderboard: topUsers,
      userRank,
      userXP: req.user.xp,
      userLevel: req.user.level
    }
  });
});
