// Staff Analytics & Monitoring Controller
const { asyncHandler } = require('../../middleware/errorHandler');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Tour = require('../../models/Tour');
const { staffAuth, requirePermission, logActivity } = require('../../middleware/staffAuth');

// @desc    Get analytics overview
// @route   GET /api/staff/analytics/overview
// @access  Private (Staff)
const getAnalyticsOverview = asyncHandler(async (req, res) => {
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
    
    // Get comprehensive analytics
    const analytics = {
      // User Analytics
      users: {
        total: await User.countDocuments(),
        new: await User.countDocuments({ createdAt: { $gte: startDate } }),
        active: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      },
      
      // Booking Analytics
      bookings: {
        total: await Booking.countDocuments(),
        recent: await Booking.countDocuments({ createdAt: { $gte: startDate } }),
        byStatus: await Booking.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        revenue: await Booking.aggregate([
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
        // Revenue breakdown by service type
        byServiceType: await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          {
            $group: {
              _id: {
                $cond: [
                  { $ne: ['$tour', null] }, 'tours',
                  { $cond: [
                    { $ne: ['$hotel', null] }, 'hotels',
                    { $cond: [
                      { $ne: ['$vehicle', null] }, 'vehicles',
                      'other'
                    ]}
                  ]}
                ]
              },
              total: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ])
      },
      
      // Platform Performance
      performance: {
        averageBookingValue: await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, average: { $avg: '$totalAmount' } } }
        ]),
        conversionRate: 0.15, // Mock data - would calculate from actual data
        customerSatisfaction: 4.2, // Mock data - would calculate from reviews
        platformUptime: 99.8, // Mock data - would get from monitoring
        bookingCompletionRate: await Booking.aggregate([
          { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
        ]).then(result => result[0] ? Math.round((result[0].completed / result[0].total) * 100) : 0)
      },
      
      // Growth Metrics
      growth: {
        userGrowth: await User.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 12 }
        ]),
        bookingGrowth: await Booking.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 12 }
        ])
      },
      
      // Geographic Analytics
      geography: {
        topDestinations: await Booking.aggregate([
          { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tour' } },
          { $unwind: '$tour' },
          { $group: { _id: '$tour.location', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        userLocations: await User.aggregate([
          { $match: { 'profile.location': { $exists: true } } },
          { $group: { _id: '$profile.location', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      },
      
      // Time-based Analytics
      trends: {
        dailyBookings: await Booking.aggregate([
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
        ]),
        hourlyActivity: await Booking.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      }
    };
    
    // Format the data
    analytics.bookings.revenue = analytics.bookings.revenue.length > 0 ? analytics.bookings.revenue[0].total : 0;
    analytics.bookings.recentRevenue = analytics.bookings.recentRevenue.length > 0 ? analytics.bookings.recentRevenue[0].total : 0;
    analytics.performance.averageBookingValue = analytics.performance.averageBookingValue.length > 0 ? analytics.performance.averageBookingValue[0].average : 0;
    
    // Format revenue breakdown by service type
    const revenueBreakdown = {
      tours: analytics.bookings.byServiceType.find(s => s._id === 'tours')?.total || 0,
      hotels: analytics.bookings.byServiceType.find(s => s._id === 'hotels')?.total || 0,
      vehicles: analytics.bookings.byServiceType.find(s => s._id === 'vehicles')?.total || 0,
      other: analytics.bookings.byServiceType.find(s => s._id === 'other')?.total || 0
    };
    
    analytics.bookings.revenueBreakdown = revenueBreakdown;
    
    // Calculate growth rates
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (period === '7d' ? 7 : 30));

    const previousUsers = await User.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const previousBookings = await Booking.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const previousRevenue = await Booking.aggregate([
      { 
        $match: { 
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: previousStartDate, $lt: startDate }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    const currentUsers = analytics.users.new;
    const currentBookings = analytics.bookings.recent;
    const currentRevenue = analytics.bookings.recentRevenue;

    const userGrowthRate = previousUsers > 0 ? Math.round(((currentUsers - previousUsers) / previousUsers) * 100 * 10) / 10 : 0;
    const bookingGrowthRate = previousBookings > 0 ? Math.round(((currentBookings - previousBookings) / previousBookings) * 100 * 10) / 10 : 0;
    const revenueGrowthRate = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10 : 0;

    // Add growth rates to analytics
    analytics.growthRates = {
      users: userGrowthRate,
      bookings: bookingGrowthRate,
      revenue: revenueGrowthRate
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics overview'
    });
  }
});

// @desc    Get user analytics
// @route   GET /api/staff/analytics/users
// @access  Private (Staff)
const getUserAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = '30d', page = 1, limit = 10 } = req.query;
    
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
    
    // Get user analytics
    const analytics = {
      // User Statistics
      stats: {
        total: await User.countDocuments(),
        new: await User.countDocuments({ createdAt: { $gte: startDate } }),
        active: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        verified: await User.countDocuments({ isVerified: true }),
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      },
      
      // User Growth
      growth: await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
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
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Top Users by Activity
      topUsers: await User.aggregate([
        { $lookup: { from: 'bookings', localField: '_id', foreignField: 'user', as: 'bookings' } },
        { $project: { 
          firstName: 1, 
          lastName: 1, 
          email: 1, 
          role: 1,
          bookingCount: { $size: '$bookings' },
          totalSpent: { $sum: '$bookings.totalAmount' }
        } },
        { $sort: { bookingCount: -1 } },
        { $limit: parseInt(limit) }
      ]),
      
      // User Retention
      retention: {
        daily: await User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              newUsers: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ])
      }
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user analytics'
    });
  }
});

