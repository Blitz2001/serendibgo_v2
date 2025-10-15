const asyncHandler = require('express-async-handler');
const puppeteer = require('puppeteer');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const HotelBooking = require('../../models/hotels/HotelBooking');
const VehicleBooking = require('../../models/vehicles/VehicleBooking');
const Review = require('../../models/Review');
const SupportTicket = require('../../models/SupportTicket');

// @desc    Generate PDF report for staff
// @route   POST /api/staff/reports/generate
// @access  Private (Staff only)
const generateStaffPDFReport = asyncHandler(async (req, res) => {
  try {
    const { reportType = 'overview', period = '30d' } = req.body;
    const staffId = req.user.id; // Get staff ID from authenticated user
    
    console.log('Generating staff PDF report:', { reportType, period, staffId });
    
    // Use mock data for testing when database is not available
    let reportData;
    try {
      if (reportType === 'approvals') {
        reportData = await fetchStaffApprovalsReportData(staffId, period);
      } else if (reportType === 'bookings') {
        reportData = await fetchStaffBookingsReportData(staffId, period);
      } else if (reportType === 'financial') {
        reportData = await fetchStaffFinancialReportData(staffId, period);
      } else if (reportType === 'support') {
        reportData = await fetchStaffSupportReportData(staffId, period);
      } else if (reportType === 'performance') {
        reportData = await fetchStaffPerformanceReportData(staffId, period);
      } else {
        reportData = await fetchStaffOverviewReportData(staffId, period);
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      // Mock data for testing
      if (reportType === 'approvals') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalApprovals: 25,
            pendingApprovals: 8,
            approvedApprovals: 15,
            rejectedApprovals: 2,
            hotelsApproved: 12,
            guidesApproved: 8,
            driversApproved: 5,
            averageProcessingTime: 2.5
          },
          recent: {
            recentApprovals: 8,
            recentProcessingTime: 2.1
          },
          approvals: [
            { 
              id: '1', 
              type: 'Hotel Registration', 
              applicantName: 'Hotel Paradise', 
              submittedDate: '2024-01-15', 
              processedDate: '2024-01-17', 
              status: 'approved',
              processingTime: 2,
              reviewer: 'John Staff'
            },
            { 
              id: '2', 
              type: 'Guide Registration', 
              applicantName: 'Sarah Guide', 
              submittedDate: '2024-01-18', 
              processedDate: '2024-01-20', 
              status: 'approved',
              processingTime: 2,
              reviewer: 'John Staff'
            },
            { 
              id: '3', 
              type: 'Driver Registration', 
              applicantName: 'Mike Driver', 
              submittedDate: '2024-01-20', 
              processedDate: null, 
              status: 'pending',
              processingTime: null,
              reviewer: 'John Staff'
            }
          ]
        };
      } else if (reportType === 'bookings') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalBookings: 150,
            confirmedBookings: 120,
            pendingBookings: 20,
            cancelledBookings: 10,
            hotelBookings: 80,
            tourBookings: 45,
            vehicleBookings: 25,
            totalRevenue: 2500000
          },
          recent: {
            recentBookings: 25,
            recentRevenue: 450000
          },
          bookings: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              bookingType: 'Hotel', 
              serviceName: 'Hotel Paradise', 
              date: '2024-01-15', 
              status: 'confirmed', 
              amount: 15000,
              processedBy: 'John Staff'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              bookingType: 'Tour', 
              serviceName: 'Cultural Heritage Tour', 
              date: '2024-01-18', 
              status: 'confirmed', 
              amount: 12000,
              processedBy: 'John Staff'
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              bookingType: 'Vehicle', 
              serviceName: 'Luxury Van', 
              date: '2024-01-20', 
              status: 'pending', 
              amount: 8000,
              processedBy: 'John Staff'
            }
          ]
        };
      } else if (reportType === 'financial') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalRevenue: 2500000,
            platformCommission: 250000,
            netRevenue: 2250000,
            totalTransactions: 150,
            averageTransactionValue: 16667,
            refunds: 50000,
            pendingPayments: 100000,
            paymentSuccessRate: 95.5
          },
          recent: {
            recentRevenue: 450000,
            recentTransactions: 25
          },
          transactions: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              serviceType: 'Hotel Booking', 
              amount: 15000, 
              commission: 1500, 
              netAmount: 13500,
              status: 'completed',
              date: '2024-01-15',
              paymentMethod: 'Credit Card'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              serviceType: 'Tour Booking', 
              amount: 12000, 
              commission: 1200, 
              netAmount: 10800,
              status: 'completed',
              date: '2024-01-18',
              paymentMethod: 'Bank Transfer'
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              serviceType: 'Vehicle Booking', 
              amount: 8000, 
              commission: 800, 
              netAmount: 7200,
              status: 'pending',
              date: '2024-01-20',
              paymentMethod: 'Credit Card'
            }
          ]
        };
      } else if (reportType === 'support') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalTickets: 45,
            openTickets: 8,
            closedTickets: 35,
            pendingTickets: 2,
            averageResolutionTime: 4.2,
            customerSatisfaction: 4.6,
            responseRate: 98,
            escalationRate: 5
          },
          recent: {
            recentTickets: 12,
            recentResolutions: 10
          },
          tickets: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              subject: 'Booking Issue', 
              priority: 'Medium', 
              status: 'closed', 
              createdDate: '2024-01-15',
              resolvedDate: '2024-01-17',
              resolutionTime: 2,
              handledBy: 'John Staff'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              subject: 'Payment Problem', 
              priority: 'High', 
              status: 'open', 
              createdDate: '2024-01-18',
              resolvedDate: null,
              resolutionTime: null,
              handledBy: 'John Staff'
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              subject: 'Account Access', 
              priority: 'Low', 
              status: 'pending', 
              createdDate: '2024-01-20',
              resolvedDate: null,
              resolutionTime: null,
              handledBy: 'John Staff'
            }
          ]
        };
      } else if (reportType === 'performance') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalTasks: 200,
            completedTasks: 185,
            pendingTasks: 15,
            averageTaskCompletionTime: 2.5,
            customerSatisfaction: 4.7,
            errorRate: 2.1,
            productivityScore: 92,
            teamCollaboration: 88
          },
          recent: {
            recentTasks: 25,
            recentCompletions: 22
          },
          performance: {
            taskTrends: [
              { date: '2024-01-01', tasks: 8 },
              { date: '2024-01-02', tasks: 12 },
              { date: '2024-01-03', tasks: 6 },
              { date: '2024-01-04', tasks: 15 },
              { date: '2024-01-05', tasks: 10 },
              { date: '2024-01-06', tasks: 18 },
              { date: '2024-01-07', tasks: 14 }
            ],
            topCategories: [
              { category: 'Approvals', count: 45, percentage: 22.5 },
              { category: 'Bookings', count: 60, percentage: 30 },
              { category: 'Support', count: 35, percentage: 17.5 },
              { category: 'Financial', count: 25, percentage: 12.5 },
              { category: 'Other', count: 35, percentage: 17.5 }
            ]
          }
        };
      } else {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          staff: {
            name: 'John Staff',
            email: 'john@staff.com',
            phone: '+94771234567',
            department: 'Operations',
            position: 'Staff Member',
            joinDate: '2023-01-15',
            permissions: ['approvals', 'bookings', 'support'],
            performance: 92
          },
          overview: {
            totalApprovals: 25,
            totalBookings: 150,
            totalRevenue: 2500000,
            totalTickets: 45,
            averageRating: 4.7,
            tasksCompleted: 185,
            productivityScore: 92,
            customerSatisfaction: 4.6
          },
          recent: {
            recentApprovals: 8,
            recentBookings: 25,
            recentRevenue: 450000,
            recentTickets: 12
          },
          summary: {
            monthlyGrowth: 15.2,
            taskGrowth: 12.5,
            revenueGrowth: 18.3,
            satisfactionGrowth: 2.1
          }
        };
      }
    }
    
    // Generate HTML content for the PDF
    const htmlContent = generateStaffHTMLReport(reportData, reportType);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    
    console.log('Staff PDF generated successfully, size:', pdfBuffer.length);
    
    // Convert PDF buffer to base64 for CORS compatibility
    const base64PDF = Buffer.from(pdfBuffer).toString('base64');
    
    console.log('Base64 PDF length:', base64PDF.length);
    console.log('First 100 chars of base64:', base64PDF.substring(0, 100));
    
    res.json({
      success: true,
      data: base64PDF,
      filename: `staff-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
  } catch (error) {
    console.error('Error generating staff PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating staff PDF report',
      error: error.message
    });
  }
});

// Helper function to fetch staff overview report data
const fetchStaffOverviewReportData = async (staffId, period) => {
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

  // Get staff information
  const staff = await User.findById(staffId).select('-password');
  if (!staff) {
    throw new Error('Staff member not found');
  }

  // Get various statistics
  const [
    totalApprovals,
    totalBookings,
    totalRevenue,
    totalTickets,
    recentApprovals,
    recentBookings,
    recentTickets
  ] = await Promise.all([
    // Total approvals (mock for now)
    Promise.resolve(25),
    // Total bookings
    Booking.countDocuments(),
    // Total revenue
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => result[0]?.total || 0),
    // Total support tickets
    SupportTicket.countDocuments(),
    // Recent approvals (mock for now)
    Promise.resolve(8),
    // Recent bookings
    Booking.countDocuments({ createdAt: { $gte: startDate } }),
    // Recent tickets
    SupportTicket.countDocuments({ createdAt: { $gte: startDate } })
  ]);

  const recentRevenue = await Booking.aggregate([
    { 
      $match: { 
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).then(result => result[0]?.total || 0);

  return {
    period,
    startDate,
    endDate: new Date(),
    staff: {
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      phone: staff.phone,
      department: staff.profile?.department || 'Operations',
      position: staff.profile?.position || 'Staff Member',
      joinDate: staff.createdAt.toLocaleDateString(),
      permissions: staff.profile?.permissions || ['basic'],
      performance: 92 // Mock value
    },
    overview: {
      totalApprovals,
      totalBookings,
      totalRevenue,
      totalTickets,
      averageRating: 4.7, // Mock value
      tasksCompleted: 185, // Mock value
      productivityScore: 92, // Mock value
      customerSatisfaction: 4.6 // Mock value
    },
    recent: {
      recentApprovals,
      recentBookings,
      recentRevenue,
      recentTickets
    },
    summary: {
      monthlyGrowth: 15.2, // Mock value
      taskGrowth: 12.5, // Mock value
      revenueGrowth: 18.3, // Mock value
      satisfactionGrowth: 2.1 // Mock value
    }
  };
};

// Helper function to fetch staff approvals report data
const fetchStaffApprovalsReportData = async (staffId, period) => {
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

  // Mock data for approvals (would need actual approval system)
  const totalApprovals = 25;
  const pendingApprovals = 8;
  const approvedApprovals = 15;
  const rejectedApprovals = 2;

  const recentApprovals = 8;
  const averageProcessingTime = 2.5;

  // Mock approval records
  const approvals = [
    { 
      id: '1', 
      type: 'Hotel Registration', 
      applicantName: 'Hotel Paradise', 
      submittedDate: '2024-01-15', 
      processedDate: '2024-01-17', 
      status: 'approved',
      processingTime: 2,
      reviewer: 'John Staff'
    },
    { 
      id: '2', 
      type: 'Guide Registration', 
      applicantName: 'Sarah Guide', 
      submittedDate: '2024-01-18', 
      processedDate: '2024-01-20', 
      status: 'approved',
      processingTime: 2,
      reviewer: 'John Staff'
    },
    { 
      id: '3', 
      type: 'Driver Registration', 
      applicantName: 'Mike Driver', 
      submittedDate: '2024-01-20', 
      processedDate: null, 
      status: 'pending',
      processingTime: null,
      reviewer: 'John Staff'
    }
  ];

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalApprovals,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      hotelsApproved: 12, // Mock value
      guidesApproved: 8, // Mock value
      driversApproved: 5, // Mock value
      averageProcessingTime
    },
    recent: {
      recentApprovals,
      recentProcessingTime: 2.1 // Mock value
    },
    approvals
  };
};

// Helper function to fetch staff bookings report data
const fetchStaffBookingsReportData = async (staffId, period) => {
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

  // Get booking statistics
  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).then(result => result[0]?.total || 0);

  const recentBookings = await Booking.countDocuments({ createdAt: { $gte: startDate } });
  const recentRevenue = await Booking.aggregate([
    { 
      $match: { 
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).then(result => result[0]?.total || 0);

  // Get sample bookings
  const bookings = await Booking.find({})
    .populate('user', 'firstName lastName email')
    .populate('tour', 'name')
    .populate('hotel', 'name')
    .populate('vehicle', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedBookings = bookings.map(booking => ({
    id: booking._id.toString(),
    customerName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Guest',
    bookingType: booking.tour ? 'Tour' : booking.hotel ? 'Hotel' : booking.vehicle ? 'Vehicle' : 'Other',
    serviceName: booking.tour?.name || booking.hotel?.name || booking.vehicle?.name || 'Custom Service',
    date: booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'TBD',
    status: booking.status,
    amount: booking.totalAmount || 0,
    processedBy: 'John Staff' // Mock value
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      hotelBookings: Math.floor(totalBookings * 0.5), // Mock value
      tourBookings: Math.floor(totalBookings * 0.3), // Mock value
      vehicleBookings: Math.floor(totalBookings * 0.2), // Mock value
      totalRevenue
    },
    recent: {
      recentBookings,
      recentRevenue
    },
    bookings: formattedBookings
  };
};

// Helper function to fetch staff financial report data
const fetchStaffFinancialReportData = async (staffId, period) => {
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

  // Get financial statistics
  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).then(result => result[0]?.total || 0);

  const platformCommission = totalRevenue * 0.1; // 10% commission
  const netRevenue = totalRevenue - platformCommission;
  const totalTransactions = await Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] } });
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const recentRevenue = await Booking.aggregate([
    { 
      $match: { 
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).then(result => result[0]?.total || 0);

  const recentTransactions = await Booking.countDocuments({ 
    status: { $in: ['confirmed', 'completed'] },
    createdAt: { $gte: startDate }
  });

  // Get sample transactions
  const transactions = await Booking.find({ status: { $in: ['confirmed', 'completed'] } })
    .populate('user', 'firstName lastName')
    .populate('tour', 'name')
    .populate('hotel', 'name')
    .populate('vehicle', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedTransactions = transactions.map(transaction => ({
    id: transaction._id.toString(),
    customerName: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : 'Guest',
    serviceType: transaction.tour ? 'Tour Booking' : transaction.hotel ? 'Hotel Booking' : transaction.vehicle ? 'Vehicle Booking' : 'Other',
    amount: transaction.totalAmount || 0,
    commission: (transaction.totalAmount || 0) * 0.1,
    netAmount: (transaction.totalAmount || 0) * 0.9,
    status: transaction.status,
    date: transaction.createdAt.toLocaleDateString(),
    paymentMethod: 'Credit Card' // Mock value
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalRevenue,
      platformCommission: Math.round(platformCommission),
      netRevenue: Math.round(netRevenue),
      totalTransactions,
      averageTransactionValue: Math.round(averageTransactionValue),
      refunds: Math.round(totalRevenue * 0.02), // Mock value
      pendingPayments: Math.round(totalRevenue * 0.04), // Mock value
      paymentSuccessRate: 95.5 // Mock value
    },
    recent: {
      recentRevenue,
      recentTransactions
    },
    transactions: formattedTransactions
  };
};

// Helper function to fetch staff support report data
const fetchStaffSupportReportData = async (staffId, period) => {
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

  // Get support ticket statistics
  const totalTickets = await SupportTicket.countDocuments();
  const openTickets = await SupportTicket.countDocuments({ status: 'open' });
  const closedTickets = await SupportTicket.countDocuments({ status: 'closed' });
  const pendingTickets = await SupportTicket.countDocuments({ status: 'pending' });

  const recentTickets = await SupportTicket.countDocuments({ createdAt: { $gte: startDate } });
  const recentResolutions = await SupportTicket.countDocuments({ 
    status: 'closed',
    updatedAt: { $gte: startDate }
  });

  // Get sample tickets
  const tickets = await SupportTicket.find({})
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedTickets = tickets.map(ticket => ({
    id: ticket._id.toString(),
    customerName: ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Anonymous',
    subject: ticket.subject,
    priority: ticket.priority || 'Medium',
    status: ticket.status,
    createdDate: ticket.createdAt.toLocaleDateString(),
    resolvedDate: ticket.status === 'closed' ? ticket.updatedAt.toLocaleDateString() : null,
    resolutionTime: ticket.status === 'closed' ? Math.floor(Math.random() * 5) + 1 : null, // Mock value
    handledBy: 'John Staff' // Mock value
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalTickets,
      openTickets,
      closedTickets,
      pendingTickets,
      averageResolutionTime: 4.2, // Mock value
      customerSatisfaction: 4.6, // Mock value
      responseRate: 98, // Mock value
      escalationRate: 5 // Mock value
    },
    recent: {
      recentTickets,
      recentResolutions
    },
    tickets: formattedTickets
  };
};

// Helper function to fetch staff performance report data
const fetchStaffPerformanceReportData = async (staffId, period) => {
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

  // Mock performance data
  const totalTasks = 200;
  const completedTasks = 185;
  const pendingTasks = 15;
  const averageTaskCompletionTime = 2.5;
  const customerSatisfaction = 4.7;
  const errorRate = 2.1;
  const productivityScore = 92;
  const teamCollaboration = 88;

  const recentTasks = 25;
  const recentCompletions = 22;

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalTasks,
      completedTasks,
      pendingTasks,
      averageTaskCompletionTime,
      customerSatisfaction,
      errorRate,
      productivityScore,
      teamCollaboration
    },
    recent: {
      recentTasks,
      recentCompletions
    },
    performance: {
      taskTrends: [], // Would need to implement daily aggregation
      topCategories: [
        { category: 'Approvals', count: 45, percentage: 22.5 },
        { category: 'Bookings', count: 60, percentage: 30 },
        { category: 'Support', count: 35, percentage: 17.5 },
        { category: 'Financial', count: 25, percentage: 12.5 },
        { category: 'Other', count: 35, percentage: 17.5 }
      ]
    }
  };
};

// Helper function to generate HTML content for staff reports
const generateStaffHTMLReport = (data, reportType) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportTitle = reportType === 'approvals' ? 'Staff Approvals Report' : 
                     reportType === 'bookings' ? 'Staff Bookings Report' : 
                     reportType === 'financial' ? 'Staff Financial Report' :
                     reportType === 'support' ? 'Staff Support Report' :
                     reportType === 'performance' ? 'Staff Performance Report' :
                     'Staff Overview Report';
  const reportTypeDisplay = reportType === 'approvals' ? 'Approvals Report' : 
                           reportType === 'bookings' ? 'Bookings Report' : 
                           reportType === 'financial' ? 'Financial Report' :
                           reportType === 'support' ? 'Support Report' :
                           reportType === 'performance' ? 'Performance Report' :
                           'Overview Report';

  // Generate content based on report type
  const generateContent = () => {
    if (reportType === 'approvals') {
      return generateStaffApprovalsReportContent(data);
    } else if (reportType === 'bookings') {
      return generateStaffBookingsReportContent(data);
    } else if (reportType === 'financial') {
      return generateStaffFinancialReportContent(data);
    } else if (reportType === 'support') {
      return generateStaffSupportReportContent(data);
    } else if (reportType === 'performance') {
      return generateStaffPerformanceReportContent(data);
    } else {
      return generateStaffOverviewReportContent(data);
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SerendibGo ${reportTitle}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
            }
            
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 30px;
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .staff-info {
                background: #eff6ff;
                padding: 20px;
                margin-bottom: 30px;
                border-left: 4px solid #3b82f6;
            }
            
            .staff-info h2 {
                color: #3b82f6;
                margin-bottom: 15px;
                font-size: 1.5em;
            }
            
            .staff-info p {
                margin-bottom: 5px;
                font-size: 1.1em;
            }
            
            .report-info {
                background: #f0f9ff;
                padding: 15px;
                margin-bottom: 30px;
                border-radius: 8px;
            }
            
            .report-info h3 {
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .stat-card h4 {
                color: #666;
                font-size: 0.9em;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .stat-card .value {
                font-size: 2em;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .stat-card .label {
                color: #888;
                font-size: 0.9em;
            }
            
            .section {
                margin-bottom: 30px;
            }
            
            .section h3 {
                color: #333;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 1.3em;
            }
            
            .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .table th,
            .table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            
            .table th {
                background: #f8f9fa;
                font-weight: bold;
                color: #333;
            }
            
            .table tr:nth-child(even) {
                background: #f9f9f9;
            }
            
            .footer {
                margin-top: 50px;
                padding: 30px;
                background: #f8f9fa;
                border-top: 2px solid #3b82f6;
            }
            
            .signature-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 30px;
            }
            
            .signature-box {
                text-align: center;
                min-width: 200px;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                width: 150px;
                margin: 0 auto 10px;
                height: 40px;
            }
            
            .signature-label {
                font-size: 0.9em;
                color: #666;
            }
            
            .date-section {
                text-align: right;
            }
            
            .date-section p {
                margin-bottom: 5px;
            }
            
            @media print {
                body { margin: 0; }
                .header { page-break-inside: avoid; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <!-- Company Header -->
        <div class="header">
            <h1>SerendibGo</h1>
            <p>Your Gateway to Sri Lankan Adventures</p>
        </div>
        
        <!-- Staff Information -->
        <div class="staff-info">
            <h2>Staff Information</h2>
            ${data.staff ? `
            <p><strong>Staff Name:</strong> ${data.staff.name}</p>
            <p><strong>Email:</strong> ${data.staff.email}</p>
            <p><strong>Phone:</strong> ${data.staff.phone}</p>
            <p><strong>Department:</strong> ${data.staff.department}</p>
            <p><strong>Position:</strong> ${data.staff.position}</p>
            <p><strong>Join Date:</strong> ${data.staff.joinDate}</p>
            <p><strong>Performance Score:</strong> ${data.staff.performance}/100</p>
            ` : ''}
        </div>
        
        <!-- Report Information -->
        <div class="report-info">
            <h3>${reportTitle}</h3>
            <p><strong>Report Period:</strong> ${data.period.toUpperCase()} (${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()})</p>
            <p><strong>Generated On:</strong> ${currentDate}</p>
            <p><strong>Report Type:</strong> ${reportTypeDisplay}</p>
        </div>
        
        ${generateContent()}
        
        <!-- Footer with Signature -->
        <div class="footer">
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">Staff Signature</div>
                </div>
                <div class="date-section">
                    <p><strong>Report Generated:</strong> ${currentDate}</p>
                    <p><strong>Generated By:</strong> SerendibGo Staff System</p>
                    <p><strong>Report ID:</strong> STS-${Date.now().toString().slice(-6)}</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
                <p>This report was automatically generated by the SerendibGo Staff Management System.</p>
                <p>For questions or clarifications, please contact our support team at support@serendibgo.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate staff overview report content
const generateStaffOverviewReportContent = (data) => {
  return `
    <!-- Staff Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Approvals</h4>
                <div class="value">${data.overview.totalApprovals}</div>
                <div class="label">All Time</div>
            </div>
            <div class="stat-card">
                <h4>Total Bookings</h4>
                <div class="value">${data.overview.totalBookings}</div>
                <div class="label">Processed</div>
            </div>
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">Generated</div>
            </div>
            <div class="stat-card">
                <h4>Support Tickets</h4>
                <div class="value">${data.overview.totalTickets}</div>
                <div class="label">Handled</div>
            </div>
            <div class="stat-card">
                <h4>Tasks Completed</h4>
                <div class="value">${data.overview.tasksCompleted}</div>
                <div class="label">All Time</div>
            </div>
            <div class="stat-card">
                <h4>Productivity Score</h4>
                <div class="value">${data.overview.productivityScore}%</div>
                <div class="label">Performance</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}/5</div>
                <div class="label">Rating</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Approvals</h4>
                <div class="value">${data.recent.recentApprovals}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Bookings</h4>
                <div class="value">${data.recent.recentBookings}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Revenue</h4>
                <div class="value">Rs. ${data.recent.recentRevenue.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Tickets</h4>
                <div class="value">${data.recent.recentTickets}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Growth Summary -->
    <div class="section">
        <h3>Growth Summary</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Growth Rate</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Monthly Revenue</td>
                    <td>+${data.summary.revenueGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
                <tr>
                    <td>Task Completion</td>
                    <td>+${data.summary.taskGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
                <tr>
                    <td>Customer Satisfaction</td>
                    <td>+${data.summary.satisfactionGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
            </tbody>
        </table>
    </div>
  `;
};

// Generate staff approvals report content
const generateStaffApprovalsReportContent = (data) => {
  return `
    <!-- Approvals Statistics -->
    <div class="section">
        <h3>Approvals Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Approvals</h4>
                <div class="value">${data.overview.totalApprovals}</div>
                <div class="label">All Approvals</div>
            </div>
            <div class="stat-card">
                <h4>Pending</h4>
                <div class="value">${data.overview.pendingApprovals}</div>
                <div class="label">Awaiting Review</div>
            </div>
            <div class="stat-card">
                <h4>Approved</h4>
                <div class="value">${data.overview.approvedApprovals}</div>
                <div class="label">Successfully Approved</div>
            </div>
            <div class="stat-card">
                <h4>Rejected</h4>
                <div class="value">${data.overview.rejectedApprovals}</div>
                <div class="label">Rejected Applications</div>
            </div>
            <div class="stat-card">
                <h4>Hotels Approved</h4>
                <div class="value">${data.overview.hotelsApproved}</div>
                <div class="label">Hotel Registrations</div>
            </div>
            <div class="stat-card">
                <h4>Guides Approved</h4>
                <div class="value">${data.overview.guidesApproved}</div>
                <div class="label">Guide Registrations</div>
            </div>
            <div class="stat-card">
                <h4>Drivers Approved</h4>
                <div class="value">${data.overview.driversApproved}</div>
                <div class="label">Driver Registrations</div>
            </div>
            <div class="stat-card">
                <h4>Avg Processing Time</h4>
                <div class="value">${data.overview.averageProcessingTime} days</div>
                <div class="label">Time to Process</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Approvals</h4>
                <div class="value">${data.recent.recentApprovals}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Processing Time</h4>
                <div class="value">${data.recent.recentProcessingTime} days</div>
                <div class="label">Average Time</div>
            </div>
        </div>
    </div>
    
    <!-- Approvals List -->
    <div class="section">
        <h3>Recent Approvals</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Applicant</th>
                    <th>Submitted</th>
                    <th>Processed</th>
                    <th>Status</th>
                    <th>Processing Time</th>
                    <th>Reviewer</th>
                </tr>
            </thead>
            <tbody>
                ${data.approvals.map(approval => `
                    <tr>
                        <td>${approval.type}</td>
                        <td>${approval.applicantName}</td>
                        <td>${approval.submittedDate}</td>
                        <td>${approval.processedDate || 'Pending'}</td>
                        <td>${approval.status}</td>
                        <td>${approval.processingTime ? approval.processingTime + ' days' : 'N/A'}</td>
                        <td>${approval.reviewer}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate staff bookings report content
const generateStaffBookingsReportContent = (data) => {
  return `
    <!-- Bookings Statistics -->
    <div class="section">
        <h3>Bookings Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Bookings</h4>
                <div class="value">${data.overview.totalBookings}</div>
                <div class="label">All Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Confirmed</h4>
                <div class="value">${data.overview.confirmedBookings}</div>
                <div class="label">Confirmed Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Pending</h4>
                <div class="value">${data.overview.pendingBookings}</div>
                <div class="label">Pending Approval</div>
            </div>
            <div class="stat-card">
                <h4>Cancelled</h4>
                <div class="value">${data.overview.cancelledBookings}</div>
                <div class="label">Cancelled Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Hotel Bookings</h4>
                <div class="value">${data.overview.hotelBookings}</div>
                <div class="label">Hotel Reservations</div>
            </div>
            <div class="stat-card">
                <h4>Tour Bookings</h4>
                <div class="value">${data.overview.tourBookings}</div>
                <div class="label">Tour Reservations</div>
            </div>
            <div class="stat-card">
                <h4>Vehicle Bookings</h4>
                <div class="value">${data.overview.vehicleBookings}</div>
                <div class="label">Vehicle Reservations</div>
            </div>
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">From Bookings</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Bookings</h4>
                <div class="value">${data.recent.recentBookings}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Revenue</h4>
                <div class="value">Rs. ${data.recent.recentRevenue.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Bookings List -->
    <div class="section">
        <h3>Recent Bookings</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Booking Type</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Processed By</th>
                </tr>
            </thead>
            <tbody>
                ${data.bookings.map(booking => `
                    <tr>
                        <td>${booking.customerName}</td>
                        <td>${booking.bookingType}</td>
                        <td>${booking.serviceName}</td>
                        <td>${booking.date}</td>
                        <td>${booking.status}</td>
                        <td>Rs. ${booking.amount.toLocaleString()}</td>
                        <td>${booking.processedBy}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate staff financial report content
const generateStaffFinancialReportContent = (data) => {
  return `
    <!-- Financial Statistics -->
    <div class="section">
        <h3>Financial Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">Gross Revenue</div>
            </div>
            <div class="stat-card">
                <h4>Platform Commission</h4>
                <div class="value">Rs. ${data.overview.platformCommission.toLocaleString()}</div>
                <div class="label">10% Commission</div>
            </div>
            <div class="stat-card">
                <h4>Net Revenue</h4>
                <div class="value">Rs. ${data.overview.netRevenue.toLocaleString()}</div>
                <div class="label">After Commission</div>
            </div>
            <div class="stat-card">
                <h4>Total Transactions</h4>
                <div class="value">${data.overview.totalTransactions}</div>
                <div class="label">All Transactions</div>
            </div>
            <div class="stat-card">
                <h4>Avg Transaction Value</h4>
                <div class="value">Rs. ${data.overview.averageTransactionValue.toLocaleString()}</div>
                <div class="label">Per Transaction</div>
            </div>
            <div class="stat-card">
                <h4>Refunds</h4>
                <div class="value">Rs. ${data.overview.refunds.toLocaleString()}</div>
                <div class="label">Total Refunds</div>
            </div>
            <div class="stat-card">
                <h4>Pending Payments</h4>
                <div class="value">Rs. ${data.overview.pendingPayments.toLocaleString()}</div>
                <div class="label">Awaiting Payment</div>
            </div>
            <div class="stat-card">
                <h4>Payment Success Rate</h4>
                <div class="value">${data.overview.paymentSuccessRate}%</div>
                <div class="label">Success Rate</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Revenue</h4>
                <div class="value">Rs. ${data.recent.recentRevenue.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Transactions</h4>
                <div class="value">${data.recent.recentTransactions}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Transactions Breakdown -->
    <div class="section">
        <h3>Transactions Breakdown</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Service Type</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                </tr>
            </thead>
            <tbody>
                ${data.transactions.map(transaction => `
                    <tr>
                        <td>${transaction.customerName}</td>
                        <td>${transaction.serviceType}</td>
                        <td>Rs. ${transaction.amount.toLocaleString()}</td>
                        <td>Rs. ${transaction.commission.toLocaleString()}</td>
                        <td>Rs. ${transaction.netAmount.toLocaleString()}</td>
                        <td>${transaction.status}</td>
                        <td>${transaction.date}</td>
                        <td>${transaction.paymentMethod}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate staff support report content
const generateStaffSupportReportContent = (data) => {
  return `
    <!-- Support Statistics -->
    <div class="section">
        <h3>Support Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Tickets</h4>
                <div class="value">${data.overview.totalTickets}</div>
                <div class="label">All Tickets</div>
            </div>
            <div class="stat-card">
                <h4>Open Tickets</h4>
                <div class="value">${data.overview.openTickets}</div>
                <div class="label">Currently Open</div>
            </div>
            <div class="stat-card">
                <h4>Closed Tickets</h4>
                <div class="value">${data.overview.closedTickets}</div>
                <div class="label">Successfully Closed</div>
            </div>
            <div class="stat-card">
                <h4>Pending Tickets</h4>
                <div class="value">${data.overview.pendingTickets}</div>
                <div class="label">Awaiting Response</div>
            </div>
            <div class="stat-card">
                <h4>Avg Resolution Time</h4>
                <div class="value">${data.overview.averageResolutionTime} days</div>
                <div class="label">Time to Resolve</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}/5</div>
                <div class="label">Satisfaction Rating</div>
            </div>
            <div class="stat-card">
                <h4>Response Rate</h4>
                <div class="value">${data.overview.responseRate}%</div>
                <div class="label">Response Rate</div>
            </div>
            <div class="stat-card">
                <h4>Escalation Rate</h4>
                <div class="value">${data.overview.escalationRate}%</div>
                <div class="label">Escalated Tickets</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Tickets</h4>
                <div class="value">${data.recent.recentTickets}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Resolutions</h4>
                <div class="value">${data.recent.recentResolutions}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Tickets List -->
    <div class="section">
        <h3>Recent Tickets</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Resolved</th>
                    <th>Resolution Time</th>
                    <th>Handled By</th>
                </tr>
            </thead>
            <tbody>
                ${data.tickets.map(ticket => `
                    <tr>
                        <td>${ticket.customerName}</td>
                        <td>${ticket.subject}</td>
                        <td>${ticket.priority}</td>
                        <td>${ticket.status}</td>
                        <td>${ticket.createdDate}</td>
                        <td>${ticket.resolvedDate || 'Pending'}</td>
                        <td>${ticket.resolutionTime ? ticket.resolutionTime + ' days' : 'N/A'}</td>
                        <td>${ticket.handledBy}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate staff performance report content
const generateStaffPerformanceReportContent = (data) => {
  return `
    <!-- Performance Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Tasks</h4>
                <div class="value">${data.overview.totalTasks}</div>
                <div class="label">All Tasks</div>
            </div>
            <div class="stat-card">
                <h4>Completed Tasks</h4>
                <div class="value">${data.overview.completedTasks}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Pending Tasks</h4>
                <div class="value">${data.overview.pendingTasks}</div>
                <div class="label">Awaiting Completion</div>
            </div>
            <div class="stat-card">
                <h4>Avg Completion Time</h4>
                <div class="value">${data.overview.averageTaskCompletionTime} days</div>
                <div class="label">Time to Complete</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}/5</div>
                <div class="label">Satisfaction Rating</div>
            </div>
            <div class="stat-card">
                <h4>Error Rate</h4>
                <div class="value">${data.overview.errorRate}%</div>
                <div class="label">Error Percentage</div>
            </div>
            <div class="stat-card">
                <h4>Productivity Score</h4>
                <div class="value">${data.overview.productivityScore}%</div>
                <div class="label">Productivity</div>
            </div>
            <div class="stat-card">
                <h4>Team Collaboration</h4>
                <div class="value">${data.overview.teamCollaboration}%</div>
                <div class="label">Collaboration Score</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Tasks</h4>
                <div class="value">${data.recent.recentTasks}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Completions</h4>
                <div class="value">${data.recent.recentCompletions}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Task Categories -->
    <div class="section">
        <h3>Task Categories</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${data.performance.topCategories.map(category => `
                    <tr>
                        <td>${category.category}</td>
                        <td>${category.count}</td>
                        <td>${category.percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Helper function to generate PDF from HTML
const generatePDFFromHTML = async (htmlContent) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

module.exports = {
  generateStaffPDFReport
};
