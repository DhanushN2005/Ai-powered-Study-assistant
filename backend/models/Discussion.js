const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isAnswer: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const discussionSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    replies: [replySchema],
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'answered', 'closed'],
        default: 'open',
        index: true
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
discussionSchema.index({ subject: 1, createdAt: -1 });
discussionSchema.index({ status: 1, createdAt: -1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ upvotes: 1 });

// Virtual for reply count
discussionSchema.virtual('replyCount').get(function () {
    return this.replies.length;
});

// Virtual for upvote count
discussionSchema.virtual('upvoteCount').get(function () {
    return this.upvotes.length;
});

// Enable virtuals in JSON
discussionSchema.set('toJSON', { virtuals: true });
discussionSchema.set('toObject', { virtuals: true });

// Method to add reply
discussionSchema.methods.addReply = function (userId, content) {
    this.replies.push({
        user: userId,
        content: content
    });
    return this.save();
};

// Method to mark reply as answer
discussionSchema.methods.markAsAnswer = function (replyId) {
    const reply = this.replies.id(replyId);
    if (reply) {
        // Remove answer status from other replies
        this.replies.forEach(r => r.isAnswer = false);
        reply.isAnswer = true;
        this.status = 'answered';
        return this.save();
    }
    return null;
};

// Method to upvote discussion
discussionSchema.methods.upvote = function (userId) {
    if (!this.upvotes.includes(userId)) {
        this.upvotes.push(userId);
        return this.save();
    }
    return this;
};

// Method to remove upvote
discussionSchema.methods.removeUpvote = function (userId) {
    this.upvotes = this.upvotes.filter(id => !id.equals(userId));
    return this.save();
};

// Method to increment views
discussionSchema.methods.incrementViews = function () {
    this.views += 1;
    return this.save();
};

module.exports = mongoose.model('Discussion', discussionSchema);
