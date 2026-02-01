const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
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
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  scheduledDuration: {
    type: Number, // minutes
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number, // minutes
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'missed', 'rescheduled'],
    default: 'scheduled',
    index: true
  },
  type: {
    type: String,
    enum: ['reading', 'practice', 'review', 'flashcards'],
    required: true
  },
  notes: String,
  productivity: {
    type: Number, // 1-5 rating
    min: 1,
    max: 5
  },
  completed: {
    type: Boolean,
    default: false
  },
  // Spaced repetition data
  repetitionNumber: {
    type: Number,
    default: 0
  },
  interval: {
    type: Number, // days until next review
    default: 1
  },
  easeFactor: {
    type: Number,
    default: 2.5
  },
  nextReview: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for frontend compatibility
studySessionSchema.virtual('scheduledFor').get(function () {
  return this.scheduledDate;
});

// Indexes for scheduling queries
studySessionSchema.index({ user: 1, scheduledDate: 1, status: 1 });
studySessionSchema.index({ user: 1, nextReview: 1 });
studySessionSchema.index({ user: 1, subject: 1, topic: 1 });

// Calculate actual duration when session ends
studySessionSchema.pre('save', function (next) {
  if (this.actualStartTime && this.actualEndTime) {
    const durationMs = this.actualEndTime - this.actualStartTime;
    this.actualDuration = Math.round(durationMs / 60000); // Convert to minutes
  }
  next();
});

// SM-2 Algorithm for spaced repetition
studySessionSchema.methods.calculateNextReview = function (quality) {
  // quality: 0-5 (0 = complete blackout, 5 = perfect response)

  if (quality < 3) {
    // Reset if quality is too low
    this.repetitionNumber = 0;
    this.interval = 1;
  } else {
    if (this.repetitionNumber === 0) {
      this.interval = 1;
    } else if (this.repetitionNumber === 1) {
      this.interval = 6;
    } else {
      this.interval = Math.round(this.interval * this.easeFactor);
    }
    this.repetitionNumber++;
  }

  // Update ease factor
  this.easeFactor = this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (this.easeFactor < 1.3) {
    this.easeFactor = 1.3;
  }

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + this.interval);
  this.nextReview = nextDate;

  return this.nextReview;
};

// Method to mark session as completed
studySessionSchema.methods.complete = function (productivity = 3) {
  this.status = 'completed';
  this.completed = true;
  this.actualEndTime = new Date();
  this.productivity = productivity;
  return this.save();
};

module.exports = mongoose.model('StudySession', studySessionSchema);
