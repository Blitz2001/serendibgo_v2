const express = require('express');
const router = express.Router();
const {
  createCustomTripReview,
  getCustomTripReviews,
  getUserCustomTripReviews,
  updateCustomTripReview,
  deleteCustomTripReview,
  canReviewCustomTrip
} = require('../controllers/customTripReviewController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
// @route   GET /api/custom-trip-reviews/:customTripId
// @desc    Get reviews for a specific custom trip
// @access  Public
router.get('/:customTripId', getCustomTripReviews);

// Apply authentication middleware to all other routes
router.use(protect);

// @route   POST /api/custom-trip-reviews
// @desc    Create a new custom trip review
// @access  Private
router.post('/', createCustomTripReview);

// @route   GET /api/custom-trip-reviews/user
// @desc    Get user's custom trip reviews
// @access  Private
router.get('/user', getUserCustomTripReviews);

// @route   GET /api/custom-trip-reviews/:customTripId/can-review
// @desc    Check if user can review a custom trip
// @access  Private
router.get('/:customTripId/can-review', canReviewCustomTrip);

// @route   PUT /api/custom-trip-reviews/:reviewId
// @desc    Update a custom trip review
// @access  Private
router.put('/:reviewId', updateCustomTripReview);

// @route   DELETE /api/custom-trip-reviews/:reviewId
// @desc    Delete a custom trip review
// @access  Private
router.delete('/:reviewId', deleteCustomTripReview);

module.exports = router;
