const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

// Import controllers
const { 
  getDashboardStats, 
  getPlatformAnalytics,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  createUser
} = require('../controllers/admin/adminController');
const {
  getStaff,
  getStaffStats,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus
} = require('../controllers/admin/staffController');
const {
  getPermissionTemplates,
  createPermissionTemplate,
  updatePermissionTemplate,
  deletePermissionTemplate,
  getStaffPermissions,
  updateStaffPermissions,
  applyPermissionTemplate
} = require('../controllers/admin/permissionController');
const {
  getSettings,
  updatePlatformSettings,
  updateEmailSettings,
  updatePaymentSettings,
  updateSystemSettings,
  resetSettings
} = require('../controllers/admin/settingsController');
const {
  generatePDFReport
} = require('../controllers/admin/reportController');
const {
  getRecentUsers,
  getUnverifiedUsers,
  getRecentBookings,
  getRecentHotels,
  getPendingHotels
} = require('../controllers/admin/dashboardController');

// Import vehicle admin controller
const {
  getAdminVehicles,
  getVehicleStats,
  getPendingVehicles,
  bulkUpdateVehicleStatus,
  getVehicleHistory,
  exportVehicles
} = require('../controllers/admin/vehicleController');

// Import admin review controller
const {
  getAllReviews,
  getReviewStatistics,
  updateReviewStatus,
  deleteReview,
  exportReviewsToPDF
} = require('../controllers/admin/adminReviewController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.get('/dashboard/stats', asyncHandler(getDashboardStats));
router.get('/analytics', asyncHandler(getPlatformAnalytics));

// Dashboard data routes - specific routes before parameterized routes
router.get('/users/recent', asyncHandler(getRecentUsers));
router.get('/users/unverified', asyncHandler(getUnverifiedUsers));
router.get('/bookings/recent', asyncHandler(getRecentBookings));
router.get('/hotels/recent', asyncHandler(getRecentHotels));
router.get('/hotels/pending', asyncHandler(getPendingHotels));

// User management routes - specific routes first
router.get('/users', asyncHandler(getAllUsers));
router.post('/users', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['tourist', 'driver', 'guide', 'hotel_owner', 'staff', 'admin']).withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(createUser));
router.get('/users/:id', asyncHandler(getUserById));
router.put('/users/:id/role', [
  body('role')
    .isIn(['tourist', 'driver', 'guide', 'hotel_owner', 'staff', 'admin'])
    .withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(updateUserRole));
router.put('/users/:id/status', [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
], asyncHandler(toggleUserStatus));

// Staff management routes
router.get('/staff', asyncHandler(getStaff));
router.get('/staff/stats', asyncHandler(getStaffStats));
router.get('/staff/:id', asyncHandler(getStaffMember));

router.post('/staff', [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number')
], handleValidationErrors, asyncHandler(createStaff));

router.put('/staff/:id', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number')
], handleValidationErrors, asyncHandler(updateStaff));

router.delete('/staff/:id', asyncHandler(deleteStaff));
router.patch('/staff/:id/toggle-status', asyncHandler(toggleStaffStatus));

// Permission management routes
router.get('/permissions/templates', asyncHandler(getPermissionTemplates));
router.post('/permissions/templates', asyncHandler(createPermissionTemplate));
router.put('/permissions/templates/:id', asyncHandler(updatePermissionTemplate));
router.delete('/permissions/templates/:id', asyncHandler(deletePermissionTemplate));
router.get('/permissions/staff', asyncHandler(getStaffPermissions));
router.put('/permissions/staff/:id', asyncHandler(updateStaffPermissions));
router.post('/permissions/apply-template', asyncHandler(applyPermissionTemplate));

// Vehicle management routes
router.get('/vehicles', asyncHandler(getAdminVehicles));
router.get('/vehicles/stats', asyncHandler(getVehicleStats));
router.get('/vehicles/pending', asyncHandler(getPendingVehicles));
router.put('/vehicles/bulk-status', [
  body('vehicleIds').isArray().withMessage('Vehicle IDs must be an array'),
  body('status').isIn(['pending', 'approved', 'active', 'suspended', 'rejected', 'maintenance'])
    .withMessage('Invalid status'),
  handleValidationErrors
], asyncHandler(bulkUpdateVehicleStatus));
router.get('/vehicles/:id/history', asyncHandler(getVehicleHistory));
router.get('/vehicles/export', asyncHandler(exportVehicles));

// Settings management routes
router.get('/settings', asyncHandler(getSettings));
router.put('/settings/platform', asyncHandler(updatePlatformSettings));
router.put('/settings/email', asyncHandler(updateEmailSettings));
router.put('/settings/payment', asyncHandler(updatePaymentSettings));
router.put('/settings/system', asyncHandler(updateSystemSettings));
router.post('/settings/reset', asyncHandler(resetSettings));

// Report generation routes
router.post('/reports/generate', asyncHandler(generatePDFReport));

// Review management routes
router.get('/reviews', asyncHandler(getAllReviews));
router.get('/reviews/stats', asyncHandler(getReviewStatistics));
router.put('/reviews/:reviewId/status', asyncHandler(updateReviewStatus));
router.delete('/reviews/:reviewId', asyncHandler(deleteReview));
router.post('/reviews/export', asyncHandler(exportReviewsToPDF));

module.exports = router;

