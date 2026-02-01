const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    index: true
  },
  // Daily aggregated data
  date: {
    type: Date,
    required: true,
    index: true
  },
  studyTime: {
    type: Number, // minutes
    default: 0
  },
  sessionsCompleted: {
    type: Number,
    default: 0
  },
  quizzesTaken: {
    type: Number,
    default: 0
  },
  quizAccuracy: {
    type: Number, // percentage
    default: 0
  },
  flashcardsReviewed: {
    type: Number,
    default: 0
  },
  materialsStudied: {
    type: Number,
    default: 0
  },
  // Performance metrics
  performance: {
    weak: {
      type: Boolean,
      default: false
    },
    improving: {
      type: Boolean,
      default: false
    },
    mastered: {
      type: Boolean,
      default: false
    }
  },
  // Retention metrics
  retention: {
    shortTerm: Number, // Quiz performance within 24 hours
    mediumTerm: Number, // Quiz performance within 7 days
    longTerm: Number // Quiz performance after 7 days
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, subject: 1, date: -1 });
progressSchema.index({ user: 1, subject: 1, topic: 1, date: -1 });

// Static method to update or create progress entry
progressSchema.statics.recordProgress = async function(userId, subject, topic, data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const progress = await this.findOneAndUpdate(
    {
      user: userId,
      subject: subject,
      topic: topic || 'general',
      date: today
    },
    {
      $inc: {
        studyTime: data.studyTime || 0,
        sessionsCompleted: data.sessionsCompleted || 0,
        quizzesTaken: data.quizzesTaken || 0,
        flashcardsReviewed: data.flashcardsReviewed || 0,
        materialsStudied: data.materialsStudied || 0
      },
      $set: {
        quizAccuracy: data.quizAccuracy !== undefined ? data.quizAccuracy : undefined
      }
    },
    {
      upsert: true,
      new: true
    }
  );

  return progress;
};

// Method to calculate learning velocity (progress over time)
progressSchema.statics.calculateVelocity = async function(userId, subject, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const progressData = await this.find({
    user: userId,
    subject: subject,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  if (progressData.length < 2) return 0;

  const totalAccuracy = progressData.reduce((sum, p) => sum + (p.quizAccuracy || 0), 0);
  const avgAccuracy = totalAccuracy / progressData.length;

  return avgAccuracy;
};

// Method to identify knowledge gaps
progressSchema.statics.identifyGaps = async function(userId) {
  const recentProgress = await this.find({
    user: userId,
    date: { 
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  });

  const subjectPerformance = {};

  recentProgress.forEach(p => {
    const key = `${p.subject}:${p.topic}`;
    if (!subjectPerformance[key]) {
      subjectPerformance[key] = {
        subject: p.subject,
        topic: p.topic,
        totalQuizzes: 0,
        avgAccuracy: 0,
        studyTime: 0
      };
    }
    subjectPerformance[key].totalQuizzes += p.quizzesTaken;
    subjectPerformance[key].avgAccuracy += p.quizAccuracy || 0;
    subjectPerformance[key].studyTime += p.studyTime;
  });

  const gaps = Object.values(subjectPerformance)
    .filter(p => p.totalQuizzes > 0)
    .map(p => ({
      ...p,
      avgAccuracy: p.avgAccuracy / recentProgress.filter(pr => 
        pr.subject === p.subject && pr.topic === p.topic
      ).length
    }))
    .filter(p => p.avgAccuracy < 70)
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

  return gaps;
};

module.exports = mongoose.model('Progress', progressSchema);
