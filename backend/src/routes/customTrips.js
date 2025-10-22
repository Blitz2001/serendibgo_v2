const express = require('express');
const router = express.Router();
const {
  createCustomTrip,
  getAllCustomTrips,
  getCustomTripById,
  updateCustomTrip,
  approveCustomTrip,
  rejectCustomTrip,
  confirmCustomTrip,
  getUserCustomTrips,
  deleteCustomTrip,
  createCustomTripBooking
} = require('../controllers/customTripController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.use(protect);

// User routes
router.post('/', createCustomTrip);
router.post('/book', createCustomTripBooking);

// User routes
router.get('/user/my-trips', getUserCustomTrips);
router.get('/:id', getCustomTripById);
router.post('/:id/confirm', confirmCustomTrip);

// Staff/Admin routes
router.get('/', authorize('staff', 'admin'), getAllCustomTrips);
router.put('/:id', authorize('staff', 'admin'), updateCustomTrip);
router.post('/:id/approve', authorize('staff', 'admin'), approveCustomTrip);
router.post('/:id/reject', authorize('staff', 'admin'), rejectCustomTrip);
router.delete('/:id', deleteCustomTrip);

module.exports = router;
