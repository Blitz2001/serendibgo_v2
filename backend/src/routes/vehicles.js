const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  checkVehicleAvailability,
  getVehiclesNearLocation,
  uploadVehicleImages,
  deleteVehicleImage
} = require('../controllers/vehicleController');

const {
  registerVehicle,
  getDriverVehicles
} = require('../controllers/vehicles/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { vehicleImageUpload } = require('../utils/fileUpload');

// Configure multer for file uploads (memory storage for backward compatibility)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Public routes
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/:id/check-availability', checkVehicleAvailability);
router.get('/near/:lat/:lng', getVehiclesNearLocation);

// Vehicle registration route (protected)
router.post('/register', [
  protect,
  authorize('driver'),
  upload.fields([
    { name: 'registration', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'fitness', maxCount: 1 },
    { name: 'revenue', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  body('make').notEmpty().withMessage('Vehicle make is required'),
  body('model').notEmpty().withMessage('Vehicle model is required'),
  body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year').toInt(),
  body('licensePlate').notEmpty().withMessage('License plate is required'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('seatingCapacity').isInt({ min: 1, max: 50 }).withMessage('Invalid seating capacity').toInt(),
  handleValidationErrors
], registerVehicle);

// Protected routes
router.use(protect);

// Driver/Staff/Admin routes
router.post('/', [
  authorize('driver', 'staff', 'admin'),
  upload.fields([
    { name: 'images', maxCount: 10 }
  ])
], createVehicle);
router.put('/:id', authorize('driver', 'staff', 'admin'), updateVehicle);
router.delete('/:id', authorize('driver', 'staff', 'admin'), deleteVehicle);
router.get('/driver/:driverId', getDriverVehicles);

// Image routes
router.post('/:id/images', [
  protect,
  authorize('driver', 'staff', 'admin'),
  vehicleImageUpload.array('images', 10)
], uploadVehicleImages);

router.delete('/:id/images/:imageId', [
  protect,
  authorize('driver', 'staff', 'admin')
], deleteVehicleImage);

module.exports = router;
