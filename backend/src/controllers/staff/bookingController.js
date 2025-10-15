// Staff Booking Management Controller
const { asyncHandler } = require('../../middleware/errorHandler');
const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const HotelBooking = require('../../models/hotels/HotelBooking');
const VehicleBooking = require('../../models/vehicles/VehicleBooking');
const VehicleBookingRequest = require('../../models/vehicles/VehicleBookingRequest');
const User = require('../../models/User');
const Tour = require('../../models/Tour');
const Hotel = require('../../models/hotels/Hotel');
const Room = require('../../models/hotels/Room');
const Vehicle = require('../../models/Vehicle');
const { staffAuth, requirePermission, logActivity } = require('../../middleware/staffAuth');

// @desc    Get all bookings with filters
// @route   GET /api/staff/bookings
// @access  Private (Staff)
const getAllBookings = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Backend Staff getAllBookings called:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      query: req.query
    });

    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      type, 
      dateFrom, 
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log('🔍 Staff booking request:', { page, limit, search, status, type, dateFrom, dateTo });
    
    // Build filter object
    let filter = {};
    
    // Search filter - search in actual fields, not populated ones
    if (search) {
      // First, try to find users by name/email
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      // Try to find guides by name
      const guides = await User.find({
        role: 'guide',
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const guideIds = guides.map(guide => guide._id);
      
      // Try to find tours by title
      const tours = await Tour.find({
        title: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const tourIds = tours.map(tour => tour._id);
      
      // Build search filter
      filter.$or = [
        { user: { $in: userIds } },
        { guide: { $in: guideIds } },
        { tour: { $in: tourIds } }
      ];
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Type filter (tour, hotel, vehicle, guide)
    if (type) {
      if (type === 'guide') {
        // Guide bookings are bookings that have a guide but no tour
        filter.guide = { $exists: true };
        filter.tour = { $exists: false };
      } else if (type === 'tour') {
        // Tour bookings are bookings that have both tour and guide
        filter.tour = { $exists: true };
        filter.guide = { $exists: true };
      } else {
        // For other types, you can extend this logic
        filter.type = type;
      }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Build filters for different booking types
    const buildBookingFilter = (baseFilter, bookingType) => {
      let bookingFilter = { ...baseFilter };
      
      // Apply type-specific filters
      if (type && type !== 'all') {
        if (type === 'tour') {
          bookingFilter.tour = { $exists: true };
        } else if (type === 'guide') {
          bookingFilter.guide = { $exists: true };
          bookingFilter.tour = { $exists: false };
          bookingFilter.customTrip = { $exists: false };
        } else if (type === 'custom-trip') {
          bookingFilter.customTrip = { $exists: true };
        } else if (type === 'hotel') {
          // Hotel bookings will be handled separately
          return null;
        } else if (type === 'vehicle') {
          // Vehicle bookings will be handled separately
          return null;
        }
      }
      
      return bookingFilter;
    };

    // Build hotel booking filter
    const buildHotelFilter = async (baseFilter) => {
      let hotelFilter = {};
      
      // Apply status filter
      if (status && status !== 'all') {
        hotelFilter.bookingStatus = status;
      }
      
      // Apply date range filter
      if (dateFrom || dateTo) {
        hotelFilter.createdAt = {};
        if (dateFrom) hotelFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) hotelFilter.createdAt.$lte = new Date(dateTo);
      }
      
      // Apply search filter
      if (search) {
        const users = await User.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(user => user._id);
        hotelFilter.user = { $in: userIds };
      }
      
      return hotelFilter;
    };

    // Build vehicle booking filter
    const buildVehicleFilter = async (baseFilter) => {
      let vehicleFilter = {};
      
      // Apply status filter
      if (status && status !== 'all') {
        vehicleFilter.bookingStatus = status;
      }
      
      // Apply date range filter
      if (dateFrom || dateTo) {
        vehicleFilter.createdAt = {};
        if (dateFrom) vehicleFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) vehicleFilter.createdAt.$lte = new Date(dateTo);
      }
      
      // Apply search filter
      if (search) {
        const users = await User.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(user => user._id);
        vehicleFilter.user = { $in: userIds };
      }
      
      return vehicleFilter;
    };

    // Initialize arrays for different booking types
    let tourBookings = [];
    let hotelBookings = [];
    let vehicleBookings = [];
    
    // Only fetch bookings based on type filter
    if (!type || type === 'all' || type === 'tour' || type === 'guide' || type === 'custom-trip') {
      // Get tour/guide bookings from multiple collections with proper filtering
      const tourGuideFilter = buildBookingFilter(filter, type);
      const generalBookings = tourGuideFilter ? await Booking.find(tourGuideFilter)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('tour', 'title duration price location images')
        .populate('guide', 'firstName lastName email phone avatar profile')
        .populate('customTrip', 'requestDetails staffAssignment status paymentStatus')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)) : [];
      
      // Get tour bookings from tourbookings collection with filtering
      const tourBookingsFromCollection = await mongoose.connection.db.collection('tourbookings')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      // Get guide bookings from guidebookings collection with filtering
      const guideBookingsFromCollection = await mongoose.connection.db.collection('guidebookings')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      // Format general bookings to include type information
      const formattedGeneralBookings = generalBookings.map(booking => ({
        ...booking.toObject(),
        type: booking.customTrip ? 'custom-trip' : (booking.tour ? 'tour' : 'guide')
      }));
      
      // Format guide bookings from collection
      const formattedGuideBookings = guideBookingsFromCollection.map(booking => ({
        ...booking,
        type: 'guide'
      }));
      
      // Format tour bookings from collection
      const formattedTourBookings = tourBookingsFromCollection.map(booking => ({
        ...booking,
        type: 'tour'
      }));
      
      // Combine all tour/guide bookings
      tourBookings = [...formattedGeneralBookings, ...formattedTourBookings, ...formattedGuideBookings];
    }
    
    // Only fetch hotel bookings if type filter allows it
    if (!type || type === 'all' || type === 'hotel') {
      const hotelFilter = await buildHotelFilter(filter);
      hotelBookings = await HotelBooking.find(hotelFilter)
        .populate('user', 'firstName lastName email phone')
        .populate('hotel', 'name location')
        .populate('room', 'roomNumber roomType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }
    
    // Only fetch vehicle bookings if type filter allows it
    if (!type || type === 'all' || type === 'vehicle') {
      const vehicleFilter = await buildVehicleFilter(filter);
      vehicleBookings = await VehicleBooking.find(vehicleFilter)
        .populate('user', 'firstName lastName email phone')
        .populate('vehicle', 'make model type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }
    
    // Convert hotel bookings to match tour booking format
    const formattedHotelBookings = hotelBookings.map(hotelBooking => ({
      _id: hotelBooking._id,
      type: 'hotel',
      user: hotelBooking.user,
      hotel: hotelBooking.hotel,
      room: hotelBooking.room,
      startDate: hotelBooking.checkInDate,
      endDate: hotelBooking.checkOutDate,
      groupSize: hotelBooking.guests.adults + hotelBooking.guests.children,
      totalAmount: hotelBooking.pricing.totalPrice,
      status: hotelBooking.bookingStatus,
      paymentStatus: hotelBooking.paymentStatus,
      specialRequests: hotelBooking.specialRequests,
      createdAt: hotelBooking.createdAt,
      updatedAt: hotelBooking.updatedAt,
      bookingReference: hotelBooking.bookingReference
    }));
    
    // Convert vehicle bookings to match tour booking format
    const formattedVehicleBookings = vehicleBookings.map(vehicleBooking => ({
      _id: vehicleBooking._id,
      type: 'vehicle',
      user: vehicleBooking.user,
      vehicle: vehicleBooking.vehicle,
      startDate: vehicleBooking.tripDetails.startDate,
      endDate: vehicleBooking.tripDetails.endDate,
      groupSize: vehicleBooking.passengers.adults + vehicleBooking.passengers.children,
      totalAmount: vehicleBooking.pricing.totalPrice,
      status: vehicleBooking.bookingStatus,
      paymentStatus: vehicleBooking.paymentStatus,
      specialRequests: vehicleBooking.specialRequests,
      createdAt: vehicleBooking.createdAt,
      updatedAt: vehicleBooking.updatedAt,
      bookingReference: vehicleBooking.bookingReference,
      pickupLocation: vehicleBooking.tripDetails.pickupLocation,
      dropoffLocation: vehicleBooking.tripDetails.dropoffLocation
    }));
    
    // Combine all types of bookings
    const allBookings = [...tourBookings, ...formattedHotelBookings, ...formattedVehicleBookings];
    
    console.log('📊 Found tour bookings:', tourBookings.length);
    console.log('📊 Found hotel bookings:', hotelBookings.length);
    console.log('📊 Found vehicle bookings:', vehicleBookings.length);
    console.log('📊 Total bookings:', allBookings.length);
    
    // Get total count for pagination
    const tourCount = await Booking.countDocuments(filter) + 
                      await mongoose.connection.db.collection('tourbookings').countDocuments() +
                      await mongoose.connection.db.collection('guidebookings').countDocuments();
    const hotelCount = await HotelBooking.countDocuments();
    const vehicleCount = await VehicleBooking.countDocuments();
    const total = tourCount + hotelCount + vehicleCount;
    
    console.log('📊 Total bookings in database:', total);
    
    // Get booking statistics
    const stats = {
      total: await Booking.countDocuments() + 
             await HotelBooking.countDocuments() + 
             await VehicleBooking.countDocuments() +
             await mongoose.connection.db.collection('tourbookings').countDocuments() +
             await mongoose.connection.db.collection('guidebookings').countDocuments(),
      pending: await Booking.countDocuments({ status: 'pending' }) + 
               await HotelBooking.countDocuments({ bookingStatus: 'pending' }) + 
               await VehicleBooking.countDocuments({ bookingStatus: 'pending' }),
      confirmed: await Booking.countDocuments({ status: 'confirmed' }) + 
                 await HotelBooking.countDocuments({ bookingStatus: 'confirmed' }) + 
                 await VehicleBooking.countDocuments({ bookingStatus: 'confirmed' }),
      completed: await Booking.countDocuments({ status: 'completed' }) + 
                 await HotelBooking.countDocuments({ bookingStatus: 'completed' }) + 
                 await VehicleBooking.countDocuments({ bookingStatus: 'completed' }),
      cancelled: await Booking.countDocuments({ status: 'cancelled' }) + 
                 await HotelBooking.countDocuments({ bookingStatus: 'cancelled' }) + 
                 await VehicleBooking.countDocuments({ bookingStatus: 'cancelled' }),
      guideBookings: await Booking.countDocuments({ 
        guide: { $exists: true, $ne: null }, 
        tour: { $exists: false },
        customTrip: { $exists: false }
      }) + await mongoose.connection.db.collection('guidebookings').countDocuments(),
      tourBookings: await Booking.countDocuments({ 
        tour: { $exists: true }, 
        guide: { $exists: true },
        customTrip: { $exists: false }
      }) + await mongoose.connection.db.collection('tourbookings').countDocuments(),
      customTripBookings: await Booking.countDocuments({ 
        customTrip: { $exists: true }
      }),
      hotelBookings: await HotelBooking.countDocuments(),
      vehicleBookings: await VehicleBooking.countDocuments(),
      today: await Booking.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }) + await HotelBooking.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }) + await VehicleBooking.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      thisWeek: await Booking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }) + await HotelBooking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }) + await VehicleBooking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),
      thisMonth: await Booking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }) + await HotelBooking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }) + await VehicleBooking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      })
    };
    
    res.status(200).json({
      success: true,
      data: {
        bookings: allBookings,
        stats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
    
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// @desc    Get single booking details
// @route   GET /api/staff/bookings/:id
// @access  Private (Staff)
const getBookingDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('user', 'firstName lastName email phone avatar')
      .populate('tour', 'title description duration price location images')
      .populate('guide', 'firstName lastName email phone avatar profile');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Get booking history/activity
    const history = [
      {
        action: 'created',
        description: 'Booking created by customer',
        timestamp: booking.createdAt,
        user: booking.user?.firstName + ' ' + booking.user?.lastName
      }
    ];
    
    // Add status changes to history
    if (booking.status === 'confirmed') {
      history.push({
        action: 'confirmed',
        description: 'Booking confirmed',
        timestamp: booking.updatedAt,
        user: 'System'
      });
    }
    
    if (booking.status === 'cancelled') {
      history.push({
        action: 'cancelled',
        description: booking.cancellationReason || 'Booking cancelled',
        timestamp: booking.updatedAt,
        user: 'System'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        booking,
        history: history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    });
    
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking details'
    });
  }
});

