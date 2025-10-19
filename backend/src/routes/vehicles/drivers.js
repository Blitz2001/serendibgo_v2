const express = require('express');
const router = express.Router();
const {
  registerDriver,
  getDrivers,
  getAvailableDrivers,
  getDriver,
  getDriverByUserId,
  updateDriverProfileByUserId,
  updateDriverStatus,
  updateDriverLocation,
  updateDriverProfile,
  assignDriverToTrip,
  getDriverTrips,
  getDriverStats,
  verifyDriverDocuments
} = require('../../controllers/vehicles/driverController');
const { generateDriverPDFReport } = require('../../controllers/vehicles/driverReportController');
const { protect, authorize } = require('../../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/errorHandler');

// @desc    Register a new driver
// @route   POST /api/drivers/register
// @access  Private
router.post('/register', [
  protect,
  body('personalInfo.dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('personalInfo.gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('personalInfo.nationality').notEmpty().withMessage('Nationality is required'),
  body('personalInfo.emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('personalInfo.emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required'),
  body('personalInfo.emergencyContact.phone').notEmpty().withMessage('Emergency contact phone is required'),
  body('license.licenseNumber').notEmpty().withMessage('License number is required'),
  body('license.licenseType').isIn(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L']).withMessage('Invalid license type'),
  body('license.issueDate').isISO8601().withMessage('Invalid license issue date'),
  body('license.expiryDate').isISO8601().withMessage('Invalid license expiry date'),
  body('license.issuingAuthority').notEmpty().withMessage('Issuing authority is required'),
  body('license.licenseClass').isIn(['Light Vehicle', 'Heavy Vehicle', 'Motorcycle', 'Bus', 'Truck']).withMessage('Invalid license class'),
  body('vehicleTypes').isArray().withMessage('Vehicle types must be an array'),
  body('serviceAreas').isArray().withMessage('Service areas must be an array'),
  body('financial.baseRate').isFloat({ min: 0 }).withMessage('Base rate must be a positive number'),
  handleValidationErrors
], registerDriver);

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin, Vehicle Owner)
router.get('/', [
  protect,
  authorize('admin', 'vehicle_owner'),
  query('status').optional().isIn(['pending', 'active', 'suspended', 'inactive', 'blacklisted']).withMessage('Invalid status'),
  query('city').optional().isString().withMessage('City must be a string'),
  query('district').optional().isString().withMessage('District must be a string'),
  query('vehicleType').optional().isString().withMessage('Vehicle type must be a string'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], getDrivers);

// @desc    Get available drivers
// @route   GET /api/drivers/available
// @access  Private
router.get('/available', [
  protect,
  query('city').optional().isString().withMessage('City must be a string'),
  query('district').optional().isString().withMessage('District must be a string'),
  query('vehicleType').optional().isString().withMessage('Vehicle type must be a string'),
  query('startTime').optional().isISO8601().withMessage('Invalid start time'),
  query('endTime').optional().isISO8601().withMessage('Invalid end time'),
  query('maxDistance').optional().isInt({ min: 1 }).withMessage('Max distance must be a positive integer'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  handleValidationErrors
], getAvailableDrivers);

// @desc    Get driver statistics
// @route   GET /api/drivers/stats
// @access  Private (Admin, Driver)
router.get('/stats', [
  protect,
  authorize('admin', 'driver'),
  query('period').optional().isIn(['week', 'month', 'year']).withMessage('Invalid period'),
  handleValidationErrors
], getDriverStats);

// @desc    Update driver profile by user ID
// @route   PUT /api/drivers/user/:userId/profile
// @access  Private
router.put('/user/:userId/profile', [
  protect,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
], updateDriverProfileByUserId);

// @desc    Get driver by user ID
// @route   GET /api/drivers/user/:userId
// @access  Private
router.get('/user/:userId', [
  protect,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
], getDriverByUserId);

// @desc    Get a specific driver
// @route   GET /api/drivers/:driverId
// @access  Private
router.get('/:driverId', [
  protect,
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  handleValidationErrors
], getDriver);

// @desc    Update driver status
// @route   PATCH /api/drivers/:driverId/status
// @access  Private (Admin)
router.patch('/:driverId/status', [
  protect,
  authorize('admin', 'staff'),
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  body('status').isIn(['pending', 'active', 'suspended', 'inactive', 'blacklisted']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  handleValidationErrors
], updateDriverStatus);

// @desc    Update driver location
// @route   PATCH /api/drivers/:driverId/location
// @access  Private (Driver)
router.patch('/:driverId/location', [
  protect,
  authorize('driver'),
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  body('latitude').isFloat().withMessage('Latitude must be a number'),
  body('longitude').isFloat().withMessage('Longitude must be a number'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('isOnline').optional().isBoolean().withMessage('isOnline must be a boolean'),
  handleValidationErrors
], updateDriverLocation);

// @desc    Update driver profile
// @route   PATCH /api/drivers/:driverId/profile
// @access  Private (Driver)
router.patch('/:driverId/profile', [
  protect,
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  body('personalInfo.dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('personalInfo.gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('personalInfo.nationality').optional().isString().withMessage('Nationality must be a string'),
  body('financial.baseRate').optional().isFloat({ min: 0 }).withMessage('Base rate must be a positive number'),
  body('preferences.maxTripDistance').optional().isInt({ min: 1 }).withMessage('Max trip distance must be a positive integer'),
  body('preferences.maxTripDuration').optional().isInt({ min: 1 }).withMessage('Max trip duration must be a positive integer'),
  handleValidationErrors
], updateDriverProfile);

// @desc    Assign driver to trip
// @route   POST /api/drivers/:driverId/assign-trip
// @access  Private (Vehicle Owner, Admin)
router.post('/:driverId/assign-trip', [
  protect,
  authorize('vehicle_owner', 'admin'),
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  body('tripId').isMongoId().withMessage('Invalid trip ID'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  handleValidationErrors
], assignDriverToTrip);

// @desc    Get driver trips
// @route   GET /api/drivers/:driverId/trips
// @access  Private
router.get('/:driverId/trips', [
  protect,
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'delayed', 'no_show']).withMessage('Invalid status'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date from'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date to'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], getDriverTrips);

// @desc    Verify driver documents
// @route   PATCH /api/drivers/:driverId/verify
// @access  Private (Admin)
router.patch('/:driverId/verify', [
  protect,
  authorize('admin'),
  param('driverId').isMongoId().withMessage('Invalid driver ID'),
  body('verificationType').isIn(['identityVerified', 'licenseVerified', 'backgroundCheckPassed', 'insuranceVerified', 'vehicleVerified']).withMessage('Invalid verification type'),
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  handleValidationErrors
], verifyDriverDocuments);

// Report generation routes
// @desc    Generate PDF report for driver
// @route   POST /api/drivers/reports/generate
// @access  Private (Driver only)
router.post('/reports/generate', [
  protect,
  authorize('driver'),
  body('reportType').optional().isIn(['overview', 'trips', 'earnings', 'performance', 'reviews', 'vehicles']).withMessage('Invalid report type'),
  body('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  handleValidationErrors
], generateDriverPDFReport);

module.exports = router;
