const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    index: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice'
    },
    options: [String], // For multiple choice
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: String,
    userAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number, // seconds
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  score: {
    correct: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  timeSpent: {
    type: Number, // Total seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  aiGenerated: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dueDate: Date
}, {
  timestamps: true
});

// Index for analytics queries
quizSchema.index({ user: 1, subject: 1, createdAt: -1 });
quizSchema.index({ user: 1, completed: 1 });

// Calculate score before saving
quizSchema.pre('save', function (next) {
  if (this.completed && this.questions.length > 0) {
    const correct = this.questions.filter(q => q.isCorrect).length;
    this.score.correct = correct;
    this.score.total = this.questions.length;
    this.score.percentage = Math.round((correct / this.questions.length) * 100);
  }
  next();
});

// Method to identify weak topics
quizSchema.methods.getWeakTopics = function () {
  const topicPerformance = {};

  this.questions.forEach(q => {
    if (!topicPerformance[this.topic]) {
      topicPerformance[this.topic] = { correct: 0, total: 0 };
    }
    topicPerformance[this.topic].total++;
    if (q.isCorrect) {
      topicPerformance[this.topic].correct++;
    }
  });

  return Object.entries(topicPerformance)
    .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
    .map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100)
    }));
};

module.exports = mongoose.model('Quiz', quizSchema);
