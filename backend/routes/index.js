const express = require('express');
const { protect } = require('../middleware/auth');

// AI Routes
const aiRouter = express.Router();
const {
  generateQuestions,
  explainConcept,
  summarizeText,
  analyzeKnowledgeGaps,
  generateStudyPlan,
  getRecommendations
} = require('../controllers/aiController');

aiRouter.post('/questions', protect, generateQuestions);
aiRouter.post('/summary', protect, summarizeText);
aiRouter.post('/explain', protect, explainConcept);
aiRouter.post('/analyze-gaps', protect, analyzeKnowledgeGaps);
aiRouter.post('/study-plan', protect, generateStudyPlan);
aiRouter.get('/recommendations', protect, getRecommendations);

// Quiz Routes
const quizRouter = express.Router();
const {
  getQuizzes,
  getQuiz,
  submitQuiz,
  deleteQuiz,
  getQuizStats,
  getAssignedQuizzes
} = require('../controllers/quizController');

quizRouter.get('/', protect, getQuizzes);
quizRouter.get('/stats', protect, getQuizStats);
quizRouter.get('/assigned', protect, getAssignedQuizzes);
quizRouter.get('/:id', protect, getQuiz);
quizRouter.put('/:id/submit', protect, submitQuiz);
quizRouter.delete('/:id', protect, deleteQuiz);

// Scheduler Routes
const schedulerRouter = express.Router();
const {
  getSchedule,
  getSessions,
  createSession,
  deleteSession,
  startSession,
  completeSession,
  getStreak
} = require('../controllers/schedulerController');

schedulerRouter.get('/schedule', protect, getSchedule);
schedulerRouter.get('/sessions', protect, getSessions);
schedulerRouter.post('/sessions', protect, createSession);
schedulerRouter.delete('/sessions/:id', protect, deleteSession);
schedulerRouter.put('/sessions/:id/start', protect, startSession);
schedulerRouter.put('/sessions/:id/complete', protect, completeSession);
schedulerRouter.get('/streak', protect, getStreak);

// Analytics Routes
const analyticsRouter = express.Router();
const {
  getDashboard,
  getProgress,
  getKnowledgeGaps,
  getLearningVelocity,
  getLeaderboard
} = require('../controllers/schedulerController');

analyticsRouter.get('/dashboard', protect, getDashboard);
analyticsRouter.get('/progress', protect, getProgress);
analyticsRouter.get('/gaps', protect, getKnowledgeGaps);
analyticsRouter.get('/velocity', protect, getLearningVelocity);
analyticsRouter.get('/leaderboard', protect, getLeaderboard);

// Discussion Routes
const discussionRouter = express.Router();
const {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  markAsAnswer,
  upvoteDiscussion,
  removeUpvote,
  upvoteReply,
  getPopularDiscussions,
  getAIAnswer
} = require('../controllers/discussionController');

discussionRouter.get('/', protect, getDiscussions);
discussionRouter.get('/popular', protect, getPopularDiscussions);
discussionRouter.get('/:id', protect, getDiscussion);
discussionRouter.post('/', protect, createDiscussion);
discussionRouter.put('/:id', protect, updateDiscussion);
discussionRouter.delete('/:id', protect, deleteDiscussion);
discussionRouter.post('/:id/replies', protect, addReply);
discussionRouter.post('/:id/ai-answer', protect, getAIAnswer);
discussionRouter.put('/:id/replies/:replyId/answer', protect, markAsAnswer);
discussionRouter.post('/:id/upvote', protect, upvoteDiscussion);
discussionRouter.delete('/:id/upvote', protect, removeUpvote);
discussionRouter.post('/:id/replies/:replyId/upvote', protect, upvoteReply);

module.exports = {
  aiRouter,
  quizRouter,
  schedulerRouter,
  analyticsRouter,
  discussionRouter
};
