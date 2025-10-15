// Staff Trip Management Controller
const asyncHandler = require('express-async-handler');
const Tour = require('../../models/Tour');
const Booking = require('../../models/Booking');
const User = require('../../models/User');

// @desc    Get all trips with filtering and pagination
// @route   GET /api/staff/trips
// @access  Private (Staff)
const getTrips = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      category = 'all',
      location = 'all',
      difficulty = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (category !== 'all') {
      filter.category = category;
    }
    
    if (location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get trips with pagination
    const trips = await Tour.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('guide', 'firstName lastName email phone')
      .populate('bookings', 'status createdAt');

    // Get total count for pagination
    const total = await Tour.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        trips,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trips'
    });
  }
});

// @desc    Get trip statistics
// @route   GET /api/staff/trips/statistics
// @access  Private (Staff)
const getTripStatistics = asyncHandler(async (req, res) => {
  try {
    const [
      totalTrips,
      activeTrips,
      draftTrips,
      inactiveTrips,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      // Total trips
      Tour.countDocuments(),
      
      // Active trips
      Tour.countDocuments({ status: 'active' }),
      
      // Draft trips
      Tour.countDocuments({ status: 'draft' }),
      
      // Inactive trips
      Tour.countDocuments({ status: 'inactive' }),
      
      // Total bookings
      Booking.countDocuments(),
      
      // Total revenue (sum of all booking amounts)
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalTrips,
        active: activeTrips,
        draft: draftTrips,
        inactive: inactiveTrips,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get trip statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trip statistics'
    });
  }
});

