const CustomTrip = require('../models/CustomTrip');
const User = require('../models/User');
const Hotel = require('../models/hotels/Hotel');
const Booking = require('../models/Booking');
const { sendEmail } = require('../services/emailService');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Create a new custom trip request
// @route   POST /api/custom-trips
// @access  Public
const createCustomTrip = async (req, res) => {
  try {
    const {
      destination,
      destinations,
      startDate,
      endDate,
      groupSize,
      budget,
      interests,
      accommodation,
      transport,
      activities,
      specialRequests,
      dietaryRequirements,
      accessibility,
      contactInfo
    } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Use authenticated user (since route is now protected)
    let customer;
    console.log('=== USER AUTHENTICATION CHECK ===');
    console.log('req.user:', req.user ? 'Authenticated user' : 'No user');
    console.log('req.user._id:', req.user?._id);
    console.log('req.user.email:', req.user?.email);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    if (req.user) {
      customer = req.user._id;
      console.log('Using authenticated user:', customer);
      console.log('User email:', req.user.email);
    } else {
      // This shouldn't happen since route is protected, but handle gracefully
      console.log('ERROR: No authenticated user found on protected route');
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create custom trip'
      });
    }

    const customTrip = new CustomTrip({
      customer,
      customerName: contactInfo.name,
      customerEmail: contactInfo.email,
      customerPhone: contactInfo.phone,
      requestDetails: {
        destination,
        destinations: destinations || [],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        groupSize: parseInt(groupSize) || 1,
        budget,
        interests: interests || [],
        accommodation: accommodation || 'mid-range',
        transport: transport || [],
        activities: activities || [],
        specialRequests,
        dietaryRequirements,
        accessibility,
        contactInfo
      },
      status: 'pending'
    });

    await customTrip.save();
    
    console.log('=== CUSTOM TRIP CREATED ===');
    console.log('Trip ID:', customTrip._id);
    console.log('Customer ID:', customTrip.customer);
    console.log('Customer email:', contactInfo.email);

    // Send notification email to staff (optional - don't fail if email fails)
    try {
      await sendEmail({
        to: process.env.STAFF_EMAIL || 'staff@serendibgo.com',
        subject: 'New Custom Trip Request',
        html: `
          <h2>New Custom Trip Request</h2>
          <p><strong>Customer:</strong> ${contactInfo.name}</p>
          <p><strong>Email:</strong> ${contactInfo.email}</p>
          <p><strong>Phone:</strong> ${contactInfo.phone}</p>
          <p><strong>Destination:</strong> ${destination}</p>
          <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Group Size:</strong> ${groupSize}</p>
          <p><strong>Budget:</strong> LKR ${budget}</p>
          <p><strong>Interests:</strong> ${interests?.join(', ') || 'None specified'}</p>
          <p><strong>Special Requests:</strong> ${specialRequests || 'None'}</p>
          <p>Please review and assign appropriate resources.</p>
        `
      });
    } catch (emailError) {
      console.warn('Failed to send notification email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Custom trip request submitted successfully',
      data: customTrip
    });

  } catch (error) {
    console.error('=== CUSTOM TRIP CREATION ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    res.status(500).json({
      success: false,
      message: 'Error creating custom trip request',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all custom trips (for staff)
// @route   GET /api/custom-trips
// @access  Private (Staff/Admin)
const getAllCustomTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customTrips = await CustomTrip.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('staffAssignment.assignedGuide', 'firstName lastName email phone profile.pricePerDay')
      .populate('staffAssignment.hotelBookings.hotel', 'name location.city starRating')
      .populate('approvalDetails.approvedBy', 'firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomTrip.countDocuments(query);

    res.json({
      success: true,
      data: customTrips,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching custom trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom trips',
      error: error.message
    });
  }
};

// @desc    Get custom trip by ID
// @route   GET /api/custom-trips/:id
// @access  Private
const getCustomTripById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    const customTrip = await CustomTrip.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('staffAssignment.assignedGuide', 'firstName lastName email phone profile.pricePerDay profile.languages profile.specialties')
      .populate('staffAssignment.hotelBookings.hotel', 'name location starRating amenities')
      .populate('staffAssignment.assignedVehicles.vehicleId')
      .populate('staffAssignment.assignedVehicles.driver', 'firstName lastName phone')
      .populate('approvalDetails.approvedBy', 'firstName lastName')
      .populate('staffAssignment.assignedBy', 'firstName lastName');

    if (!customTrip) {
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    // Check if user has access to this custom trip
    if (req.user.role !== 'staff' && req.user.role !== 'admin' && 
        customTrip.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: customTrip
    });

  } catch (error) {
    console.error('Error fetching custom trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom trip',
      error: error.message
    });
  }
};

