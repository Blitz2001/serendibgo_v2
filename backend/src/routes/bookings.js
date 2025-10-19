const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getGuideBookings,
  createGuideBooking,
  createGuestGuideBooking,
  downloadBookingPDF,
  sendConfirmationEmail
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
// @route   POST /api/bookings/guide/guest
// @desc    Create guide booking for guests (without authentication)
// @access  Public
router.post('/guide/guest', createGuestGuideBooking);

// Apply authentication middleware to all other routes
router.use(protect);

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', createBooking);

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', getUserBookings);

// @route   GET /api/bookings/user
// @desc    Get all user bookings (both regular tours and custom trips)
// @access  Private
router.get('/user', getUserBookings);

// @route   POST /api/bookings/guide
// @desc    Create guide booking (direct guide booking without tour)
// @access  Private
router.post('/guide', createGuideBooking);

// @route   GET /api/bookings/guide
// @desc    Get guide bookings
// @access  Private (Guide)
router.get('/guide', getGuideBookings);

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', getBookingById);

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', updateBookingStatus);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', cancelBooking);

// @route   GET /api/bookings/:id/download-pdf
// @desc    Download booking confirmation PDF
// @access  Private
router.get('/:id/download-pdf', downloadBookingPDF);

// @route   POST /api/bookings/:id/send-confirmation-email
// @desc    Send booking confirmation email
// @access  Private
router.post('/:id/send-confirmation-email', sendConfirmationEmail);

module.exports = router;