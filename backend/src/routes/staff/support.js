// Staff Support & Quality Control Routes
const express = require('express');
const router = express.Router();
const { 
  getSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  addSupportMessage,
  resolveSupportTicket,
  getReviews,
  getReviewStatistics,
  deleteReview,
  bulkReviewAction,
  moderateReview
} = require('../../controllers/staff/supportController');
const { staffAuth, requirePermission } = require('../../middleware/staffAuth');

// Apply staff authentication middleware to all routes
router.use(staffAuth);

// Support ticket routes
router.get('/tickets', getSupportTickets);
router.get('/tickets/:id', getSupportTicket);
router.put('/tickets/:id', updateSupportTicket);
router.post('/tickets/:id/messages', addSupportMessage);
router.post('/tickets/:id/resolve', resolveSupportTicket);

// Review moderation routes
router.get('/reviews', getReviews);
router.get('/reviews/statistics', getReviewStatistics);
router.delete('/reviews/:id', deleteReview);
router.post('/reviews/bulk-action', bulkReviewAction);
router.put('/reviews/:id/moderate', moderateReview);

module.exports = router;