// @desc    Update custom trip (staff assignment)
// @route   PUT /api/custom-trips/:id
// @access  Private (Staff/Admin)
const updateCustomTrip = async (req, res) => {
  try {
    console.log('=== UPDATE CUSTOM TRIP REQUEST ===');
    console.log('Trip ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user._id : 'No user');
    
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      console.log('ERROR: Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }
    
    const {
      assignedGuide,
      assignedVehicles,
      hotelBookings,
      totalBudget,
      itinerary,
      additionalNotes,
      status
    } = req.body;

    console.log('Extracted fields:', {
      assignedGuide: assignedGuide ? 'Present' : 'Missing',
      assignedVehicles: assignedVehicles ? `Array with ${assignedVehicles.length} items` : 'Missing',
      hotelBookings: hotelBookings ? `Array with ${hotelBookings.length} items` : 'Missing',
      totalBudget: totalBudget ? 'Present' : 'Missing',
      itinerary: itinerary ? 'Present' : 'Missing',
      additionalNotes: additionalNotes ? 'Present' : 'Missing',
      status: status || 'Not provided'
    });
    
    console.log('Full request body keys:', Object.keys(req.body));
    console.log('Status value:', status);

    const customTrip = await CustomTrip.findById(req.params.id);
    if (!customTrip) {
      console.log('ERROR: Custom trip not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    console.log('Found custom trip:', {
      id: customTrip._id,
      status: customTrip.status,
      hasStaffAssignment: !!customTrip.staffAssignment,
      hasRequestDetails: !!customTrip.requestDetails
    });

    // Initialize staffAssignment if it doesn't exist
    if (!customTrip.staffAssignment) {
      customTrip.staffAssignment = {
        assignedGuide: null,
        assignedVehicles: [],
        hotelBookings: [],
        totalBudget: {
          guideFees: 0,
          vehicleCosts: 0,
          hotelCosts: 0,
          activityCosts: 0,
          additionalFees: 0,
          totalAmount: 0
        },
        itinerary: [],
        additionalNotes: '',
        assignedBy: null,
        assignedAt: null
      };
    }

    // Update staff assignment
    if (assignedGuide) {
      customTrip.staffAssignment.assignedGuide = assignedGuide;
    }

    if (assignedVehicles) {
      customTrip.staffAssignment.assignedVehicles = assignedVehicles;
    }

    if (hotelBookings) {
      customTrip.staffAssignment.hotelBookings = hotelBookings;
    }

    if (totalBudget) {
      customTrip.staffAssignment.totalBudget = {
        ...customTrip.staffAssignment.totalBudget,
        ...totalBudget
      };
    }

    if (itinerary) {
      customTrip.staffAssignment.itinerary = itinerary;
    }

    if (additionalNotes) {
      customTrip.staffAssignment.additionalNotes = additionalNotes;
    }

    // Only update status if explicitly provided and not 'approved' (use approve endpoint for that)
    if (status && status !== 'approved') {
      console.log('Updating status to:', status);
      customTrip.status = status;
    } else {
      console.log('Not updating status. Status provided:', status, 'Current status:', customTrip.status);
    }

    customTrip.staffAssignment.assignedBy = req.user._id;
    customTrip.staffAssignment.assignedAt = new Date();

    // Calculate total budget
    customTrip.calculateTotalBudget();

    console.log('Saving custom trip with updated staffAssignment:', JSON.stringify(customTrip.staffAssignment, null, 2));
    console.log('Final status before save:', customTrip.status);
    
    try {
      await customTrip.save();
      console.log('Custom trip saved successfully. Final status:', customTrip.status);
    } catch (saveError) {
      console.error('Error saving custom trip:', saveError);
      console.error('Save error details:', {
        name: saveError.name,
        message: saveError.message,
        errors: saveError.errors
      });
      throw saveError;
    }

    // Send notification to customer
    if (status === 'approved') {
      await sendEmail({
        to: customTrip.requestDetails.contactInfo.email,
        subject: 'Your Custom Trip Has Been Approved!',
        html: `
          <h2>Great News! Your Custom Trip Has Been Approved</h2>
          <p>Dear ${customTrip.requestDetails.contactInfo.name},</p>
          <p>We're excited to inform you that your custom trip request has been approved!</p>
          <p><strong>Trip Details:</strong></p>
          <ul>
            <li>Destination: ${customTrip.requestDetails.destination}</li>
            <li>Dates: ${customTrip.requestDetails.startDate.toDateString()} to ${customTrip.requestDetails.endDate.toDateString()}</li>
            <li>Group Size: ${customTrip.requestDetails.groupSize}</li>
            <li>Total Cost: $${customTrip.staffAssignment.totalBudget.totalAmount}</li>
          </ul>
          <p>Please log in to your account to view the complete itinerary and proceed with payment.</p>
          <p>Best regards,<br>Serendib GO Team</p>
        `
      });
    }

    res.json({
      success: true,
      message: 'Custom trip updated successfully',
      data: customTrip
    });
    
    console.log('=== UPDATE CUSTOM TRIP COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('=== UPDATE CUSTOM TRIP ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating custom trip',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Approve custom trip
// @route   POST /api/custom-trips/:id/approve
// @access  Private (Staff/Admin)
const approveCustomTrip = async (req, res) => {
  try {
    console.log('=== APPROVE CUSTOM TRIP REQUEST ===');
    console.log('Trip ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user._id : 'No user');
    
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      console.log('ERROR: Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    const { staffComments } = req.body;

    const customTrip = await CustomTrip.findById(req.params.id);
    if (!customTrip) {
      console.log('ERROR: Custom trip not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    console.log('Found custom trip:', {
      id: customTrip._id,
      status: customTrip.status,
      canBeApproved: customTrip.canBeApproved(),
      hasStaffAssignment: !!customTrip.staffAssignment,
      hasAssignedGuide: !!customTrip.staffAssignment?.assignedGuide
    });

    // If trip is already approved, return success without changing anything
    if (customTrip.status === 'approved') {
      console.log('Trip is already approved, returning success');
      return res.json({
        success: true,
        message: 'Custom trip is already approved',
        data: customTrip
      });
    }

    if (!customTrip.canBeApproved()) {
      console.log('ERROR: Cannot approve trip in current status:', customTrip.status);
      return res.status(400).json({
        success: false,
        message: 'Custom trip cannot be approved in current status'
      });
    }

    // Validate required assignments - make guide assignment optional for now
    // if (!customTrip.staffAssignment.assignedGuide) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Guide must be assigned before approval'
    //   });
    // }

    customTrip.status = 'approved';
    customTrip.approvalDetails.approvedBy = req.user._id;
    customTrip.approvalDetails.approvedAt = new Date();
    customTrip.approvalDetails.staffComments = staffComments;

    await customTrip.save();

    // Send approval notification to customer (optional - don't fail if email fails)
    try {
      const totalAmount = customTrip.staffAssignment?.totalBudget?.totalAmount || 'TBD';
      await sendEmail({
        to: customTrip.requestDetails.contactInfo.email,
        subject: 'Your Custom Trip Has Been Approved!',
        html: `
          <h2>Great News! Your Custom Trip Has Been Approved</h2>
          <p>Dear ${customTrip.requestDetails.contactInfo.name},</p>
          <p>We're excited to inform you that your custom trip request has been approved!</p>
          <p><strong>Trip Details:</strong></p>
          <ul>
            <li>Destination: ${customTrip.requestDetails.destination}</li>
            <li>Dates: ${customTrip.requestDetails.startDate.toDateString()} to ${customTrip.requestDetails.endDate.toDateString()}</li>
            <li>Group Size: ${customTrip.requestDetails.groupSize}</li>
            <li>Total Cost: LKR ${totalAmount}</li>
          </ul>
          <p><strong>Staff Comments:</strong> ${staffComments || 'No additional comments'}</p>
          <p>Please log in to your account to view the complete itinerary and proceed with payment.</p>
          <p>Best regards,<br>Serendib GO Team</p>
        `
      });
      console.log('Approval email sent successfully');
    } catch (emailError) {
      console.warn('Failed to send approval email:', emailError.message);
      // Don't fail the approval if email fails
    }

    res.json({
      success: true,
      message: 'Custom trip approved successfully',
      data: customTrip
    });

    console.log('=== APPROVE CUSTOM TRIP COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('=== APPROVE CUSTOM TRIP ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error approving custom trip',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Reject custom trip
// @route   POST /api/custom-trips/:id/reject
// @access  Private (Staff/Admin)
const rejectCustomTrip = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const customTrip = await CustomTrip.findById(req.params.id);
    if (!customTrip) {
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    if (!customTrip.canBeApproved()) {
      return res.status(400).json({
        success: false,
        message: 'Custom trip cannot be rejected in current status'
      });
    }

    customTrip.status = 'rejected';
    customTrip.approvalDetails.rejectionReason = rejectionReason;

    await customTrip.save();

    // Send rejection notification to customer
    await sendEmail({
      to: customTrip.requestDetails.contactInfo.email,
      subject: 'Custom Trip Request Update',
      html: `
        <h2>Custom Trip Request Update</h2>
        <p>Dear ${customTrip.requestDetails.contactInfo.name},</p>
        <p>We regret to inform you that your custom trip request could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>We encourage you to submit a new request with different parameters or contact our support team for assistance.</p>
        <p>Best regards,<br>Serendib GO Team</p>
      `
    });

    res.json({
      success: true,
      message: 'Custom trip rejected',
      data: customTrip
    });

  } catch (error) {
    console.error('Error rejecting custom trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting custom trip',
      error: error.message
    });
  }
};

// @desc    Create booking for custom trip (prepare for payment)
// @route   POST /api/custom-trips/:id/confirm
// @access  Private
const confirmCustomTrip = async (req, res) => {
  try {
    console.log('=== CONFIRM CUSTOM TRIP DEBUG ===');
    console.log('Trip ID:', req.params.id);
    console.log('User ID:', req.user?._id);
    
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    const customTrip = await CustomTrip.findById(req.params.id);
    if (!customTrip) {
      console.log('Custom trip not found');
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    console.log('Custom trip found:', {
      id: customTrip._id,
      status: customTrip.status,
      paymentStatus: customTrip.paymentStatus,
      customer: customTrip.customer
    });

    // Check if user owns this custom trip
    if (customTrip.customer.toString() !== req.user._id.toString()) {
      console.log('Access denied - user does not own this trip');
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('Checking if trip can be confirmed...');
    console.log('canBeConfirmed result:', customTrip.canBeConfirmed());
    
    if (!customTrip.canBeConfirmed()) {
      console.log('Trip cannot be confirmed in current status');
      return res.status(400).json({
        success: false,
        message: 'Custom trip cannot be confirmed in current status'
      });
    }

    // Create booking record with pending payment status
    const booking = new Booking({
      user: customTrip.customer,
      tour: null, // Custom trip doesn't have a predefined tour
      customTrip: customTrip._id, // Link to custom trip
      guide: customTrip.staffAssignment.assignedGuide,
      bookingDate: new Date(),
      startDate: customTrip.requestDetails.startDate,
      endDate: customTrip.requestDetails.endDate,
      duration: 'multi-day',
      groupSize: customTrip.requestDetails.groupSize,
      totalAmount: customTrip.staffAssignment.totalBudget.totalAmount,
      status: 'pending', // Will be confirmed after payment
      paymentStatus: 'pending', // Will be updated after payment
      specialRequests: customTrip.requestDetails.specialRequests,
      bookingReference: `CT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      isActive: true
    });

    await booking.save();

    // Update custom trip with booking reference
    customTrip.booking = booking._id;
    await customTrip.save();

    res.json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      data: {
        booking: booking,
        customTrip: customTrip
      }
    });

  } catch (error) {
    console.error('Error creating custom trip booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking for custom trip',
      error: error.message
    });
  }
};

// @desc    Get user's custom trips
// @route   GET /api/custom-trips/user/my-trips
// @access  Private
const getUserCustomTrips = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const customTrips = await CustomTrip.find(query)
      .populate('staffAssignment.assignedGuide', 'firstName lastName email phone')
      .populate('staffAssignment.hotelBookings.hotel', 'name location.city starRating')
      .populate('booking', 'status paymentStatus')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customTrips
    });

  } catch (error) {
    console.error('Error fetching user custom trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom trips',
      error: error.message
    });
  }
};

// @desc    Delete custom trip
// @route   DELETE /api/custom-trips/:id
// @access  Private (Staff/Admin) or Owner
const deleteCustomTrip = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    const customTrip = await CustomTrip.findById(req.params.id);
    if (!customTrip) {
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    // Check permissions
    const isOwner = customTrip.customer.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'staff' || req.user.role === 'admin';

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow deletion if trip is not confirmed or completed
    if (['confirmed', 'completed'].includes(customTrip.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete confirmed or completed trips'
      });
    }

    await CustomTrip.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Custom trip deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting custom trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting custom trip',
      error: error.message
    });
  }
};

// @desc    Create a new custom trip booking (confirmed booking)
// @route   POST /api/custom-trips/book
// @access  Private
const createCustomTripBooking = async (req, res) => {
  try {
    const {
      destination,
      destinations,
      startDate,
      endDate,
      groupSize,
      budget,
      interests,
      accommodation,
      transport,
      activities,
      specialRequests,
      dietaryRequirements,
      accessibility,
      contactInfo,
      paymentStatus = 'paid',
      status = 'confirmed'
    } = req.body;

    const userId = req.user._id;

    console.log('Creating custom trip booking for user:', userId);

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Calculate duration
    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    // Create the custom trip booking
    const customTrip = await CustomTrip.create({
      customer: userId,
      customerName: req.user.firstName + ' ' + req.user.lastName,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      requestDetails: {
        destination: destination || 'Multiple Cities',
        destinations: destinations || [destination],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: duration,
        groupSize: groupSize || 2,
        budget: budget || 'mid-range',
        budgetAmount: budget === 'budget' ? 30000 : budget === 'luxury' ? 100000 : 50000,
        interests: interests || ['culture', 'nature'],
        activities: activities || [],
        accommodation: accommodation || 'mid-range',
        transport: transport || ['private-car'],
        specialRequests: specialRequests || '',
        dietaryRequirements: dietaryRequirements || '',
        accessibility: accessibility || '',
        contactInfo: {
          name: req.user.firstName + ' ' + req.user.lastName,
          email: req.user.email,
          phone: req.user.phone || ''
        }
      },
      title: `Custom Trip to ${destination || 'Sri Lanka'}`,
      description: `Personalized ${duration}-day adventure across ${destination || 'Sri Lanka'}`,
      status: status,
      paymentStatus: paymentStatus,
      approvalDetails: {
        status: 'auto-approved',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: 'Automatically approved booking'
      }
    });

    // Create a linked booking record
    const booking = await Booking.create({
      user: userId,
      customTrip: customTrip._id,
      bookingDate: new Date(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: 'multi-day',
      groupSize: groupSize || 2,
      totalAmount: customTrip.requestDetails.budgetAmount,
      status: status,
      paymentStatus: paymentStatus,
      specialRequests: specialRequests || ''
    });

    // Update custom trip with booking reference
    customTrip.booking = booking._id;
    await customTrip.save();

    // Populate the response
    await customTrip.populate('customer', 'firstName lastName email phone');

    console.log('Custom trip booking created successfully:', customTrip._id);

    res.status(201).json({
      success: true,
      message: 'Custom trip booking created successfully',
      data: {
        customTrip: customTrip,
        booking: booking
      }
    });

  } catch (error) {
    console.error('Error creating custom trip booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom trip booking',
      error: error.message
    });
  }
};

module.exports = {
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
};
