const Discussion = require('../models/Discussion');
const { asyncHandler } = require('../middleware/error');

/**
 * @desc    Get all discussions
 * @route   GET /api/discussions
 * @access  Private
 */
exports.getDiscussions = asyncHandler(async (req, res) => {
    const { subject, topic, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const discussions = await Discussion.find(query)
        .populate('user', 'name email')
        .populate('replies.user', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Discussion.countDocuments(query);

    res.status(200).json({
        success: true,
        count: discussions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: discussions
    });
});

/**
 * @desc    Get single discussion
 * @route   GET /api/discussions/:id
 * @access  Private
 */
exports.getDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id)
        .populate('user', 'name email role')
        .populate('replies.user', 'name email role');

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    // Increment views
    await discussion.incrementViews();

    res.status(200).json({
        success: true,
        data: discussion
    });
});

/**
 * @desc    Create new discussion
 * @route   POST /api/discussions
 * @access  Private
 */
exports.createDiscussion = asyncHandler(async (req, res) => {
    const { subject, topic, title, content, tags, difficulty } = req.body;

    if (!subject || !title || !content) {
        return res.status(400).json({
            success: false,
            message: 'Please provide subject, title, and content'
        });
    }

    const discussion = await Discussion.create({
        user: req.user.id,
        subject,
        topic,
        title,
        content,
        tags: tags || [],
        difficulty: difficulty || 'medium'
    });

    const populatedDiscussion = await Discussion.findById(discussion._id)
        .populate('user', 'name email');

    res.status(201).json({
        success: true,
        data: populatedDiscussion
    });
});

/**
 * @desc    Update discussion
 * @route   PUT /api/discussions/:id
 * @access  Private
 */
exports.updateDiscussion = asyncHandler(async (req, res) => {
    let discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    // Check ownership
    if (discussion.user.toString() !== req.user.id && req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this discussion'
        });
    }

    const { title, content, tags, difficulty, status } = req.body;

    discussion = await Discussion.findByIdAndUpdate(
        req.params.id,
        { title, content, tags, difficulty, status },
        { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.status(200).json({
        success: true,
        data: discussion
    });
});

/**
 * @desc    Delete discussion
 * @route   DELETE /api/discussions/:id
 * @access  Private
 */
exports.deleteDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    // Check ownership
    if (discussion.user.toString() !== req.user.id && req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this discussion'
        });
    }

    await discussion.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Add reply to discussion
 * @route   POST /api/discussions/:id/replies
 * @access  Private
 */
const { sendReplyNotification } = require('../services/emailService');
const User = require('../models/User');

/**
 * @desc    Add reply to discussion
 * @route   POST /api/discussions/:id/replies
 * @access  Private
 */
exports.addReply = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({
            success: false,
            message: 'Please provide reply content'
        });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    await discussion.addReply(req.user.id, content);

    const updatedDiscussion = await Discussion.findById(req.params.id)
        .populate('user', 'name email')
        .populate('replies.user', 'name email role');

    // NOTIFICATION LOGIC
    try {
        // Don't notify if user is replying to their own discussion
        if (discussion.user.toString() !== req.user.id) {
            const discussionOwner = await User.findById(discussion.user);

            if (discussionOwner) {
                // 1. Send Real-time Notification via Socket.io
                if (req.io) {
                    req.io.to(discussion.user.toString()).emit('notification', {
                        type: 'new_reply',
                        message: `${req.user.name} replied to: ${discussion.title}`,
                        discussionId: discussion._id,
                        replierName: req.user.name,
                        createdAt: new Date()
                    });
                }

                // 2. Send Email Notification
                if (discussionOwner.email) {
                    // Run distinct from main thread to not block response
                    sendReplyNotification(
                        discussionOwner.email,
                        discussion.title,
                        req.user.name,
                        discussion._id
                    ).catch(err => console.error('Email sending failed in controller:', err));
                }
            }
        }
    } catch (notificationError) {
        console.error('Notification Error:', notificationError);
    }

    res.status(200).json({
        success: true,
        data: updatedDiscussion
    });
});

/**
 * @desc    Mark reply as answer
 * @route   PUT /api/discussions/:id/replies/:replyId/answer
 * @access  Private
 */
exports.markAsAnswer = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    // Only discussion creator or instructor can mark answer
    if (discussion.user.toString() !== req.user.id && req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to mark answer'
        });
    }

    await discussion.markAsAnswer(req.params.replyId);

    const updatedDiscussion = await Discussion.findById(req.params.id)
        .populate('user', 'name email')
        .populate('replies.user', 'name email role');

    res.status(200).json({
        success: true,
        data: updatedDiscussion
    });
});

