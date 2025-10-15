const express = require('express');
const router = express.Router();
const {
  createHotelReview,
  getHotelReviews,
  getUserHotelReviews,
  updateHotelReview,
  deleteHotelReview,
  markReviewHelpful,
  canUserReviewHotel
} = require('../../controllers/hotels/hotelReviewController');
const { protect } = require('../../middleware/auth');

// Public routes
router.get('/hotel/:hotelId', getHotelReviews);

// Protected routes
router.use(protect);

router.post('/', createHotelReview);
router.get('/user/:userId', getUserHotelReviews);
router.put('/:reviewId', updateHotelReview);
router.delete('/:reviewId', deleteHotelReview);
router.post('/:reviewId/helpful', markReviewHelpful);
router.get('/can-review/:hotelId', canUserReviewHotel);

module.exports = router;
