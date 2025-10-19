const Vehicle = require('../../models/Vehicle');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all vehicles for staff management
// @route   GET /api/staff/vehicles
// @access  Private (Staff)
const getStaffVehicles = asyncHandler(async (req, res) => {
  try {
    const { 
      status = 'all',
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { make: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { licensePlate: new RegExp(search, 'i') }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await Vehicle.find(query)
      .populate('owner', 'firstName lastName email phone role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
});

// @desc    Get vehicle details for staff
// @route   GET /api/staff/vehicles/:id
// @access  Private (Staff)
const getVehicleDetails = asyncHandler(async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone role')
      .populate('driver', 'firstName lastName email phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle details',
      error: error.message
    });
  }
});

// @desc    Update vehicle status (approve/reject)
// @route   PUT /api/staff/vehicles/:id/status
// @access  Private (Staff)
const updateVehicleStatus = asyncHandler(async (req, res) => {
  try {
    const { action, reason } = req.body;
    const vehicleId = req.params.id;

    if (!action || !['approve', 'reject', 'suspend', 'activate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, suspend, or activate'
      });
    }

    // Require reason for rejection
    if (action === 'reject' && (!reason || reason.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle status based on action
    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'available';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
      case 'activate':
        newStatus = 'available';
        break;
    }

    // Update vehicle
    vehicle.status = newStatus;
    
    // Update approval details based on action
    if (action === 'approve') {
      vehicle.approvalDetails.approvedAt = new Date();
      vehicle.approvalDetails.approvedBy = req.user.id;
      vehicle.approvalDetails.needsApproval = false;
    } else if (action === 'reject') {
      vehicle.approvalDetails.rejectedAt = new Date();
      vehicle.approvalDetails.rejectedBy = req.user.id;
      vehicle.approvalDetails.rejectionReason = reason;
      vehicle.approvalDetails.needsApproval = false;
    }

    await vehicle.save();

    // Populate owner details for response
    await vehicle.populate('owner', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: `Vehicle ${action}d successfully`,
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle status',
      error: error.message
    });
  }
});

// @desc    Approve vehicle
// @route   POST /api/staff/vehicles/:id/approve
// @access  Private (Staff)
const approveVehicle = asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;
    const vehicleId = req.params.id;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle status
    vehicle.status = 'available';
    vehicle.approvalDetails.approvedAt = new Date();
    vehicle.approvalDetails.approvedBy = req.user.id;
    vehicle.approvalDetails.needsApproval = false;

    await vehicle.save();

    // Populate owner details for response
    await vehicle.populate('owner', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Vehicle approved successfully',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error approving vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving vehicle',
      error: error.message
    });
  }
});

// @desc    Reject vehicle
// @route   POST /api/staff/vehicles/:id/reject
// @access  Private (Staff)
const rejectVehicle = asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;
    const vehicleId = req.params.id;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle status
    vehicle.status = 'rejected';
    vehicle.approvalDetails.rejectedAt = new Date();
    vehicle.approvalDetails.rejectedBy = req.user.id;
    vehicle.approvalDetails.rejectionReason = reason.trim();
    vehicle.approvalDetails.needsApproval = false;

    await vehicle.save();

    // Populate owner details for response
    await vehicle.populate('owner', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Vehicle rejected successfully',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error rejecting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting vehicle',
      error: error.message
    });
  }
});

// @desc    Get vehicle statistics for staff dashboard
// @route   GET /api/staff/vehicles/statistics
// @access  Private (Staff)
const getVehicleStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVehicles = await Vehicle.countDocuments();
    const pendingVehicles = await Vehicle.countDocuments({ status: 'pending' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'available' });
    const rejectedVehicles = await Vehicle.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        total: totalVehicles,
        pending: pendingVehicles,
        available: availableVehicles,
        rejected: rejectedVehicles,
        breakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle statistics',
      error: error.message
    });
  }
});

module.exports = {
  getStaffVehicles,
  getVehicleDetails,
  updateVehicleStatus,
  approveVehicle,
  rejectVehicle,
  getVehicleStatistics
};