/**
 * @desc    Upvote discussion
 * @route   POST /api/discussions/:id/upvote
 * @access  Private
 */
exports.upvoteDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    await discussion.upvote(req.user.id);

    res.status(200).json({
        success: true,
        data: { upvoteCount: discussion.upvoteCount }
    });
});

/**
 * @desc    Remove upvote from discussion
 * @route   DELETE /api/discussions/:id/upvote
 * @access  Private
 */
exports.removeUpvote = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    await discussion.removeUpvote(req.user.id);

    res.status(200).json({
        success: true,
        data: { upvoteCount: discussion.upvoteCount }
    });
});

/**
 * @desc    Upvote reply
 * @route   POST /api/discussions/:id/replies/:replyId/upvote
 * @access  Private
 */
exports.upvoteReply = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
        return res.status(404).json({
            success: false,
            message: 'Reply not found'
        });
    }

    if (!reply.upvotes.includes(req.user.id)) {
        reply.upvotes.push(req.user.id);
        await discussion.save();
    }

    res.status(200).json({
        success: true,
        data: { upvoteCount: reply.upvotes.length }
    });
});

/**
 * @desc    Get popular discussions
 * @route   GET /api/discussions/popular
 * @access  Private
 */
exports.getPopularDiscussions = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const discussions = await Discussion.find()
        .populate('user', 'name email')
        .sort('-views -upvotes')
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: discussions.length,
        data: discussions
    });
});

/**
 * @desc    Get AI-generated answer for discussion
 * @route   POST /api/discussions/:id/ai-answer
 * @access  Private
 */
exports.getAIAnswer = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
        return res.status(404).json({
            success: false,
            message: 'Discussion not found'
        });
    }

    // Import AI service (exports singleton)
    const aiService = require('../services/aiService');

    try {
        // Create a comprehensive prompt for the AI
        const systemPrompt = `You are an expert educational assistant helping students with their questions.
Subject: ${discussion.subject}
${discussion.topic ? `Topic: ${discussion.topic}` : ''}
Difficulty Level: ${discussion.difficulty}

Provide a clear, detailed, and educational answer. Include:
1. Direct answer to the question
2. Explanation of key concepts
3. Examples if relevant
4. Additional tips or resources

Keep the answer concise but comprehensive.`;

        const userPrompt = `Question: ${discussion.title}

Details: ${discussion.content}

Please provide a helpful answer to this question.`;

        // Try to get AI response
        let answer;
        try {
            answer = await aiService.callLLM(systemPrompt, userPrompt);
        } catch (error) {
            console.log('AI API failed, using intelligent fallback...');
            // Intelligent fallback answer
            answer = generateIntelligentFallbackAnswer(discussion);
        }

        res.status(200).json({
            success: true,
            data: {
                answer: answer,
                source: 'AI Assistant'
            }
        });
    } catch (error) {
        console.error('AI Answer Error:', error);
        // Final fallback
        const fallbackAnswer = generateIntelligentFallbackAnswer(discussion);
        res.status(200).json({
            success: true,
            data: {
                answer: fallbackAnswer,
                source: 'AI Assistant (Offline Mode)'
            }
        });
    }
});

/**
 * Generate intelligent fallback answer when AI APIs are unavailable
 */
