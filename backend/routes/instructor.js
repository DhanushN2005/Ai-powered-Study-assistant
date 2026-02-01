const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeInstructor } = require('../middleware/authorize');
const {
    getStudents,
    getStudentDetails,
    assignMaterial,
    assignQuiz,
    getAnalytics,
    getQuizResults
} = require('../controllers/instructorController');

// All routes require authentication and instructor role
router.use(protect);
router.use(authorizeInstructor);

// Student management
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetails);

// Assignment
router.post('/assign-material', assignMaterial);
router.post('/assign-quiz', assignQuiz);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/quiz-results/:quizId', getQuizResults);

module.exports = router;
