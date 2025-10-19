// Staff Vehicle Management Routes
const express = require('express');
const router = express.Router();
const { 
  getStaffVehicles,
  getVehicleDetails,
  updateVehicleStatus,
  approveVehicle,
  rejectVehicle,
  getVehicleStatistics
} = require('../../controllers/staff/vehicleController');
const { staffAuth, requirePermission } = require('../../middleware/staffAuth');

// Apply staff authentication middleware to all routes
router.use(staffAuth);

// Vehicle management routes
router.get('/', getStaffVehicles);
router.get('/statistics', getVehicleStatistics);
router.get('/:id', getVehicleDetails);
router.put('/:id/status', updateVehicleStatus);
router.post('/:id/approve', approveVehicle);
router.post('/:id/reject', rejectVehicle);

module.exports = router;