// @desc    Create new trip
// @route   POST /api/staff/trips
// @access  Private (Staff)
const createTrip = asyncHandler(async (req, res) => {
  try {
    console.log('Create trip request body:', req.body);
    console.log('User ID:', req.user.id);
    
    // Validate required fields based on Tour model
    const {
      title,
      description,
      shortDescription,
      duration,
      price,
      maxParticipants,
      category,
      location,
      images,
      highlights,
      included,
      excluded,
      requirements,
      cancellationPolicy,
      cancellationDetails
    } = req.body;

    // Check required fields
    if (!title || !description || !duration || !price || !maxParticipants || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, duration, price, maxParticipants, category are required'
      });
    }

    // Validate category
    const validCategories = ['adventure', 'cultural', 'nature', 'beach', 'wildlife', 'religious', 'historical', 'culinary'];
    const normalizedCategory = category.toLowerCase();
    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Find a guide to assign to the trip (or use staff member if they're a guide)
    let guideId = req.user.id;
    
    console.log('Current user role:', req.user.role);
    console.log('Current user ID:', req.user.id);
    
    // If the current user is not a guide, find a default guide
    if (req.user.role !== 'guide') {
      console.log('User is not a guide, searching for default guide...');
      const defaultGuide = await User.findOne({ role: 'guide', isActive: true });
      console.log('Default guide found:', defaultGuide ? defaultGuide._id : 'None');
      
      if (defaultGuide) {
        guideId = defaultGuide._id;
      } else {
        // If no guide found, create a temporary guide or use staff member
        console.log('No active guide found, using staff member as guide temporarily');
        // For now, we'll use the staff member as the guide
        // In a real scenario, you might want to create a default guide or handle this differently
        guideId = req.user.id;
      }
    }

    // Prepare trip data with proper structure
    const tripData = {
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription || description.substring(0, 200).trim(),
      duration: parseInt(duration),
      price: parseFloat(price),
      maxParticipants: parseInt(maxParticipants),
      minParticipants: 1,
      category: normalizedCategory, // Use the validated category
      difficulty: req.body.difficulty || 'easy',
      location: {
        name: location || 'Location not specified',
        coordinates: [6.9271, 79.8612], // Default to Colombo, Sri Lanka coordinates
        address: location || '',
        city: location || ''
      },
      images: (images || []).filter(img => img && img.trim() !== '').map(img => ({
        url: img.trim(),
        alt: title,
        isPrimary: false
      })),
      highlights: highlights || [],
      included: included || [],
      excluded: excluded || [],
      requirements: requirements || [],
      cancellationPolicy: cancellationPolicy || 'moderate',
      cancellationDetails: cancellationDetails || '',
      guide: guideId, // Use the determined guide ID
      isActive: true,
      isFeatured: false,
      rating: {
        average: 0,
        count: 0
      },
      bookings: [],
      tags: [],
      seasonality: {
        bestMonths: [],
        avoidMonths: []
      }
    };

    // Set first image as primary if images exist
    if (tripData.images.length > 0) {
      tripData.images[0].isPrimary = true;
    }

    console.log('Processed trip data:', tripData);

    const trip = await Tour.create(tripData);
    console.log('Trip created successfully:', trip._id);

    res.status(201).json({
      success: true,
      data: trip,
      message: 'Trip created successfully'
    });
  } catch (error) {
    console.error('Create trip error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Trip with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update trip
// @route   PUT /api/staff/trips/:id
// @access  Private (Staff)
const updateTrip = asyncHandler(async (req, res) => {
  try {
    console.log('Update trip request body:', req.body);
    console.log('Trip ID:', req.params.id);
    
    const { id } = req.params;
    const {
      title,
      description,
      shortDescription,
      duration,
      price,
      maxParticipants,
      category,
      location,
      images,
      highlights,
      included,
      excluded,
      requirements,
      cancellationPolicy,
      cancellationDetails,
      difficulty
    } = req.body;

    // Check required fields
    if (!title || !description || !duration || !price || !maxParticipants || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, duration, price, maxParticipants, category are required'
      });
    }

    // Validate category
    const validCategories = ['adventure', 'cultural', 'nature', 'beach', 'wildlife', 'religious', 'historical', 'culinary'];
    const normalizedCategory = category.toLowerCase();
    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Prepare update data with proper structure
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription || description.substring(0, 200).trim(),
      duration: parseInt(duration),
      price: parseFloat(price),
      maxParticipants: parseInt(maxParticipants),
      minParticipants: 1,
      category: normalizedCategory,
      difficulty: difficulty || 'easy',
      location: {
        name: location || 'Location not specified',
        coordinates: [6.9271, 79.8612], // Default to Colombo, Sri Lanka coordinates
        address: location || '',
        city: location || ''
      },
      images: (images || []).filter(img => img && img.trim() !== '').map(img => ({
        url: img.trim(),
        alt: title,
        isPrimary: false
      })),
      highlights: highlights || [],
      included: included || [],
      excluded: excluded || [],
      requirements: requirements || [],
      cancellationPolicy: cancellationPolicy || 'moderate',
      cancellationDetails: cancellationDetails || ''
    };

    // Set first image as primary if images exist
    if (updateData.images.length > 0) {
      updateData.images[0].isPrimary = true;
    }

    console.log('Processed update data:', updateData);

    const trip = await Tour.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('guide', 'firstName lastName email phone');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log('Trip updated successfully:', trip._id);

    res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip updated successfully'
    });
  } catch (error) {
    console.error('Update trip error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Trip with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete trip
// @route   DELETE /api/staff/trips/:id
// @access  Private (Staff)
const deleteTrip = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete trip request for ID:', id);

    // Check if trip exists first
    const existingTrip = await Tour.findById(id);
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log('Trip found:', existingTrip.title);

    // Check if trip has active bookings
    const activeBookings = await Booking.countDocuments({
      tour: id,
      status: { $in: ['pending', 'confirmed'] }
    });

    console.log('Active bookings count:', activeBookings);

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip with ${activeBookings} active booking(s). Please cancel or complete the bookings first.`
      });
    }

    // Delete the trip
    const deletedTrip = await Tour.findByIdAndDelete(id);
    console.log('Trip deleted successfully:', deletedTrip.title);

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
      data: {
        deletedTrip: {
          id: deletedTrip._id,
          title: deletedTrip.title
        }
      }
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error deleting trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Bulk trip actions
// @route   POST /api/staff/trips/bulk-action
// @access  Private (Staff)
const bulkTripAction = asyncHandler(async (req, res) => {
  try {
    const { tripIds, action } = req.body;

    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Trip IDs are required'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        message = 'Trips activated successfully';
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        message = 'Trips deactivated successfully';
        break;
      case 'delete':
        // Check for active bookings before deletion
        const activeBookings = await Booking.countDocuments({
          tour: { $in: tripIds },
          status: { $in: ['pending', 'confirmed'] }
        });

        if (activeBookings > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete trips with active bookings'
          });
        }

        await Tour.deleteMany({ _id: { $in: tripIds } });
        return res.status(200).json({
          success: true,
          message: 'Trips deleted successfully'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Tour.updateMany(
      { _id: { $in: tripIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message
    });
  } catch (error) {
    console.error('Bulk trip action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing bulk action'
    });
  }
});

module.exports = {
  getTrips,
  getTripStatistics,
  createTrip,
  updateTrip,
  deleteTrip,
  bulkTripAction
};
