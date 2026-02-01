const User = require('../models/User');
const Material = require('../models/Material');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const { asyncHandler } = require('../middleware/error');

/**
 * @desc    Get all students (for instructor)
 * @route   GET /api/instructor/students
 * @access  Private/Instructor
 */
exports.getStudents = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: students.length,
        data: students
    });
});

/**
 * @desc    Get student details with progress
 * @route   GET /api/instructor/students/:id
 * @access  Private/Instructor
 */
exports.getStudentDetails = asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id).select('-password');

    if (!student || student.role !== 'student') {
        return res.status(404).json({
            success: false,
            message: 'Student not found'
        });
    }

    // Get student's progress
    const progress = await Progress.find({ user: req.params.id })
        .sort({ date: -1 })
        .limit(30);

    // Get student's quizzes
    const quizzes = await Quiz.find({ user: req.params.id, completed: true })
        .sort({ completedAt: -1 })
        .limit(20);

    // Calculate stats
    const totalQuizzes = quizzes.length;
    const avgScore = totalQuizzes > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + q.score.percentage, 0) / totalQuizzes)
        : 0;

    const totalStudyTime = progress.reduce((sum, p) => sum + p.studyTime, 0);

    res.status(200).json({
        success: true,
        data: {
            student,
            stats: {
                totalQuizzes,
                avgScore,
                totalStudyTime
            },
            recentProgress: progress,
            recentQuizzes: quizzes
        }
    });
});

/**
 * @desc    Assign material to students
 * @route   POST /api/instructor/assign-material
 * @access  Private/Instructor
 */
exports.assignMaterial = asyncHandler(async (req, res) => {
    const { materialId, studentIds } = req.body;

    if (!materialId || !studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide material ID and student IDs'
        });
    }

    const material = await Material.findById(materialId);

    if (!material) {
        return res.status(404).json({
            success: false,
            message: 'Material not found'
        });
    }

    // Add assigned students to material
    material.assignedTo = material.assignedTo || [];
    studentIds.forEach(studentId => {
        if (!material.assignedTo.includes(studentId)) {
            material.assignedTo.push(studentId);
        }
    });

    await material.save();

    res.status(200).json({
        success: true,
        message: `Material assigned to ${studentIds.length} student(s)`,
        data: material
    });
});

/**
 * @desc    Assign quiz to students
 * @route   POST /api/instructor/assign-quiz
 * @access  Private/Instructor
 */
exports.assignQuiz = asyncHandler(async (req, res) => {
    const { quizId, studentIds, dueDate } = req.body;

    if (!quizId || !studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide quiz ID and student IDs'
        });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
        return res.status(404).json({
            success: false,
            message: 'Quiz not found'
        });
    }

    // Add assigned students to quiz
    quiz.assignedTo = quiz.assignedTo || [];
    quiz.dueDate = dueDate || null;

    studentIds.forEach(studentId => {
        if (!quiz.assignedTo.includes(studentId)) {
            quiz.assignedTo.push(studentId);
        }
    });

    await quiz.save();

    res.status(200).json({
        success: true,
        message: `Quiz assigned to ${studentIds.length} student(s)`,
        data: quiz
    });
});

/**
 * @desc    Get analytics for all students
 * @route   GET /api/instructor/analytics
 * @access  Private/Instructor
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'student' }).select('name email');

    const analytics = await Promise.all(
        students.map(async (student) => {
            const quizzes = await Quiz.find({
                user: student._id,
                completed: true
            });

            const progress = await Progress.find({ user: student._id });

            const totalQuizzes = quizzes.length;
            const avgScore = totalQuizzes > 0
                ? Math.round(quizzes.reduce((sum, q) => sum + q.score.percentage, 0) / totalQuizzes)
                : 0;

            const totalStudyTime = progress.reduce((sum, p) => sum + p.studyTime, 0);

            return {
                studentId: student._id,
                name: student.name,
                email: student.email,
                totalQuizzes,
                avgScore,
                totalStudyTime,
                lastActive: student.lastActive
            };
        })
    );

    res.status(200).json({
        success: true,
        data: analytics
    });
});

/**
 * @desc    Get quiz results for specific quiz
 * @route   GET /api/instructor/quiz-results/:quizId
 * @access  Private/Instructor
 */
exports.getQuizResults = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
        return res.status(404).json({
            success: false,
            message: 'Quiz not found'
        });
    }

    // Get all student attempts for this quiz (if it's a template)
    const results = await Quiz.find({
        $or: [
            { _id: req.params.quizId },
            { subject: quiz.subject, topic: quiz.topic, completed: true }
        ]
    })
        .populate('user', 'name email')
        .sort({ completedAt: -1 });

    res.status(200).json({
        success: true,
        data: results
    });
});
