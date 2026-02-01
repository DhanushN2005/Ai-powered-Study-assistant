const Material = require('../models/Material');
const Progress = require('../models/Progress');
const { asyncHandler } = require('../middleware/error');
const fileProcessor = require('../services/fileProcessor');
const aiService = require('../services/aiService');

/**
 * @desc    Upload and create new study material
 * @route   POST /api/materials
 * @access  Private
 */
exports.createMaterial = asyncHandler(async (req, res) => {
  const { title, subject, topic, difficulty, tags } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Extract text from file
  const { content, metadata } = await fileProcessor.processFile(
    req.file.path,
    req.file.mimetype
  );

  // Create material
  const material = await Material.create({
    user: req.user.id,
    title: title || req.file.originalname,
    subject,
    topic,
    difficulty: difficulty || 'intermediate',
    type: req.file.mimetype.includes('pdf') ? 'pdf' :
      req.file.mimetype.includes('text') ? 'text' : 'image',
    filePath: req.file.path,
    content: content,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    metadata: {
      ...metadata,
      fileSize: req.file.size
    }
  });

  res.status(201).json({
    success: true,
    data: material
  });
});

/**
 * @desc    Get all materials for logged in user
 * @route   GET /api/materials
 * @access  Private
 */
exports.getMaterials = asyncHandler(async (req, res) => {
  const { subject, topic, tags, search } = req.query;

  /* 
     Update query to include:
     1. Materials created by the user (req.user.id)
     OR
     2. Materials assigned to the user (req.user.id in assignedTo array)
  */

  // Base filters
  const query = {};
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (tags) query.tags = { $in: tags.split(',') };

  // Ownership condition (My materials OR Assigned to me)
  const ownershipCondition = {
    $or: [
      { user: req.user.id },
      { assignedTo: req.user.id }
    ]
  };

  // If search exists, combine with ownership using $and
  if (search) {
    query.$and = [
      ownershipCondition,
      {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  } else {
    // If no search, just merge ownership condition
    Object.assign(query, ownershipCondition);
  }

  const materials = await Material.find(query)
    .sort({ createdAt: -1 })
    .select('-content'); // Don't send full content in list

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

/**
 * @desc    Get single material by ID
 * @route   GET /api/materials/:id
 * @access  Private
 */
exports.getMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Check ownership or assignment
  const isOwner = material.user.toString() === req.user.id;
  const isAssigned = material.assignedTo && material.assignedTo.includes(req.user.id);
  const isShared = material.shared;

  if (!isOwner && !isAssigned && !isShared) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this material'
    });
  }

  res.status(200).json({
    success: true,
    data: material
  });
});

/**
 * @desc    Update material
 * @route   PUT /api/materials/:id
 * @access  Private
 */
exports.updateMaterial = asyncHandler(async (req, res) => {
  let material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Check ownership
  if (material.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this material'
    });
  }

  const allowedUpdates = ['title', 'subject', 'topic', 'difficulty', 'tags', 'summary'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  material = await Material.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: material
  });
});

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private
 */
exports.deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Check ownership
  if (material.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this material'
    });
  }

  // Delete file from filesystem
  if (material.filePath) {
    await fileProcessor.deleteFile(material.filePath);
  }

  await material.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Generate AI summary for material
 * @route   POST /api/materials/:id/summarize
 * @access  Private
 */
exports.summarizeMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Check ownership or assignment
  const isOwner = material.user.toString() === req.user.id;
  const isAssigned = material.assignedTo && material.assignedTo.includes(req.user.id);

  if (!isOwner && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const { length = 'medium', focus = 'key-concepts' } = req.body;

  // Generate summary using AI
  const summary = await aiService.summarizeContent(material.content, {
    length,
    focus
  });

  // Save summary
  material.summary = summary;
  await material.save();

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

/**
 * @desc    Generate flashcards from material
 * @route   POST /api/materials/:id/flashcards
 * @access  Private
 */
exports.generateFlashcards = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Check ownership or assignment
  const isOwner = material.user.toString() === req.user.id;
  const isAssigned = material.assignedTo && material.assignedTo.includes(req.user.id);

  if (!isOwner && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const { count = 10 } = req.body;

  // Generate flashcards using AI
  const flashcards = await aiService.generateFlashcards(material.content, count);

  // Add to material with spaced repetition data
  const flashcardsWithData = flashcards.map(card => ({
    ...card,
    nextReview: new Date(),
    repetitions: 0,
    easeFactor: 2.5
  }));

  material.flashcards.push(...flashcardsWithData);
  await material.save();

  res.status(200).json({
    success: true,
    data: {
      flashcards: flashcardsWithData
    }
  });
});

/**
 * @desc    Get due flashcards for review
 * @route   GET /api/materials/flashcards/due
 * @access  Private
 */
exports.getDueFlashcards = asyncHandler(async (req, res) => {
  const materials = await Material.find({
    user: req.user.id,
    'flashcards.0': { $exists: true }
  });

  const now = new Date();
  const dueFlashcards = [];

  materials.forEach(material => {
    material.flashcards.forEach((card, index) => {
      if (!card.nextReview || card.nextReview <= now) {
        dueFlashcards.push({
          materialId: material._id,
          materialTitle: material.title,
          subject: material.subject,
          topic: material.topic,
          flashcardIndex: index,
          ...card.toObject()
        });
      }
    });
  });

  res.status(200).json({
    success: true,
    count: dueFlashcards.length,
    data: dueFlashcards
  });
});

/**
 * @desc    Update flashcard after review
 * @route   PUT /api/materials/:id/flashcards/:index
 * @access  Private
 */
exports.reviewFlashcard = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  if (material.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const index = parseInt(req.params.index);
  const { quality } = req.body; // 0-5 rating

  if (quality < 0 || quality > 5) {
    return res.status(400).json({
      success: false,
      message: 'Quality must be between 0 and 5'
    });
  }

  const flashcard = material.flashcards[index];
  if (!flashcard) {
    return res.status(404).json({
      success: false,
      message: 'Flashcard not found'
    });
  }

  // Calculate next review using SM-2 algorithm
  const schedulerService = require('../services/schedulerService');
  const nextReview = schedulerService.calculateNextReview(
    quality,
    flashcard.repetitions,
    flashcard.interval || 1,
    flashcard.easeFactor
  );

  flashcard.nextReview = nextReview.nextReview;
  flashcard.repetitions = nextReview.repetitions;
  flashcard.easeFactor = nextReview.easeFactor;

  await material.save();

  // Record progress
  await Progress.recordProgress(req.user.id, material.subject, material.topic, {
    flashcardsReviewed: 1
  });

  res.status(200).json({
    success: true,
    data: {
      nextReview: nextReview.nextReview,
      interval: nextReview.interval
    }
  });
});

/**
 * @desc    Share material with other users
 * @route   POST /api/materials/:id/share
 * @access  Private
 */
exports.shareMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  if (material.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  material.shared = true;
  await material.save();

  res.status(200).json({
    success: true,
    data: material
  });
});
