const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  type: {
    type: String,
    enum: ['pdf', 'text', 'image', 'note'],
    required: true
  },
  filePath: {
    type: String // Path to uploaded file
  },
  content: {
    type: String, // Extracted text content
    required: true
  },
  summary: {
    type: String // AI-generated summary
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  flashcards: [{
    question: String,
    answer: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    nextReview: Date,
    repetitions: {
      type: Number,
      default: 0
    },
    easeFactor: {
      type: Number,
      default: 2.5
    }
  }],
  metadata: {
    pageCount: Number,
    wordCount: Number,
    estimatedReadTime: Number, // minutes
    fileSize: Number // bytes
  },
  shared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastStudied: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
materialSchema.index({ user: 1, subject: 1, topic: 1 });
materialSchema.index({ tags: 1 });
materialSchema.index({ 'flashcards.nextReview': 1 });

// Virtual for calculating review due flashcards
materialSchema.virtual('dueFlashcards').get(function () {
  const now = new Date();
  return this.flashcards.filter(card =>
    !card.nextReview || card.nextReview <= now
  ).length;
});

// Method to calculate estimated study time
materialSchema.methods.calculateStudyTime = function () {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;
  return Math.ceil(this.metadata.wordCount / wordsPerMinute);
};

module.exports = mongoose.model('Material', materialSchema);
