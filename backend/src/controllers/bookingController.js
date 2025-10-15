const Booking = require('../models/Booking');
const CustomTrip = require('../models/CustomTrip');
const Tour = require('../models/Tour');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all user bookings (both regular tours and custom trips)
// @route   GET /api/bookings/user
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    console.log('=== GET USER BOOKINGS ===');
    console.log('User ID:', req.user?._id);
    console.log('User email:', req.user?.email);
    
    const { status, type, page = 1, limit = 10 } = req.query;

    // Build query for regular bookings
    const bookingQuery = { user: req.user._id };
    if (status) {
      bookingQuery.status = status;
    }

    // Get regular tour bookings
    const regularBookings = await Booking.find(bookingQuery)
      .populate('tour', 'title description images duration price location')
      .populate('guide', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get custom trip bookings
    const customTripQuery = { customer: req.user._id };
    if (status) {
      customTripQuery.status = status;
    }

    const customTrips = await CustomTrip.find(customTripQuery)
      .populate('staffAssignment.assignedGuide', 'firstName lastName email phone')
      .populate('staffAssignment.hotelBookings.hotel', 'name location.city starRating amenities')
      .populate('staffAssignment.assignedVehicles.vehicleId', 'type model capacity')
      .populate('staffAssignment.assignedVehicles.driver', 'firstName lastName phone')
      .populate('approvalDetails.approvedBy', 'firstName lastName')
      .populate('booking', 'status paymentStatus')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Found custom trips:', customTrips.length);
    console.log('Custom trip query:', customTripQuery);
    
    // Debug: Log populated data for first custom trip
    if (customTrips.length > 0) {
      console.log('=== FIRST CUSTOM TRIP POPULATED DATA ===');
      console.log('Trip ID:', customTrips[0]._id);
      console.log('Staff Assignment:', customTrips[0].staffAssignment);
      console.log('Hotel Bookings:', customTrips[0].staffAssignment?.hotelBookings);
      console.log('Assigned Vehicles:', customTrips[0].staffAssignment?.assignedVehicles);
      if (customTrips[0].staffAssignment?.hotelBookings?.length > 0) {
        console.log('First Hotel Booking:', customTrips[0].staffAssignment.hotelBookings[0]);
        console.log('Hotel Data:', customTrips[0].staffAssignment.hotelBookings[0].hotel);
      }
      if (customTrips[0].staffAssignment?.assignedVehicles?.length > 0) {
        console.log('First Vehicle:', customTrips[0].staffAssignment.assignedVehicles[0]);
        console.log('Vehicle Data:', customTrips[0].staffAssignment.assignedVehicles[0].vehicleId);
      }
    }
    
    // Debug: Check all custom trips in database
    const allCustomTrips = await CustomTrip.find({}).populate('customer', 'email firstName lastName');
    console.log('=== ALL CUSTOM TRIPS IN DATABASE ===');
    allCustomTrips.forEach((trip, index) => {
      console.log(`Trip ${index + 1}:`, {
        id: trip._id,
        customer: trip.customer?.email || 'No customer',
        customerId: trip.customer?._id || 'No customer ID',
        status: trip.status,
        destination: trip.requestDetails?.destination
      });
    });

    // Transform data to unified format
    const allBookings = [];

    // Add regular tour bookings (exclude guide bookings)
    regularBookings.forEach(booking => {
      if (booking.tour || (!booking.guide)) {
        allBookings.push({
          id: booking._id,
          type: 'tour',
          title: booking.tour?.title || 'Tour Booking',
          description: booking.tour?.description || '',
          images: booking.tour?.images || [],
          startDate: booking.startDate,
          endDate: booking.endDate,
          duration: booking.duration,
          groupSize: booking.groupSize,
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          guide: booking.guide,
          location: booking.tour?.location?.name || 'Sri Lanka',
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt,
          bookingDate: booking.bookingDate
        });
      }
    });

    // Add custom trip bookings
    customTrips.forEach(trip => {
      allBookings.push({
        id: trip._id,
        type: 'custom',
        title: `Custom Trip to ${trip.requestDetails.destination}`,
        description: `Personalized ${trip.requestDetails.destination} adventure`,
        images: [], // Custom trips don't have predefined images
        startDate: trip.requestDetails.startDate,
        endDate: trip.requestDetails.endDate,
        duration: 'multi-day',
        groupSize: trip.requestDetails.groupSize,
        totalAmount: trip.staffAssignment?.totalBudget?.totalAmount || trip.requestDetails.budget,
        status: trip.status,
        paymentStatus: trip.paymentStatus,
        guide: trip.staffAssignment?.assignedGuide,
        location: trip.requestDetails.destination,
        specialRequests: trip.requestDetails.specialRequests,
        createdAt: trip.createdAt,
        bookingDate: trip.createdAt,
        hotels: trip.staffAssignment?.hotelBookings || [],
        // Include the complete trip data for detailed view
        requestDetails: trip.requestDetails,
        staffAssignment: trip.staffAssignment,
        approvalDetails: trip.approvalDetails,
        customTripDetails: {
          interests: trip.requestDetails.interests,
          accommodation: trip.requestDetails.accommodation,
          transport: trip.requestDetails.transport,
          activities: trip.requestDetails.activities
        }
      });
    });

    // Add guide bookings (direct guide bookings without tour)
    regularBookings.forEach(booking => {
      if (booking.guide && !booking.tour && !booking.customTrip) {
        allBookings.push({
          id: booking._id,
          type: 'guide',
          title: `Guide Service with ${booking.guide?.firstName} ${booking.guide?.lastName}`,
          description: 'Personal Guide Service',
          images: [],
          startDate: booking.startDate,
          endDate: booking.endDate,
          duration: booking.duration,
          groupSize: booking.groupSize,
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          guide: booking.guide,
          location: 'Sri Lanka',
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt,
          bookingDate: booking.bookingDate,
          bookingReference: booking.bookingReference
        });
      }
    });

    // Sort all bookings by creation date
    allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply type filter if specified
    const filteredBookings = type ? allBookings.filter(booking => booking.type === type) : allBookings;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(filteredBookings.length / limit),
          total: filteredBookings.length,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get single booking by ID (supports both regular and custom trips)
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find regular booking first
    let booking = await Booking.findById(id)
      .populate('tour', 'title description images duration price location itinerary')
      .populate('guide', 'firstName lastName email phone profile.pricePerDay profile.specialties')
      .populate('user', 'firstName lastName email phone');

    if (booking) {
      // Check if user owns this booking
      if (booking.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        data: {
          id: booking._id,
          type: 'tour',
          title: booking.tour?.title || 'Tour Booking',
          description: booking.tour?.description || '',
          images: booking.tour?.images || [],
          startDate: booking.startDate,
          endDate: booking.endDate,
          duration: booking.duration,
          groupSize: booking.groupSize,
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          guide: booking.guide,
          location: booking.tour?.location?.name || 'Sri Lanka',
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt,
          bookingDate: booking.bookingDate,
          tour: booking.tour
        }
      });
    }

    // Try to find custom trip
    const customTrip = await CustomTrip.findById(id)
      .populate('staffAssignment.assignedGuide', 'firstName lastName email phone profile.pricePerDay profile.specialties')
      .populate('staffAssignment.hotelBookings.hotel', 'name location starRating amenities')
      .populate('customer', 'firstName lastName email phone');

    if (customTrip) {
      // Check if user owns this custom trip
      if (customTrip.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        data: {
          id: customTrip._id,
          type: 'custom',
          title: `Custom Trip to ${customTrip.requestDetails.destination}`,
          description: `Personalized ${customTrip.requestDetails.destination} adventure`,
          images: [],
          startDate: customTrip.requestDetails.startDate,
          endDate: customTrip.requestDetails.endDate,
          duration: 'multi-day',
          groupSize: customTrip.requestDetails.groupSize,
          totalAmount: customTrip.staffAssignment?.totalBudget?.totalAmount || customTrip.requestDetails.budget,
          status: customTrip.status,
          paymentStatus: customTrip.paymentStatus,
          guide: customTrip.staffAssignment?.assignedGuide,
          location: customTrip.requestDetails.destination,
          specialRequests: customTrip.requestDetails.specialRequests,
          createdAt: customTrip.createdAt,
          bookingDate: customTrip.createdAt,
          hotels: customTrip.staffAssignment?.hotelBookings || [],
          customTripDetails: {
            interests: customTrip.requestDetails.interests,
            accommodation: customTrip.requestDetails.accommodation,
            transport: customTrip.requestDetails.transport,
            activities: customTrip.requestDetails.activities,
            dietaryRequirements: customTrip.requestDetails.dietaryRequirements,
            accessibility: customTrip.requestDetails.accessibility
          },
          staffAssignment: customTrip.staffAssignment,
          itinerary: customTrip.staffAssignment?.itinerary || []
        }
      });
    }

    // Booking not found
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Cancel a booking (supports both regular and custom trips)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Try to find regular booking first
    let booking = await Booking.findById(id);

    if (booking) {
      // Check if user owns this booking OR if user is the guide for this booking
      const isOwner = booking.user.toString() === req.user._id.toString();
      const isGuide = booking.guide && booking.guide.toString() === req.user._id.toString();
      
      if (!isOwner && !isGuide) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if booking can be cancelled
      if (['cancelled', 'completed'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Booking cannot be cancelled in current status'
        });
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.cancellationReason = cancellationReason;
      booking.paymentStatus = 'refunded';
      booking.refundAmount = booking.totalAmount;

      await booking.save();

      // Create notification for the guide (if not the one cancelling)
      if (booking.guide && booking.guide.toString() !== req.user._id.toString()) {
        try {
          await createNotification({
            user: booking.guide,
            type: 'cancellation',
            title: 'Booking Cancelled',
            message: `${req.user.firstName} ${req.user.lastName} cancelled their booking for ${booking.duration} starting ${booking.startDate.toLocaleDateString()}`,
            priority: 'medium',
            booking: booking._id,
            tourist: req.user._id,
            actionUrl: `/guide/dashboard?tab=bookings`,
            actionText: 'View Details',
            metadata: {
              bookingId: booking._id,
              cancellationReason: cancellationReason,
              cancelledBy: req.user._id
            }
          });
        } catch (notificationError) {
          console.error('Error creating cancellation notification:', notificationError);
        }
      }

      // Create notification for the tourist (if not the one cancelling)
      if (booking.user.toString() !== req.user._id.toString()) {
        try {
          await createNotification({
            user: booking.user,
            type: 'cancellation',
            title: 'Booking Cancelled',
            message: `Your booking for ${booking.duration} starting ${booking.startDate.toLocaleDateString()} has been cancelled`,
            priority: 'medium',
            booking: booking._id,
            guide: booking.guide,
            actionUrl: `/bookings`,
            actionText: 'View Details',
            metadata: {
              bookingId: booking._id,
              cancellationReason: cancellationReason,
              cancelledBy: req.user._id
            }
          });
        } catch (notificationError) {
          console.error('Error creating cancellation notification:', notificationError);
        }
      }

      return res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking
      });
    }

    // Try to find custom trip
    const customTrip = await CustomTrip.findById(id);

    if (customTrip) {
      // Check if user owns this custom trip
      if (customTrip.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if custom trip can be cancelled
      if (['cancelled', 'completed'].includes(customTrip.status)) {
        return res.status(400).json({
          success: false,
          message: 'Custom trip cannot be cancelled in current status'
        });
      }

      // Update custom trip status
      customTrip.status = 'cancelled';
      customTrip.paymentStatus = 'refunded';

      await customTrip.save();

      // If there's a linked booking, cancel it too
      if (customTrip.booking) {
        const linkedBooking = await Booking.findById(customTrip.booking);
        if (linkedBooking) {
          linkedBooking.status = 'cancelled';
          linkedBooking.cancellationReason = cancellationReason;
          linkedBooking.paymentStatus = 'refunded';
          linkedBooking.refundAmount = linkedBooking.totalAmount;
          await linkedBooking.save();
        }
      }

      return res.json({
        success: true,
        message: 'Custom trip cancelled successfully',
        data: customTrip
      });
    }

    // Booking not found
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { tourId, startDate, endDate, groupSize, specialRequests } = req.body;

    // Validate required fields
    if (!tourId || !startDate || !endDate || !groupSize) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tourId, startDate, endDate, groupSize'
      });
    }

    // Get tour details
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Calculate duration and total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = tour.price * groupSize * duration;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      tour: tourId,
      startDate: start,
      endDate: end,
      duration,
      groupSize,
      totalAmount,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();

    // Populate the booking with tour and user details
    await booking.populate('tour', 'title description images duration price location');
    await booking.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin/guide
    if (booking.user.toString() !== req.user._id.toString() && 
        !['admin', 'guide', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update booking
    booking.status = status;
    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// @desc    Get guide bookings
// @route   GET /api/bookings/guide
// @access  Private (Guide)
const getGuideBookings = async (req, res) => {
  try {
    console.log('🔍 Backend getGuideBookings called:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      query: req.query
    });

    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { guide: req.user._id };
    if (status) {
      query.status = status;
    }

    console.log('📊 Backend - Query built:', query);

    // Get bookings
    const bookings = await Booking.find(query)
      .populate('tour', 'title description images duration price location')
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('📋 Backend - Bookings found:', bookings.length);

    // Get total count
    const total = await Booking.countDocuments(query);

    console.log('📊 Backend - Total bookings:', total);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Backend - Error fetching guide bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching guide bookings',
      error: error.message
    });
  }
};