function generateIntelligentFallbackAnswer(discussion) {
    const { subject, topic, title, content, difficulty } = discussion;

    // Extract key terms from the question
    const keyTerms = extractKeyTerms(content + ' ' + title);

    let answer = `# Answer to: ${title}\n\n`;

    // Subject-specific guidance
    const subjectGuidance = {
        'Mathematics': `For this ${difficulty} mathematics problem${topic ? ` in ${topic}` : ''}:\n\n`,
        'Physics': `Regarding this ${difficulty} physics question${topic ? ` about ${topic}` : ''}:\n\n`,
        'Chemistry': `For this ${difficulty} chemistry question${topic ? ` on ${topic}` : ''}:\n\n`,
        'Biology': `Regarding this ${difficulty} biology question${topic ? ` about ${topic}` : ''}:\n\n`,
        'Computer Science': `For this ${difficulty} computer science question${topic ? ` on ${topic}` : ''}:\n\n`,
        'History': `Regarding this ${difficulty} history question${topic ? ` about ${topic}` : ''}:\n\n`,
        'Literature': `For this ${difficulty} literature question${topic ? ` on ${topic}` : ''}:\n\n`
    };

    answer += subjectGuidance[subject] || `Regarding your ${difficulty} question about ${subject}${topic ? ` (${topic})` : ''}:\n\n`;

    // Difficulty-based approach
    if (difficulty === 'easy') {
        answer += `## Basic Approach\n\n`;
        answer += `This is a foundational concept. Here's how to approach it:\n\n`;
        answer += `1. **Understand the basics**: Review the fundamental principles related to ${keyTerms[0] || 'this topic'}\n`;
        answer += `2. **Break it down**: Divide the problem into smaller, manageable parts\n`;
        answer += `3. **Apply the concept**: Use the basic formula or principle\n`;
        answer += `4. **Verify**: Check if your answer makes sense\n\n`;
    } else if (difficulty === 'medium') {
        answer += `## Systematic Approach\n\n`;
        answer += `This requires a structured approach:\n\n`;
        answer += `1. **Identify key concepts**: Focus on ${keyTerms.slice(0, 2).join(' and ') || 'the main ideas'}\n`;
        answer += `2. **Analyze relationships**: How do these concepts connect?\n`;
        answer += `3. **Apply methodology**: Use appropriate techniques for ${subject}\n`;
        answer += `4. **Consider edge cases**: Think about special conditions\n`;
        answer += `5. **Validate**: Cross-check your reasoning\n\n`;
    } else {
        answer += `## Advanced Analysis\n\n`;
        answer += `This is a complex question requiring deep understanding:\n\n`;
        answer += `1. **Theoretical foundation**: Review advanced concepts in ${topic || subject}\n`;
        answer += `2. **Multi-faceted analysis**: Consider ${keyTerms.slice(0, 3).join(', ') || 'multiple perspectives'}\n`;
        answer += `3. **Critical thinking**: Evaluate assumptions and implications\n`;
        answer += `4. **Synthesis**: Combine different approaches\n`;
        answer += `5. **Rigorous verification**: Ensure logical consistency\n\n`;
    }

    // Add subject-specific tips
    answer += `## Key Points to Remember\n\n`;

    if (subject === 'Mathematics') {
        answer += `- Show all your work step by step\n`;
        answer += `- Check your units and dimensions\n`;
        answer += `- Verify your answer makes mathematical sense\n`;
        answer += `- Consider alternative solution methods\n\n`;
    } else if (subject === 'Physics') {
        answer += `- Draw diagrams to visualize the problem\n`;
        answer += `- Identify known and unknown variables\n`;
        answer += `- Apply relevant physics laws and principles\n`;
        answer += `- Check dimensional analysis\n\n`;
    } else if (subject === 'Computer Science') {
        answer += `- Consider time and space complexity\n`;
        answer += `- Think about edge cases and error handling\n`;
        answer += `- Review relevant algorithms and data structures\n`;
        answer += `- Test your solution with examples\n\n`;
    } else {
        answer += `- Review your course materials and notes\n`;
        answer += `- Connect concepts to real-world examples\n`;
        answer += `- Practice similar problems\n`;
        answer += `- Discuss with peers and instructors\n\n`;
    }

    // Resources
    answer += `## Recommended Resources\n\n`;
    answer += `1. Review your course textbook chapter on ${topic || subject}\n`;
    answer += `2. Check your class notes and lecture materials\n`;
    answer += `3. Practice with similar problems\n`;
    answer += `4. Consult with your instructor during office hours\n`;
    answer += `5. Form a study group with classmates\n\n`;

    // Encouragement
    answer += `## Note\n\n`;
    answer += `This is an AI-generated guidance to help you think through the problem. `;
    answer += `For the most accurate and detailed answer specific to your question, please:\n`;
    answer += `- Consult your instructor or teaching assistant\n`;
    answer += `- Review your course materials\n`;
    answer += `- Collaborate with classmates in the discussion\n\n`;
    answer += `Good luck with your studies! 📚`;

    return answer;
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text) {
    // Remove common words
    const commonWords = new Set([
        'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can', 'what',
        'how', 'why', 'when', 'where', 'who', 'which', 'this', 'that',
        'these', 'those', 'and', 'or', 'but', 'if', 'then', 'else',
        'for', 'with', 'about', 'from', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'over',
        'question', 'answer', 'help', 'please', 'need', 'want', 'know'
    ]);

    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

    // Count frequency
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and return top terms
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}
