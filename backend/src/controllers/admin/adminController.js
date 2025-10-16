const { asyncHandler } = require('../../middleware/errorHandler');
const User = require('../../models/User');
const Hotel = require('../../models/hotels/Hotel');
const HotelBooking = require('../../models/hotels/HotelBooking');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const totalBookings = await HotelBooking.countDocuments();
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalHotelOwners = await User.countDocuments({ role: 'hotel_owner' });
    const totalGuides = await User.countDocuments({ role: 'guide' });
    const totalTourists = await User.countDocuments({ role: 'tourist' });

    // Get pending approvals
    const pendingHotels = await Hotel.countDocuments({ status: 'pending' });
    const pendingUsers = await User.countDocuments({ isVerified: false });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = await HotelBooking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentHotels = await Hotel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get previous month data for comparison (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousMonthUsers = await User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const previousMonthHotels = await Hotel.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const previousMonthBookings = await HotelBooking.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const previousMonthStaff = await User.countDocuments({ 
      role: 'staff',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const previousMonthHotelOwners = await User.countDocuments({ 
      role: 'hotel_owner',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const previousMonthTourists = await User.countDocuments({ 
      role: 'tourist',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const usersChange = calculatePercentageChange(recentUsers, previousMonthUsers);
    const hotelsChange = calculatePercentageChange(recentHotels, previousMonthHotels);
    const bookingsChange = calculatePercentageChange(recentBookings, previousMonthBookings);
    const staffChange = calculatePercentageChange(totalStaff, previousMonthStaff);
    const hotelOwnersChange = calculatePercentageChange(totalHotelOwners, previousMonthHotelOwners);
    const touristsChange = calculatePercentageChange(totalTourists, previousMonthTourists);

    // Get revenue data (last 30 days)
    const revenueData = await HotelBooking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get previous month revenue for comparison
    const previousMonthRevenueData = await HotelBooking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const averageBookingValue = revenueData.length > 0 ? revenueData[0].averageBookingValue : 0;
    const previousMonthRevenue = previousMonthRevenueData.length > 0 ? previousMonthRevenueData[0].totalRevenue : 0;
    const revenueChange = calculatePercentageChange(totalRevenue, previousMonthRevenue);

    // Get booking status distribution
    const bookingStatusStats = await HotelBooking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get hotel status distribution
    const hotelStatusStats = await Hotel.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalHotels,
          totalBookings,
          totalStaff,
          totalHotelOwners,
          totalGuides,
          totalTourists
        },
        pending: {
          pendingHotels,
          pendingUsers
        },
        recent: {
          recentBookings,
          recentUsers,
          recentHotels
        },
        revenue: {
          totalRevenue,
          averageBookingValue
        },
        changes: {
          totalUsersChange: usersChange,
          totalHotelsChange: hotelsChange,
          totalBookingsChange: bookingsChange,
          activeStaffChange: staffChange,
          hotelOwnersChange: hotelOwnersChange,
          touristsChange: touristsChange,
          totalRevenueChange: revenueChange,
          pendingApprovalsChange: 0 // This would need more complex logic
        },
        bookingStatusStats,
        activeHotels: hotelStatusStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  try {
    console.log('📊 Starting analytics data fetch...');
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    console.log(`📅 Analytics period: ${period}, start date: ${startDate.toISOString()}`);

    // Use Promise.all to run queries in parallel for better performance
    const [
      totalUsers,
      totalBookings,
      totalHotels,
      totalStaff,
      userTrends,
      bookingTrends,
      hotelTrends
    ] = await Promise.all([
      // Basic counts
      User.countDocuments(),
      HotelBooking.countDocuments(),
      Hotel.countDocuments(),
      User.countDocuments({ role: 'staff' }),
      
      // User trends (simplified)
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        { $limit: 30 } // Limit results to prevent large datasets
      ]),
      
      // Booking trends (simplified)
      HotelBooking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
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
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        { $limit: 30 } // Limit results
      ]),
      
      // Hotel trends (simplified)
      Hotel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        { $limit: 30 } // Limit results
      ])
    ]);

    console.log('✅ Basic analytics queries completed');

    // Calculate additional metrics in parallel
    const [
      totalRevenue,
      activeUsers,
      topHotels
    ] = await Promise.all([
      // Total revenue (simplified)
      HotelBooking.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Active users
      User.countDocuments({
        lastLogin: { $gte: startDate }
      }),
      
      // Top hotels (simplified)
      Hotel.aggregate([
        {
          $lookup: {
            from: 'hotelbookings',
            localField: '_id',
            foreignField: 'hotel',
            as: 'bookings'
          }
        },
        {
          $addFields: {
            totalBookings: { $size: '$bookings' },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$bookings',
                  as: 'booking',
                  in: '$$booking.totalAmount'
                }
              }
            }
          }
        },
        {
          $sort: { totalBookings: -1 }
        },
        {
          $limit: 5 // Reduced from 10 to 5 for better performance
        },
        {
          $project: {
            name: 1,
            location: 1,
            totalBookings: 1,
            totalRevenue: 1,
            rating: 1
          }
        }
      ])
    ]);

    console.log('✅ Additional analytics queries completed');

    // Calculate current period metrics
    const currentUsers = userTrends.reduce((sum, trend) => sum + trend.count, 0);
    const currentBookings = bookingTrends.reduce((sum, trend) => sum + trend.count, 0);
    const currentRevenue = bookingTrends.reduce((sum, trend) => sum + (trend.revenue || 0), 0);

    // Calculate growth rates (simplified)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (period === '7d' ? 7 : 30));

    const [previousUsers, previousBookings, previousRevenue] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate }
      }),
      HotelBooking.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate }
      }),
      HotelBooking.aggregate([
        { 
          $match: { 
            createdAt: { $gte: previousStartDate, $lt: startDate } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    const userGrowthRate = previousUsers > 0 ? Math.round(((currentUsers - previousUsers) / previousUsers) * 100 * 10) / 10 : 0;
    const bookingGrowthRate = previousBookings > 0 ? Math.round(((currentBookings - previousBookings) / previousBookings) * 100 * 10) / 10 : 0;
    const revenueGrowthRate = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10 : 0;

    // Calculate average booking value
    const avgBookingValue = currentBookings > 0 ? Math.round(currentRevenue / currentBookings) : 0;

    console.log('✅ Analytics calculations completed');

    const analyticsData = {
      period,
      userTrends,
      bookingTrends,
      hotelTrends,
      topHotels,
      // Summary metrics
      totalNewUsers: currentUsers,
      avgActiveUsers: activeUsers,
      totalBookings: currentBookings,
      totalRevenue: currentRevenue,
      userGrowthRate,
      bookingGrowthRate,
      revenueGrowthRate,
      avgBookingValue,
      // Overall platform metrics
      platformStats: {
        totalUsers,
        totalBookings,
        totalRevenue,
        totalHotels,
        totalStaff
      }
    };

    console.log('📊 Analytics data prepared successfully');

    res.status(200).json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    
    // Return fallback data if analytics fail
    res.status(200).json({
      success: true,
      data: {
        period: req.query.period || '30d',
        userTrends: [],
        bookingTrends: [],
        hotelTrends: [],
        topHotels: [],
        totalNewUsers: 0,
        avgActiveUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        userGrowthRate: 0,
        bookingGrowthRate: 0,
        revenueGrowthRate: 0,
        avgBookingValue: 0,
        platformStats: {
          totalUsers: 0,
          totalBookings: 0,
          totalRevenue: 0,
          totalHotels: 0,
          totalStaff: 0
        }
      }
    });
  }
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by status (active/inactive)
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['tourist', 'driver', 'guide', 'hotel_owner', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { 
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

// @desc    Toggle user verification status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const toggleUserStatus = asyncHandler(async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Update both isActive and isVerified fields
    user.isActive = isActive;
    user.isVerified = isActive; // Verification status should match active status
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'verified and activated' : 'unverified and deactivated'} successfully`,
      data: { 
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, password, isVerified, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || '',
      role: role || 'tourist',
      password,
      isVerified: isVerified || false,
      isActive: isActive !== undefined ? isActive : true
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

module.exports = {
  getDashboardStats,
  getPlatformAnalytics,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  createUser
};