// @desc    Update booking
// @route   PUT /api/staff/bookings/:id
// @access  Private (Staff)
const updateBooking = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      startDate, 
      endDate, 
      groupSize, 
      totalAmount, 
      specialRequests,
      notes 
    } = req.body;
    const staffId = req.user._id;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update fields
    const updateData = {};
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (groupSize) updateData.groupSize = groupSize;
    if (totalAmount) updateData.totalAmount = totalAmount;
    if (specialRequests) updateData.specialRequests = specialRequests;
    
    // Add staff notes
    if (notes) {
      updateData.staffNotes = notes;
      updateData.lastModifiedBy = staffId;
      updateData.lastModifiedAt = new Date();
    }
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('user', 'firstName lastName email phone')
      .populate('tour', 'title duration price location')
      .populate('guide', 'firstName lastName email phone');
    
    // Log activity
    console.log(`Staff ${staffId} updated booking ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
    
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating booking'
    });
  }
});

// @desc    Cancel booking
// @route   POST /api/staff/bookings/:id/cancel
// @access  Private (Staff)
const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, notes } = req.body;
    const staffId = req.user._id;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = staffId;
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount || 0;
    booking.staffNotes = notes;
    
    await booking.save();
    
    // Log activity
    console.log(`Staff ${staffId} cancelled booking ${id}: ${reason}`);
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          cancellationReason: booking.cancellationReason,
          cancelledAt: booking.cancelledAt,
          refundAmount: booking.refundAmount
        }
      }
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling booking'
    });
  }
});

// @desc    Create manual booking
// @route   POST /api/staff/bookings
// @access  Private (Staff)
const createManualBooking = asyncHandler(async (req, res) => {
  try {
    const {
      userId,
      tourId,
      guideId,
      startDate,
      endDate,
      groupSize,
      totalAmount,
      specialRequests,
      notes
    } = req.body;
    const staffId = req.user._id;
    
    // Validate required fields
    if (!userId || !tourId || !guideId || !startDate || !groupSize || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
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
    
    // Create booking
    const booking = new Booking({
      user: userId,
      tour: tourId,
      guide: guideId,
      bookingDate: new Date(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: tour.duration,
      groupSize,
      totalAmount,
      status: 'confirmed', // Manual bookings are confirmed by default
      paymentStatus: 'paid',
      specialRequests,
      staffNotes: notes,
      createdBy: staffId,
      isManualBooking: true
    });
    
    await booking.save();
    
    // Populate the booking for response
    await booking.populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'tour', select: 'title duration price location' },
      { path: 'guide', select: 'firstName lastName email phone' }
    ]);
    
    // Log activity
    console.log(`Staff ${staffId} created manual booking ${booking._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Manual booking created successfully',
      data: booking
    });
    
  } catch (error) {
    console.error('Create manual booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating manual booking'
    });
  }
});

