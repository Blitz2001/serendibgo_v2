const express = require('express');
const router = express.Router();
const { generateStaffPDFReport } = require('../../controllers/staff/reportController');
const { staffAuth } = require('../../middleware/staffAuth');
const { asyncHandler } = require('../../middleware/errorHandler');

// Report generation routes
// @desc    Generate PDF report for staff
// @route   POST /api/staff/reports/generate
// @access  Private (Staff only)
router.post('/generate', staffAuth, asyncHandler(generateStaffPDFReport));

module.exports = router;
