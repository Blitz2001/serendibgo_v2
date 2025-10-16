// Staff Routes - Main Index
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const userManagementRoutes = require('./userManagement');
const approvalRoutes = require('./approvals');
const bookingRoutes = require('./bookings');
const tripRoutes = require('./trips');
const customTripRoutes = require('./customTrips');
const hotelRoutes = require('./hotels');
const guideRoutes = require('./guides');
const financialRoutes = require('./financial');
const supportRoutes = require('./support');
const analyticsRoutes = require('./analytics');
const reportRoutes = require('./reports');
const vehicleRoutes = require('./vehicles');

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userManagementRoutes);
router.use('/approvals', approvalRoutes);
router.use('/bookings', bookingRoutes);
router.use('/trips', tripRoutes);
router.use('/custom-trips', customTripRoutes);
router.use('/hotels', hotelRoutes);
router.use('/guides', guideRoutes);
router.use('/financial', financialRoutes);
router.use('/support', supportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/vehicles', vehicleRoutes);

module.exports = router;