// @desc    Get booking statistics
// @route   GET /api/staff/bookings/statistics
// @access  Private (Staff)
const getBookingStatistics = asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get booking statistics
    const stats = {
      total: await Booking.countDocuments(),
      pending: await Booking.countDocuments({ status: 'pending' }),
      confirmed: await Booking.countDocuments({ status: 'confirmed' }),
      completed: await Booking.countDocuments({ status: 'completed' }),
      cancelled: await Booking.countDocuments({ status: 'cancelled' }),
      
      // Guide bookings count
      guideBookings: await Booking.countDocuments({ 
        guide: { $exists: true }, 
        tour: { $exists: false } 
      }),
      
      // Recent bookings
      recent: await Booking.countDocuments({ createdAt: { $gte: startDate } }),
      
      // Revenue statistics
      totalRevenue: await Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      recentRevenue: await Booking.aggregate([
        { 
          $match: { 
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: startDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Average booking value
      averageBookingValue: await Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, average: { $avg: '$totalAmount' } } }
      ]),
      
      // Booking trends by day
      dailyTrends: await Booking.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    };
    
    // Format revenue data
    stats.totalRevenue = stats.totalRevenue.length > 0 ? stats.totalRevenue[0].total : 0;
    stats.recentRevenue = stats.recentRevenue.length > 0 ? stats.recentRevenue[0].total : 0;
    stats.averageBookingValue = stats.averageBookingValue.length > 0 ? stats.averageBookingValue[0].average : 0;
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking statistics'
    });
  }
});

// @desc    Get booking conflicts
// @route   GET /api/staff/bookings/conflicts
// @access  Private (Staff)
const getBookingConflicts = asyncHandler(async (req, res) => {
  try {
    const { guideId, date } = req.query;
    
    if (!guideId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Guide ID and date are required'
      });
    }
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Find conflicting bookings
    const conflicts = await Booking.find({
      guide: guideId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startDate: { $lte: endOfDay },
          endDate: { $gte: startOfDay }
        }
      ]
    })
      .populate('user', 'firstName lastName email')
      .populate('tour', 'title duration')
      .sort({ startDate: 1 });
    
    res.status(200).json({
      success: true,
      data: conflicts
    });
    
  } catch (error) {
    console.error('Get booking conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking conflicts'
    });
  }
});

module.exports = {
  getAllBookings,
  getBookingDetails,
  updateBooking,
  cancelBooking,
  createManualBooking,
  getBookingStatistics,
  getBookingConflicts
};