// @desc    Create guide booking (direct guide booking without tour)
// @route   POST /api/bookings/guide
// @access  Private
const createGuideBooking = async (req, res) => {
  try {
    const { guideId, startDate, endDate, duration, groupSize, specialRequests } = req.body;

    console.log('🎯 Creating guide booking:', { guideId, startDate, endDate, duration, groupSize, specialRequests });

    // Validate required fields
    if (!guideId || !startDate || !endDate || !duration || !groupSize) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: guideId, startDate, endDate, duration, groupSize'
      });
    }

    // Check if guide exists (skip validation if MongoDB not connected)
    try {
      const guide = await User.findById(guideId);
      if (!guide || guide.role !== 'guide') {
        return res.status(404).json({
          success: false,
          message: 'Guide not found'
        });
      }
    } catch (dbError) {
      console.warn('⚠️ MongoDB not connected, skipping guide validation:', dbError.message);
      // Continue without validation - this is a temporary workaround
    }

    // Calculate total amount (you can adjust pricing logic)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Base price per person per day (you can make this configurable)
    const basePricePerPersonPerDay = 50; // $50 per person per day
    const totalAmount = basePricePerPersonPerDay * groupSize * daysDiff;

    // Generate unique booking reference
    const bookingReference = `GB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      guide: guideId,
      bookingDate: new Date(),
      startDate: start,
      endDate: end,
      duration,
      groupSize,
      totalAmount,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
      bookingReference
    });

    try {
      await booking.save();
    } catch (dbError) {
      console.error('❌ Failed to save booking due to MongoDB connection:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    console.log('✅ Guide booking saved:', booking._id);

    // Populate the booking with guide and user details
    await booking.populate('guide', 'firstName lastName email phone avatar rating');
    await booking.populate('user', 'firstName lastName email phone');

    console.log('✅ Guide booking populated:', {
      id: booking._id,
      user: booking.user?.firstName,
      guide: booking.guide?.firstName,
      status: booking.status
    });

    // Create notification for the guide
    try {
      await createNotification({
        user: guideId,
        type: 'booking',
        title: 'New Guide Booking Request',
        message: `${booking.user.firstName} ${booking.user.lastName} wants to book your services for ${booking.duration} starting ${start.toLocaleDateString()}`,
        priority: 'high',
        booking: booking._id,
        tourist: booking.user._id,
        actionUrl: `/guide/dashboard?tab=bookings`,
        actionText: 'View Booking',
        metadata: {
          bookingId: booking._id,
          duration: booking.duration,
          groupSize: booking.groupSize,
          totalAmount: booking.totalAmount
        }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Guide booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('❌ Error creating guide booking:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors
    });
    res.status(500).json({
      success: false,
      message: 'Error creating guide booking',
      error: error.message,
      details: error.errors || error.stack
    });
  }
};

// @desc    Create guide booking for guests (without authentication)
// @route   POST /api/bookings/guide/guest
// @access  Public
const createGuestGuideBooking = async (req, res) => {
  try {
    const { guideId, startDate, endDate, duration, groupSize, specialRequests, guestInfo } = req.body;

    console.log('🎯 Creating guest guide booking:', { guideId, startDate, endDate, duration, groupSize, specialRequests, guestInfo });

    // Validate required fields
    if (!guideId || !startDate || !endDate || !duration || !groupSize) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: guideId, startDate, endDate, duration, groupSize'
      });
    }

    // Validate guest info for guest bookings
    if (!guestInfo || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Guest information is required: firstName, lastName, email, phone'
      });
    }

    // Check if guide exists
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    // Calculate total amount (you can adjust pricing logic)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Base price per person per day (you can make this configurable)
    const basePricePerPersonPerDay = 50; // $50 per person per day
    const totalAmount = basePricePerPersonPerDay * groupSize * daysDiff;

    // Check if user already exists, if not create one
    let guestUser = await User.findOne({ email: guestInfo.email });
    
    if (!guestUser) {
      // Create a temporary user record for the guest
      guestUser = new User({
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        email: guestInfo.email,
        phone: guestInfo.phone,
        password: 'temp_password_' + Date.now(), // Temporary password
        role: 'tourist',
        status: 'active',
        isVerified: false,
        isActive: true
      });

      await guestUser.save();
    }

    // Generate unique booking reference
    const bookingReference = `GB-GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const booking = new Booking({
      user: guestUser._id,
      guide: guideId,
      bookingDate: new Date(),
      startDate: start,
      endDate: end,
      duration,
      groupSize,
      totalAmount,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
      bookingReference
    });

    await booking.save();

    console.log('✅ Guest guide booking saved:', {
      bookingId: booking._id,
      userId: booking.user,
      guideId: booking.guide,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookingReference: booking.bookingReference
    });

    // Populate the booking with guide and user details
    await booking.populate('guide', 'firstName lastName email phone avatar rating');
    await booking.populate('user', 'firstName lastName email phone');

    console.log('✅ Guest guide booking populated:', {
      id: booking._id,
      user: booking.user?.firstName,
      guide: booking.guide?.firstName,
      status: booking.status
    });

    // Create notification for the guide
    try {
      await createNotification({
        user: guideId,
        type: 'booking',
        title: 'New Guest Guide Booking Request',
        message: `${booking.user.firstName} ${booking.user.lastName} (Guest) wants to book your services for ${booking.duration} starting ${start.toLocaleDateString()}`,
        priority: 'high',
        booking: booking._id,
        tourist: booking.user._id,
        actionUrl: `/guide/dashboard?tab=bookings`,
        actionText: 'View Booking',
        metadata: {
          bookingId: booking._id,
          duration: booking.duration,
          groupSize: booking.groupSize,
          totalAmount: booking.totalAmount,
          isGuest: true
        }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Guide booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('❌ Error creating guest guide booking:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors
    });
    res.status(500).json({
      success: false,
      message: 'Error creating guide booking',
      error: error.message,
      details: error.errors || error.stack
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getGuideBookings,
  createGuideBooking,
  createGuestGuideBooking
};
