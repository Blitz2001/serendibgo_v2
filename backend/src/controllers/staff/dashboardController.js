// Staff Dashboard Controller
const { asyncHandler } = require('../../middleware/errorHandler');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Tour = require('../../models/Tour');
const { staffAuth, requirePermission, logActivity } = require('../../middleware/staffAuth');

// @desc    Get staff dashboard overview
// @route   GET /api/staff/dashboard/overview
// @access  Private (Staff)
const getDashboardOverview = asyncHandler(async (req, res) => {
  try {
    // Get key metrics
    const [
      totalUsers,
      totalBookings,
      pendingApprovals,
      activeGuides,
      activeHotels,
      supportTickets,
      recentBookings,
      recentUsers
    ] = await Promise.all([
      // Total users
      User.countDocuments({ role: { $in: ['tourist', 'hotel_owner', 'guide', 'driver'] } }),
      
      // Total bookings
      Booking.countDocuments(),
      
      // Pending approvals (guides, hotels, etc.)
      User.countDocuments({ 
        role: { $in: ['guide', 'hotel_owner', 'driver'] },
        isVerified: false 
      }),
      
      // Active guides
      User.countDocuments({ role: 'guide', isActive: true, isVerified: true }),
      
      // Active hotels
      User.countDocuments({ role: 'hotel_owner', isActive: true, isVerified: true }),
      
      // Support tickets (placeholder - you can implement this later)
      0,
      
      // Recent bookings (last 7 days)
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .populate('tour', 'title')
        .populate('guide', 'firstName lastName'),
      
      // Recent users (last 7 days)
      User.find({ 
        role: { $in: ['tourist', 'hotel_owner', 'guide', 'driver'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email role createdAt')
    ]);

    // Calculate revenue (placeholder - implement based on your payment system)
    const totalRevenue = 0;

    // Get staff performance metrics
    const staffStats = {
      pendingApprovals,
      totalUsers,
      activeBookings: totalBookings,
      totalRevenue,
      pendingReviews: 0, // Implement when you have reviews
      supportTickets,
      newGuides: await User.countDocuments({ 
        role: 'guide', 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      newHotels: await User.countDocuments({ 
        role: 'hotel_owner', 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };

    // Get recent activity
    const recentActivity = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        title: 'New booking created',
        description: `${booking.tour?.title || 'Tour'} - ${booking.user?.firstName} ${booking.user?.lastName}`,
        timestamp: booking.createdAt,
        icon: 'calendar'
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        title: 'New user registered',
        description: `${user.firstName} ${user.lastName} (${user.role})`,
        timestamp: user.createdAt,
        icon: 'user'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        stats: staffStats,
        recentActivity,
        quickActions: [
          {
            id: 'approve-guides',
            title: 'Approve Guides',
            description: 'Review and approve guide applications',
            count: await User.countDocuments({ role: 'guide', isVerified: false }),
            icon: 'user-check',
            color: 'green'
          },
          {
            id: 'approve-hotels',
            title: 'Approve Hotels',
            description: 'Review and approve hotel applications',
            count: await User.countDocuments({ role: 'hotel_owner', isVerified: false }),
            icon: 'building',
            color: 'blue'
          },
          {
            id: 'manage-bookings',
            title: 'Manage Bookings',
            description: 'Handle booking requests and issues',
            count: await Booking.countDocuments({ status: 'pending' }),
            icon: 'calendar',
            color: 'orange'
          },
          {
            id: 'support-tickets',
            title: 'Support Tickets',
            description: 'Handle customer support requests',
            count: 0, // Implement when you have support system
            icon: 'headphones',
            color: 'yellow'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// @desc    Get staff performance metrics
// @route   GET /api/staff/dashboard/performance
// @access  Private (Staff)
const getStaffPerformance = asyncHandler(async (req, res) => {
  try {
    const staffId = req.user._id;
    
    // Get staff member's performance data
    const staff = await User.findById(staffId).select('profile');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Calculate performance metrics (placeholder - implement based on your needs)
    const performance = {
      rating: staff.profile?.performance?.rating || 3,
      completedTasks: staff.profile?.performance?.completedTasks || 0,
      lastReview: staff.profile?.performance?.lastReview || null,
      department: staff.profile?.department || 'operations',
      hireDate: staff.profile?.hireDate || null,
      workingHours: staff.profile?.workingHours || null
    };

    res.status(200).json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching performance data'
    });
  }
});

// @desc    Get platform statistics
// @route   GET /api/staff/dashboard/statistics
// @access  Private (Staff)
const getPlatformStatistics = asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
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

    // Get statistics
    const statistics = {
      users: {
        total: await User.countDocuments({ role: { $in: ['tourist', 'hotel_owner', 'guide', 'driver'] } }),
        new: await User.countDocuments({ 
          role: { $in: ['tourist', 'hotel_owner', 'guide', 'driver'] },
          createdAt: { $gte: startDate }
        }),
        verified: await User.countDocuments({ 
          role: { $in: ['hotel_owner', 'guide', 'driver'] },
          isVerified: true 
        }),
        pending: await User.countDocuments({ 
          role: { $in: ['hotel_owner', 'guide', 'driver'] },
          isVerified: false 
        })
      },
      bookings: {
        total: await Booking.countDocuments(),
        recent: await Booking.countDocuments({ createdAt: { $gte: startDate } }),
        pending: await Booking.countDocuments({ status: 'pending' }),
        confirmed: await Booking.countDocuments({ status: 'confirmed' }),
        completed: await Booking.countDocuments({ status: 'completed' }),
        cancelled: await Booking.countDocuments({ status: 'cancelled' })
      },
      tours: {
        total: await Tour.countDocuments(),
        active: await Tour.countDocuments({ isActive: true }),
        inactive: await Tour.countDocuments({ isActive: false })
      }
    };

    res.status(200).json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Platform statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = {
  getDashboardOverview,
  getStaffPerformance,
  getPlatformStatistics
};