// @desc    Get booking analytics
// @route   GET /api/staff/analytics/bookings
// @access  Private (Staff)
const getBookingAnalytics = asyncHandler(async (req, res) => {
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
    
    // Get booking analytics
    const analytics = {
      // Booking Statistics
      stats: {
        total: await Booking.countDocuments(),
        recent: await Booking.countDocuments({ createdAt: { $gte: startDate } }),
        confirmed: await Booking.countDocuments({ status: 'confirmed' }),
        completed: await Booking.countDocuments({ status: 'completed' }),
        cancelled: await Booking.countDocuments({ status: 'cancelled' }),
        byStatus: await Booking.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      },
      
      // Revenue Analytics
      revenue: {
        total: await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        recent: await Booking.aggregate([
          { 
            $match: { 
              status: { $in: ['confirmed', 'completed'] },
              createdAt: { $gte: startDate }
            } 
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        average: await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, average: { $avg: '$totalAmount' } } }
        ])
      },
      
      // Booking Trends
      trends: {
        daily: await Booking.aggregate([
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
        ]),
        hourly: await Booking.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      },
      
      // Popular Tours
      popularTours: await Booking.aggregate([
        { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tour' } },
        { $unwind: '$tour' },
        { $group: { 
          _id: '$tour._id', 
          title: { $first: '$tour.title' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Top Guides
      topGuides: await Booking.aggregate([
        { $lookup: { from: 'users', localField: 'guide', foreignField: '_id', as: 'guide' } },
        { $unwind: '$guide' },
        { $group: { 
          _id: '$guide._id', 
          firstName: { $first: '$guide.firstName' },
          lastName: { $first: '$guide.lastName' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    };
    
    // Format the data
    analytics.revenue.total = analytics.revenue.total.length > 0 ? analytics.revenue.total[0].total : 0;
    analytics.revenue.recent = analytics.revenue.recent.length > 0 ? analytics.revenue.recent[0].total : 0;
    analytics.revenue.average = analytics.revenue.average.length > 0 ? analytics.revenue.average[0].average : 0;
    
    res.status(200).json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking analytics'
    });
  }
});

// @desc    Get platform performance metrics
// @route   GET /api/staff/analytics/performance
// @access  Private (Staff)
const getPerformanceMetrics = asyncHandler(async (req, res) => {
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
    
    // Get performance metrics
    const metrics = {
      // System Performance
      system: {
        uptime: 99.8, // Mock data - would get from monitoring
        responseTime: 150, // Mock data - average response time in ms
        errorRate: 0.02, // Mock data - error rate percentage
        throughput: 1250 // Mock data - requests per minute
      },
      
      // Business Metrics
      business: {
        conversionRate: 0.15, // Mock data - would calculate from actual data
        customerSatisfaction: 4.2, // Mock data - would calculate from reviews
        retentionRate: 0.75, // Mock data - customer retention rate
        churnRate: 0.05 // Mock data - customer churn rate
      },
      
      // User Engagement
      engagement: {
        dailyActiveUsers: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        weeklyActiveUsers: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        monthlyActiveUsers: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        averageSessionDuration: 25.5 // Mock data - in minutes
      },
      
      // Financial Performance
      financial: {
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
        averageOrderValue: await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, average: { $avg: '$totalAmount' } } }
        ]),
        revenueGrowth: 0.12 // Mock data - 12% growth
      },
      
      // Quality Metrics
      quality: {
        averageRating: 4.2, // Mock data - would calculate from reviews
        supportTicketResolution: 0.95, // Mock data - 95% resolution rate
        bookingCompletionRate: 0.92, // Mock data - 92% completion rate
        customerComplaints: 0.03 // Mock data - 3% complaint rate
      }
    };
    
    // Format the data
    metrics.financial.totalRevenue = metrics.financial.totalRevenue.length > 0 ? metrics.financial.totalRevenue[0].total : 0;
    metrics.financial.recentRevenue = metrics.financial.recentRevenue.length > 0 ? metrics.financial.recentRevenue[0].total : 0;
    metrics.financial.averageOrderValue = metrics.financial.averageOrderValue.length > 0 ? metrics.financial.averageOrderValue[0].average : 0;
    
    res.status(200).json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching performance metrics'
    });
  }
});

// @desc    Get real-time monitoring data
// @route   GET /api/staff/analytics/monitoring
// @access  Private (Staff)
const getMonitoringData = asyncHandler(async (req, res) => {
  try {
    // Get real-time monitoring data
    const monitoring = {
      // System Health
      systemHealth: {
        status: 'healthy',
        uptime: 99.8,
        responseTime: 150,
        errorRate: 0.02,
        cpuUsage: 45.2,
        memoryUsage: 62.8,
        diskUsage: 38.5
      },
      
      // Active Users
      activeUsers: {
        current: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
        }),
        today: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        peak: 1250 // Mock data - peak concurrent users
      },
      
      // Recent Activity
      recentActivity: {
        newBookings: await Booking.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        }),
        newUsers: await User.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        }),
        supportTickets: 3, // Mock data - new support tickets
        systemAlerts: 0 // Mock data - system alerts
      },
      
      // Performance Trends
      trends: {
        responseTime: [120, 135, 150, 145, 140, 155, 150], // Mock data - last 7 data points
        errorRate: [0.01, 0.02, 0.015, 0.03, 0.02, 0.025, 0.02], // Mock data
        throughput: [1100, 1200, 1250, 1300, 1150, 1350, 1250] // Mock data
      }
    };
    
    res.status(200).json({
      success: true,
      data: monitoring
    });
    
  } catch (error) {
    console.error('Get monitoring data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching monitoring data'
    });
  }
});

module.exports = {
  getAnalyticsOverview,
  getUserAnalytics,
  getBookingAnalytics,
  getPerformanceMetrics,
  getMonitoringData
};


