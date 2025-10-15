const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  createGuestPaymentIntent,
  confirmPayment,
  confirmGuestPayment,
  handleWebhook,
  getPaymentStatus,
  processRefund
} = require('../controllers/paymentController');

// Webhook endpoint (no auth required - Stripe webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-intent', protect, createPaymentIntent);
// Guest payment route (for unauthenticated users)
router.post('/create-guest-intent', createGuestPaymentIntent);
router.post('/confirm', protect, confirmPayment);
// Guest confirmation route (for unauthenticated users)
router.post('/confirm-guest', confirmGuestPayment);
router.get('/status/:bookingId', protect, getPaymentStatus);
router.post('/refund/:bookingId', protect, processRefund);

module.exports = router;

