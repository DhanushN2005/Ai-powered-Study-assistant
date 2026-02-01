const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const {
  createMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  summarizeMaterial,
  generateFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  shareMaterial
} = require('../controllers/materialsController');

router.route('/')
  .get(protect, getMaterials)
  .post(protect, uploadSingle, handleUploadError, createMaterial);

router.get('/flashcards/due', protect, getDueFlashcards);

router.route('/:id')
  .get(protect, getMaterial)
  .put(protect, updateMaterial)
  .delete(protect, deleteMaterial);

router.post('/:id/summarize', protect, summarizeMaterial);
router.post('/:id/flashcards', protect, generateFlashcards);
router.put('/:id/flashcards/:index', protect, reviewFlashcard);
router.post('/:id/share', protect, shareMaterial);

module.exports = router;
