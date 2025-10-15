const express = require('express');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getGuides,
  getGuideById,
  createGuide,
  updateGuide,
  updateGuideProfile,
  deleteGuide,
  getGuideStats
} = require('../controllers/guideController');

const { generateGuidePDFReport } = require('../controllers/guide/reportController');

const router = express.Router();

// @desc    Get all guides
// @route   GET /api/guides
// @access  Public
router.get('/', asyncHandler(getGuides));

// @desc    Get guide by ID
// @route   GET /api/guides/:id
// @access  Public
router.get('/:id', asyncHandler(getGuideById));

// @desc    Create new guide
// @route   POST /api/guides
// @access  Private (Admin only)
router.post('/', protect, asyncHandler(createGuide));

// @desc    Update guide profile
// @route   PUT /api/guides/profile
// @access  Private (Guide only)
router.put('/profile', protect, asyncHandler(updateGuideProfile));

// @desc    Update guide
// @route   PUT /api/guides/:id
// @access  Private (Guide owner or Admin)
router.put('/:id', protect, asyncHandler(updateGuide));

// @desc    Delete guide
// @route   DELETE /api/guides/:id
// @access  Private (Admin only)
router.delete('/:id', protect, asyncHandler(deleteGuide));

// @desc    Get guide statistics
// @route   GET /api/guides/stats/:id
// @access  Public
router.get('/stats/:id', asyncHandler(getGuideStats));

// Report generation routes
// @desc    Generate PDF report for guide
// @route   POST /api/guides/reports/generate
// @access  Private (Guide only)
router.post('/reports/generate', protect, asyncHandler(generateGuidePDFReport));

module.exports = router;
