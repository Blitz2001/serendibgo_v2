const express = require('express');
const router = express.Router();
const {
  createReview,
  getGuideReviews,
  getTourReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getUserReviews,
  getGuideReviewStats,
  checkUserReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/guide/:guideId', getGuideReviews);
router.get('/guide/:guideId/stats', getGuideReviewStats);
router.get('/tour/:tourId', getTourReviews);

// Protected routes
router.use(protect); // Apply auth middleware to all routes below

router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markReviewHelpful);
router.get('/user/:userId', getUserReviews);
router.get('/check', checkUserReview);

module.exports = router;

