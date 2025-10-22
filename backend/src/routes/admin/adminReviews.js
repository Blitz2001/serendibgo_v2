const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewStatistics,
  updateReviewStatus,
  deleteReview,
  exportReviewsToPDF
} = require('../../controllers/admin/adminReviewController');
const { protect } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/admin/reviews
// @desc    Get all reviews for admin dashboard
// @access  Private (Admin only)
router.get('/', getAllReviews);

// @route   GET /api/admin/reviews/stats
// @desc    Get review statistics for admin dashboard
// @access  Private (Admin only)
router.get('/stats', getReviewStatistics);

// @route   PUT /api/admin/reviews/:reviewId/status
// @desc    Update review status (approve/reject/activate/deactivate)
// @access  Private (Admin only)
router.put('/:reviewId/status', updateReviewStatus);

// @route   DELETE /api/admin/reviews/:reviewId
// @desc    Delete review (admin only)
// @access  Private (Admin only)
router.delete('/:reviewId', deleteReview);

// @route   POST /api/admin/reviews/export
// @desc    Export reviews to PDF
// @access  Private (Admin only)
router.post('/export', exportReviewsToPDF);

module.exports = router;
