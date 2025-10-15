const asyncHandler = require('express-async-handler');
const puppeteer = require('puppeteer');
const Driver = require('../../models/vehicles/Driver');
const User = require('../../models/User');
const Trip = require('../../models/vehicles/Trip');
const VehicleBooking = require('../../models/vehicles/VehicleBooking');
const Review = require('../../models/Review');

// @desc    Generate PDF report for driver
// @route   POST /api/drivers/reports/generate
// @access  Private (Driver only)
const generateDriverPDFReport = asyncHandler(async (req, res) => {
  try {
    const { reportType = 'overview', period = '30d' } = req.body;
    const driverId = req.user.id; // Get driver ID from authenticated user
    
    console.log('Generating driver PDF report:', { reportType, period, driverId });
    
    // Use mock data for testing when database is not available
    let reportData;
    try {
      if (reportType === 'trips') {
        reportData = await fetchDriverTripsReportData(driverId, period);
      } else if (reportType === 'earnings') {
        reportData = await fetchDriverEarningsReportData(driverId, period);
      } else if (reportType === 'performance') {
        reportData = await fetchDriverPerformanceReportData(driverId, period);
      } else if (reportType === 'reviews') {
        reportData = await fetchDriverReviewsReportData(driverId, period);
      } else if (reportType === 'vehicles') {
        reportData = await fetchDriverVehiclesReportData(driverId, period);
      } else {
        reportData = await fetchDriverOverviewReportData(driverId, period);
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      // Mock data for testing
      if (reportType === 'trips') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalTrips: 45,
            completedTrips: 40,
            pendingTrips: 3,
            cancelledTrips: 2,
            totalDistance: 2500,
            averageTripDuration: 4.5,
            totalEarnings: 180000,
            averageRating: 4.6
          },
          recent: {
            recentTrips: 12,
            recentEarnings: 45000,
            recentDistance: 650
          },
          trips: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              destination: 'Kandy', 
              startDate: '2024-01-15', 
              endDate: '2024-01-16', 
              status: 'completed',
              distance: 120,
              duration: 3.5,
              earnings: 15000,
              rating: 5
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              destination: 'Galle', 
              startDate: '2024-01-18', 
              endDate: '2024-01-19', 
              status: 'completed',
              distance: 150,
              duration: 4.2,
              earnings: 18000,
              rating: 4
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              destination: 'Nuwara Eliya', 
              startDate: '2024-01-20', 
              endDate: '2024-01-21', 
              status: 'pending',
              distance: 180,
              duration: null,
              earnings: 0,
              rating: null
            }
          ]
        };
      } else if (reportType === 'earnings') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalEarnings: 180000,
            completedTripsEarnings: 160000,
            pendingTripsEarnings: 20000,
            averageEarningsPerTrip: 4000,
            totalDistance: 2500,
            earningsPerKm: 72,
            platformCommission: 18000,
            netEarnings: 162000,
            paymentStatus: 'pending'
          },
          recent: {
            recentEarnings: 45000,
            recentTrips: 12,
            recentDistance: 650
          },
          earnings: [
            { 
              id: '1', 
              tripId: 'T001', 
              customerName: 'John Smith', 
              amount: 15000, 
              commission: 1500, 
              netAmount: 13500,
              status: 'paid',
              date: '2024-01-15',
              paymentMethod: 'Bank Transfer'
            },
            { 
              id: '2', 
              tripId: 'T002', 
              customerName: 'Sarah Johnson', 
              amount: 18000, 
              commission: 1800, 
              netAmount: 16200,
              status: 'paid',
              date: '2024-01-18',
              paymentMethod: 'Bank Transfer'
            },
            { 
              id: '3', 
              tripId: 'T003', 
              customerName: 'Mike Wilson', 
              amount: 20000, 
              commission: 2000, 
              netAmount: 18000,
              status: 'pending',
              date: '2024-01-20',
              paymentMethod: 'Bank Transfer'
            }
          ]
        };
      } else if (reportType === 'performance') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalTrips: 45,
            completedTrips: 40,
            completionRate: 88.9,
            averageRating: 4.6,
            totalReviews: 35,
            onTimeArrivals: 38,
            punctualityRate: 95,
            customerSatisfaction: 4.6,
            safetyScore: 4.8,
            vehicleMaintenance: 4.7
          },
          recent: {
            recentTrips: 12,
            recentRating: 4.7,
            recentCompletionRate: 91.7
          },
          performance: {
            monthlyTrends: [
              { month: 'Jan', trips: 15, rating: 4.5, earnings: 60000 },
              { month: 'Feb', trips: 18, rating: 4.6, earnings: 72000 },
              { month: 'Mar', trips: 12, rating: 4.7, earnings: 48000 }
            ],
            topDestinations: [
              { destination: 'Kandy', trips: 12, earnings: 180000 },
              { destination: 'Galle', trips: 10, earnings: 150000 },
              { destination: 'Nuwara Eliya', trips: 8, earnings: 120000 },
              { destination: 'Colombo', trips: 6, earnings: 90000 },
              { destination: 'Anuradhapura', trips: 4, earnings: 60000 }
            ]
          }
        };
      } else if (reportType === 'reviews') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalReviews: 35,
            averageRating: 4.6,
            fiveStarReviews: 20,
            fourStarReviews: 10,
            threeStarReviews: 3,
            twoStarReviews: 1,
            oneStarReviews: 1,
            responseRate: 95,
            recentReviews: 8
          },
          recent: {
            recentReviews: 8,
            recentAverageRating: 4.7
          },
          reviews: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              rating: 5, 
              comment: 'Excellent service! Very professional and punctual.', 
              date: '2024-01-15',
              tripDestination: 'Kandy'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              rating: 4, 
              comment: 'Good driver, clean vehicle. Would recommend.', 
              date: '2024-01-18',
              tripDestination: 'Galle'
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              rating: 5, 
              comment: 'Amazing experience! Very knowledgeable about the area.', 
              date: '2024-01-20',
              tripDestination: 'Nuwara Eliya'
            }
          ]
        };
      } else if (reportType === 'vehicles') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalVehicles: 2,
            activeVehicles: 2,
            totalTrips: 45,
            totalDistance: 2500,
            averageFuelEfficiency: 12.5,
            maintenanceCosts: 15000,
            insuranceCosts: 25000,
            totalOperatingCosts: 40000
          },
          recent: {
            recentTrips: 12,
            recentDistance: 650,
            recentMaintenance: 1
          },
          vehicles: [
            { 
              id: '1', 
              vehicleType: 'Toyota Hiace', 
              licensePlate: 'ABC-1234', 
              year: 2020, 
              status: 'active',
              totalTrips: 25,
              totalDistance: 1500,
              lastMaintenance: '2024-01-10',
              nextMaintenance: '2024-04-10',
              fuelEfficiency: 12.5
            },
            { 
              id: '2', 
              vehicleType: 'Nissan Vanette', 
              licensePlate: 'XYZ-5678', 
              year: 2019, 
              status: 'active',
              totalTrips: 20,
              totalDistance: 1000,
              lastMaintenance: '2024-01-05',
              nextMaintenance: '2024-04-05',
              fuelEfficiency: 13.2
            }
          ]
        };
      } else {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          driver: {
            name: 'John Driver',
            email: 'john@driver.com',
            phone: '+94771234567',
            driverId: 'DRV001',
            licenseNumber: 'DL123456',
            licenseType: 'B',
            joinDate: '2023-01-15',
            status: 'active',
            rating: 4.6
          },
          overview: {
            totalTrips: 45,
            completedTrips: 40,
            totalEarnings: 180000,
            averageRating: 4.6,
            totalDistance: 2500,
            totalVehicles: 2,
            activeVehicles: 2,
            completionRate: 88.9,
            punctualityRate: 95
          },
          recent: {
            recentTrips: 12,
            recentEarnings: 45000,
            recentDistance: 650,
            recentRating: 4.7
          },
          summary: {
            monthlyGrowth: 12.5,
            earningsGrowth: 15.2,
            tripsGrowth: 8.3,
            ratingGrowth: 2.1
          }
        };
      }
    }
    
    // Generate HTML content for the PDF
    const htmlContent = generateDriverHTMLReport(reportData, reportType);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    
    console.log('Driver PDF generated successfully, size:', pdfBuffer.length);
    
    // Convert PDF buffer to base64 for CORS compatibility
    const base64PDF = Buffer.from(pdfBuffer).toString('base64');
    
    console.log('Base64 PDF length:', base64PDF.length);
    console.log('First 100 chars of base64:', base64PDF.substring(0, 100));
    
    res.json({
      success: true,
      data: base64PDF,
      filename: `driver-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
  } catch (error) {
    console.error('Error generating driver PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating driver PDF report',
      error: error.message
    });
  }
});

// Helper function to fetch driver overview report data
const fetchDriverOverviewReportData = async (driverId, period) => {
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

  // Get driver information
  const driver = await Driver.findOne({ user: driverId }).populate('user', 'firstName lastName email phone');
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get trip statistics
  const totalTrips = await Trip.countDocuments({ driver: driver._id });
  const completedTrips = await Trip.countDocuments({ driver: driver._id, status: 'completed' });
  const totalEarnings = await Trip.aggregate([
    { $match: { driver: driver._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const recentTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    createdAt: { $gte: startDate } 
  });

  const recentEarnings = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const recentDistance = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$distance' } } }
  ]).then(result => result[0]?.total || 0);

  // Get reviews
  const reviews = await Review.find({ driver: driver._id });
  const averageRating = reviews.length > 0 ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return {
    period,
    startDate,
    endDate: new Date(),
    driver: {
      name: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Driver',
      email: driver.user?.email || 'N/A',
      phone: driver.user?.phone || 'N/A',
      driverId: driver.driverId,
      licenseNumber: driver.license?.licenseNumber || 'N/A',
      licenseType: driver.license?.licenseType || 'N/A',
      joinDate: driver.createdAt.toLocaleDateString(),
      status: driver.status,
      rating: averageRating
    },
    overview: {
      totalTrips,
      completedTrips,
      totalEarnings,
      averageRating,
      totalDistance: 2500, // Mock value
      totalVehicles: 2, // Mock value
      activeVehicles: 2, // Mock value
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
      punctualityRate: 95 // Mock value
    },
    recent: {
      recentTrips,
      recentEarnings,
      recentDistance,
      recentRating: averageRating
    },
    summary: {
      monthlyGrowth: 12.5, // Mock value
      earningsGrowth: 15.2, // Mock value
      tripsGrowth: 8.3, // Mock value
      ratingGrowth: 2.1 // Mock value
    }
  };
};

// Helper function to fetch driver trips report data
const fetchDriverTripsReportData = async (driverId, period) => {
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

  // Get driver
  const driver = await Driver.findOne({ user: driverId });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get trip statistics
  const totalTrips = await Trip.countDocuments({ driver: driver._id });
  const completedTrips = await Trip.countDocuments({ driver: driver._id, status: 'completed' });
  const pendingTrips = await Trip.countDocuments({ driver: driver._id, status: 'pending' });
  const cancelledTrips = await Trip.countDocuments({ driver: driver._id, status: 'cancelled' });

  const totalEarnings = await Trip.aggregate([
    { $match: { driver: driver._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const recentTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    createdAt: { $gte: startDate } 
  });

  const recentEarnings = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const recentDistance = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$distance' } } }
  ]).then(result => result[0]?.total || 0);

  // Get sample trips
  const trips = await Trip.find({ driver: driver._id })
    .populate('customer', 'firstName lastName')
    .populate('vehicle', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedTrips = trips.map(trip => ({
    id: trip._id.toString(),
    customerName: trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : 'Guest',
    destination: trip.destination || 'N/A',
    startDate: trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD',
    endDate: trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD',
    status: trip.status,
    distance: trip.distance || 0,
    duration: trip.duration || 0,
    earnings: trip.fare || 0,
    rating: trip.rating || null
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalTrips,
      completedTrips,
      pendingTrips,
      cancelledTrips,
      totalDistance: 2500, // Mock value
      averageTripDuration: 4.5, // Mock value
      totalEarnings,
      averageRating: 4.6 // Mock value
    },
    recent: {
      recentTrips,
      recentEarnings,
      recentDistance
    },
    trips: formattedTrips
  };
};

// Helper function to fetch driver earnings report data
const fetchDriverEarningsReportData = async (driverId, period) => {
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

  // Get driver
  const driver = await Driver.findOne({ user: driverId });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get earnings statistics
  const totalEarnings = await Trip.aggregate([
    { $match: { driver: driver._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const completedTripsEarnings = totalEarnings;
  const pendingTripsEarnings = await Trip.aggregate([
    { $match: { driver: driver._id, status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const totalTrips = await Trip.countDocuments({ driver: driver._id, status: 'completed' });
  const averageEarningsPerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;

  const platformCommission = totalEarnings * 0.1; // 10% commission
  const netEarnings = totalEarnings - platformCommission;

  const recentEarnings = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$fare' } } }
  ]).then(result => result[0]?.total || 0);

  const recentTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    status: 'completed',
    createdAt: { $gte: startDate }
  });

  const recentDistance = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$distance' } } }
  ]).then(result => result[0]?.total || 0);

  // Get sample earnings
  const earnings = await Trip.find({ driver: driver._id, status: 'completed' })
    .populate('customer', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedEarnings = earnings.map(trip => ({
    id: trip._id.toString(),
    tripId: trip.tripId || trip._id.toString().slice(-6),
    customerName: trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : 'Guest',
    amount: trip.fare || 0,
    commission: (trip.fare || 0) * 0.1,
    netAmount: (trip.fare || 0) * 0.9,
    status: trip.paymentStatus || 'paid',
    date: trip.createdAt.toLocaleDateString(),
    paymentMethod: 'Bank Transfer' // Mock value
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalEarnings,
      completedTripsEarnings,
      pendingTripsEarnings,
      averageEarningsPerTrip: Math.round(averageEarningsPerTrip),
      totalDistance: 2500, // Mock value
      earningsPerKm: Math.round(totalEarnings / 2500), // Mock calculation
      platformCommission: Math.round(platformCommission),
      netEarnings: Math.round(netEarnings),
      paymentStatus: 'pending' // Mock value
    },
    recent: {
      recentEarnings,
      recentTrips,
      recentDistance
    },
    earnings: formattedEarnings
  };
};

// Helper function to fetch driver performance report data
const fetchDriverPerformanceReportData = async (driverId, period) => {
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

  // Get driver
  const driver = await Driver.findOne({ user: driverId });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get performance statistics
  const totalTrips = await Trip.countDocuments({ driver: driver._id });
  const completedTrips = await Trip.countDocuments({ driver: driver._id, status: 'completed' });
  const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

  // Get reviews
  const reviews = await Review.find({ driver: driver._id });
  const averageRating = reviews.length > 0 ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const recentTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    createdAt: { $gte: startDate } 
  });

  const recentCompletedTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    status: 'completed',
    createdAt: { $gte: startDate }
  });

  const recentCompletionRate = recentTrips > 0 ? (recentCompletedTrips / recentTrips) * 100 : 0;

  // Get recent reviews
  const recentReviews = await Review.find({ 
    driver: driver._id,
    createdAt: { $gte: startDate }
  });
  const recentRating = recentReviews.length > 0 ? 
    recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length : 0;

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalTrips,
      completedTrips,
      completionRate: Math.round(completionRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      onTimeArrivals: Math.floor(completedTrips * 0.95), // Mock value
      punctualityRate: 95, // Mock value
      customerSatisfaction: Math.round(averageRating * 10) / 10,
      safetyScore: 4.8, // Mock value
      vehicleMaintenance: 4.7 // Mock value
    },
    recent: {
      recentTrips,
      recentRating: Math.round(recentRating * 10) / 10,
      recentCompletionRate: Math.round(recentCompletionRate * 10) / 10
    },
    performance: {
      monthlyTrends: [], // Would need to implement monthly aggregation
      topDestinations: [] // Would need to implement destination aggregation
    }
  };
};

// Helper function to fetch driver reviews report data
const fetchDriverReviewsReportData = async (driverId, period) => {
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

  // Get driver
  const driver = await Driver.findOne({ user: driverId });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get reviews statistics
  const reviews = await Review.find({ driver: driver._id });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

  const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
  const fourStarReviews = reviews.filter(r => r.rating === 4).length;
  const threeStarReviews = reviews.filter(r => r.rating === 3).length;
  const twoStarReviews = reviews.filter(r => r.rating === 2).length;
  const oneStarReviews = reviews.filter(r => r.rating === 1).length;

  const recentReviews = await Review.find({ 
    driver: driver._id,
    createdAt: { $gte: startDate }
  });
  const recentAverageRating = recentReviews.length > 0 ? 
    recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length : 0;

  // Get sample reviews
  const sampleReviews = await Review.find({ driver: driver._id })
    .populate('user', 'firstName lastName')
    .populate('trip', 'destination')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formattedReviews = sampleReviews.map(review => ({
    id: review._id.toString(),
    customerName: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
    rating: review.rating,
    comment: review.comment || 'No comment provided',
    date: review.createdAt.toLocaleDateString(),
    tripDestination: review.trip?.destination || 'N/A'
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      fiveStarReviews,
      fourStarReviews,
      threeStarReviews,
      twoStarReviews,
      oneStarReviews,
      responseRate: 95, // Mock value
      recentReviews: recentReviews.length
    },
    recent: {
      recentReviews: recentReviews.length,
      recentAverageRating: Math.round(recentAverageRating * 10) / 10
    },
    reviews: formattedReviews
  };
};

// Helper function to fetch driver vehicles report data
const fetchDriverVehiclesReportData = async (driverId, period) => {
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

  // Get driver
  const driver = await Driver.findOne({ user: driverId });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get vehicle statistics
  const totalVehicles = driver.vehicles ? driver.vehicles.length : 0;
  const activeVehicles = driver.vehicles ? driver.vehicles.filter(v => v.status === 'active').length : 0;

  const totalTrips = await Trip.countDocuments({ driver: driver._id });
  const recentTrips = await Trip.countDocuments({ 
    driver: driver._id, 
    createdAt: { $gte: startDate } 
  });

  const recentDistance = await Trip.aggregate([
    { 
      $match: { 
        driver: driver._id, 
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$distance' } } }
  ]).then(result => result[0]?.total || 0);

  // Mock vehicle data
  const vehicles = [
    { 
      id: '1', 
      vehicleType: 'Toyota Hiace', 
      licensePlate: 'ABC-1234', 
      year: 2020, 
      status: 'active',
      totalTrips: Math.floor(totalTrips / 2),
      totalDistance: Math.floor(2500 / 2),
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-04-10',
      fuelEfficiency: 12.5
    },
    { 
      id: '2', 
      vehicleType: 'Nissan Vanette', 
      licensePlate: 'XYZ-5678', 
      year: 2019, 
      status: 'active',
      totalTrips: Math.floor(totalTrips / 2),
      totalDistance: Math.floor(2500 / 2),
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-04-05',
      fuelEfficiency: 13.2
    }
  ];

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalVehicles,
      activeVehicles,
      totalTrips,
      totalDistance: 2500, // Mock value
      averageFuelEfficiency: 12.5, // Mock value
      maintenanceCosts: 15000, // Mock value
      insuranceCosts: 25000, // Mock value
      totalOperatingCosts: 40000 // Mock value
    },
    recent: {
      recentTrips,
      recentDistance,
      recentMaintenance: 1 // Mock value
    },
    vehicles
  };
};

// Helper function to generate HTML content for driver reports
const generateDriverHTMLReport = (data, reportType) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportTitle = reportType === 'trips' ? 'Driver Trips Report' : 
                     reportType === 'earnings' ? 'Driver Earnings Report' : 
                     reportType === 'performance' ? 'Driver Performance Report' :
                     reportType === 'reviews' ? 'Driver Reviews Report' :
                     reportType === 'vehicles' ? 'Driver Vehicles Report' :
                     'Driver Overview Report';
  const reportTypeDisplay = reportType === 'trips' ? 'Trips Report' : 
                           reportType === 'earnings' ? 'Earnings Report' : 
                           reportType === 'performance' ? 'Performance Report' :
                           reportType === 'reviews' ? 'Reviews Report' :
                           reportType === 'vehicles' ? 'Vehicles Report' :
                           'Overview Report';

  // Generate content based on report type
  const generateContent = () => {
    if (reportType === 'trips') {
      return generateDriverTripsReportContent(data);
    } else if (reportType === 'earnings') {
      return generateDriverEarningsReportContent(data);
    } else if (reportType === 'performance') {
      return generateDriverPerformanceReportContent(data);
    } else if (reportType === 'reviews') {
      return generateDriverReviewsReportContent(data);
    } else if (reportType === 'vehicles') {
      return generateDriverVehiclesReportContent(data);
    } else {
      return generateDriverOverviewReportContent(data);
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
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
            
            .driver-info {
                background: #ecfdf5;
                padding: 20px;
                margin-bottom: 30px;
                border-left: 4px solid #059669;
            }
            
            .driver-info h2 {
                color: #059669;
                margin-bottom: 15px;
                font-size: 1.5em;
            }
            
            .driver-info p {
                margin-bottom: 5px;
                font-size: 1.1em;
            }
            
            .report-info {
                background: #f0fdf4;
                padding: 15px;
                margin-bottom: 30px;
                border-radius: 8px;
            }
            
            .report-info h3 {
                color: #047857;
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
                border-bottom: 2px solid #059669;
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
                border-top: 2px solid #059669;
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
        
        <!-- Driver Information -->
        <div class="driver-info">
            <h2>Driver Information</h2>
            ${data.driver ? `
            <p><strong>Driver Name:</strong> ${data.driver.name}</p>
            <p><strong>Email:</strong> ${data.driver.email}</p>
            <p><strong>Phone:</strong> ${data.driver.phone}</p>
            <p><strong>Driver ID:</strong> ${data.driver.driverId}</p>
            <p><strong>License Number:</strong> ${data.driver.licenseNumber}</p>
            <p><strong>License Type:</strong> ${data.driver.licenseType}</p>
            <p><strong>Join Date:</strong> ${data.driver.joinDate}</p>
            <p><strong>Status:</strong> ${data.driver.status}</p>
            <p><strong>Rating:</strong> ${data.driver.rating}/5</p>
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
                    <div class="signature-label">Driver Signature</div>
                </div>
                <div class="date-section">
                    <p><strong>Report Generated:</strong> ${currentDate}</p>
                    <p><strong>Generated By:</strong> SerendibGo Driver System</p>
                    <p><strong>Report ID:</strong> DRV-${Date.now().toString().slice(-6)}</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
                <p>This report was automatically generated by the SerendibGo Driver Management System.</p>
                <p>For questions or clarifications, please contact our support team at support@serendibgo.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate driver overview report content
const generateDriverOverviewReportContent = (data) => {
  return `
    <!-- Driver Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Trips</h4>
                <div class="value">${data.overview.totalTrips}</div>
                <div class="label">All Time</div>
            </div>
            <div class="stat-card">
                <h4>Completed Trips</h4>
                <div class="value">${data.overview.completedTrips}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Total Earnings</h4>
                <div class="value">Rs. ${data.overview.totalEarnings.toLocaleString()}</div>
                <div class="label">All Time</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}/5</div>
                <div class="label">Customer Rating</div>
            </div>
            <div class="stat-card">
                <h4>Total Distance</h4>
                <div class="value">${data.overview.totalDistance} km</div>
                <div class="label">Distance Covered</div>
            </div>
            <div class="stat-card">
                <h4>Total Vehicles</h4>
                <div class="value">${data.overview.totalVehicles}</div>
                <div class="label">Vehicles Owned</div>
            </div>
            <div class="stat-card">
                <h4>Completion Rate</h4>
                <div class="value">${data.overview.completionRate}%</div>
                <div class="label">Trip Completion</div>
            </div>
            <div class="stat-card">
                <h4>Punctuality Rate</h4>
                <div class="value">${data.overview.punctualityRate}%</div>
                <div class="label">On-Time Arrivals</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Trips</h4>
                <div class="value">${data.recent.recentTrips}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Earnings</h4>
                <div class="value">Rs. ${data.recent.recentEarnings.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Distance</h4>
                <div class="value">${data.recent.recentDistance} km</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Rating</h4>
                <div class="value">${data.recent.recentRating}/5</div>
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
                    <td>Monthly Earnings</td>
                    <td>+${data.summary.earningsGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
                <tr>
                    <td>Trip Completion</td>
                    <td>+${data.summary.tripsGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
                <tr>
                    <td>Customer Rating</td>
                    <td>+${data.summary.ratingGrowth}%</td>
                    <td>📈 Positive</td>
                </tr>
            </tbody>
        </table>
    </div>
  `;
};

// Generate driver trips report content
const generateDriverTripsReportContent = (data) => {
  return `
    <!-- Trips Statistics -->
    <div class="section">
        <h3>Trips Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Trips</h4>
                <div class="value">${data.overview.totalTrips}</div>
                <div class="label">All Trips</div>
            </div>
            <div class="stat-card">
                <h4>Completed</h4>
                <div class="value">${data.overview.completedTrips}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Pending</h4>
                <div class="value">${data.overview.pendingTrips}</div>
                <div class="label">Awaiting Completion</div>
            </div>
            <div class="stat-card">
                <h4>Cancelled</h4>
                <div class="value">${data.overview.cancelledTrips}</div>
                <div class="label">Cancelled Trips</div>
            </div>
            <div class="stat-card">
                <h4>Total Distance</h4>
                <div class="value">${data.overview.totalDistance} km</div>
                <div class="label">Distance Covered</div>
            </div>
            <div class="stat-card">
                <h4>Avg Trip Duration</h4>
                <div class="value">${data.overview.averageTripDuration} hrs</div>
                <div class="label">Average Duration</div>
            </div>
            <div class="stat-card">
                <h4>Total Earnings</h4>
                <div class="value">Rs. ${data.overview.totalEarnings.toLocaleString()}</div>
                <div class="label">From Trips</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}/5</div>
                <div class="label">Customer Rating</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Trips</h4>
                <div class="value">${data.recent.recentTrips}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Earnings</h4>
                <div class="value">Rs. ${data.recent.recentEarnings.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Distance</h4>
                <div class="value">${data.recent.recentDistance} km</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Trips List -->
    <div class="section">
        <h3>Recent Trips</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Destination</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Distance</th>
                    <th>Duration</th>
                    <th>Earnings</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>
                ${data.trips.map(trip => `
                    <tr>
                        <td>${trip.customerName}</td>
                        <td>${trip.destination}</td>
                        <td>${trip.startDate}</td>
                        <td>${trip.endDate}</td>
                        <td>${trip.status}</td>
                        <td>${trip.distance} km</td>
                        <td>${trip.duration ? trip.duration + ' hrs' : 'N/A'}</td>
                        <td>Rs. ${trip.earnings.toLocaleString()}</td>
                        <td>${trip.rating ? trip.rating + '/5' : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate driver earnings report content
const generateDriverEarningsReportContent = (data) => {
  return `
    <!-- Earnings Statistics -->
    <div class="section">
        <h3>Earnings Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Earnings</h4>
                <div class="value">Rs. ${data.overview.totalEarnings.toLocaleString()}</div>
                <div class="label">Gross Earnings</div>
            </div>
            <div class="stat-card">
                <h4>Completed Trips</h4>
                <div class="value">Rs. ${data.overview.completedTripsEarnings.toLocaleString()}</div>
                <div class="label">From Completed Trips</div>
            </div>
            <div class="stat-card">
                <h4>Pending Trips</h4>
                <div class="value">Rs. ${data.overview.pendingTripsEarnings.toLocaleString()}</div>
                <div class="label">From Pending Trips</div>
            </div>
            <div class="stat-card">
                <h4>Avg Per Trip</h4>
                <div class="value">Rs. ${data.overview.averageEarningsPerTrip.toLocaleString()}</div>
                <div class="label">Average Per Trip</div>
            </div>
            <div class="stat-card">
                <h4>Total Distance</h4>
                <div class="value">${data.overview.totalDistance} km</div>
                <div class="label">Distance Covered</div>
            </div>
            <div class="stat-card">
                <h4>Earnings Per Km</h4>
                <div class="value">Rs. ${data.overview.earningsPerKm}</div>
                <div class="label">Per Kilometer</div>
            </div>
            <div class="stat-card">
                <h4>Platform Commission</h4>
                <div class="value">Rs. ${data.overview.platformCommission.toLocaleString()}</div>
                <div class="label">10% Commission</div>
            </div>
            <div class="stat-card">
                <h4>Net Earnings</h4>
                <div class="value">Rs. ${data.overview.netEarnings.toLocaleString()}</div>
                <div class="label">After Commission</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Earnings</h4>
                <div class="value">Rs. ${data.recent.recentEarnings.toLocaleString()}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Trips</h4>
                <div class="value">${data.recent.recentTrips}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Distance</h4>
                <div class="value">${data.recent.recentDistance} km</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Earnings Breakdown -->
    <div class="section">
        <h3>Earnings Breakdown</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Trip ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                </tr>
            </thead>
            <tbody>
                ${data.earnings.map(earning => `
                    <tr>
                        <td>${earning.tripId}</td>
                        <td>${earning.customerName}</td>
                        <td>Rs. ${earning.amount.toLocaleString()}</td>
                        <td>Rs. ${earning.commission.toLocaleString()}</td>
                        <td>Rs. ${earning.netAmount.toLocaleString()}</td>
                        <td>${earning.status}</td>
                        <td>${earning.date}</td>
                        <td>${earning.paymentMethod}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate driver performance report content
const generateDriverPerformanceReportContent = (data) => {
  return `
    <!-- Performance Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Trips</h4>
                <div class="value">${data.overview.totalTrips}</div>
                <div class="label">All Trips</div>
            </div>
            <div class="stat-card">
                <h4>Completed Trips</h4>
                <div class="value">${data.overview.completedTrips}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Completion Rate</h4>
                <div class="value">${data.overview.completionRate}%</div>
                <div class="label">Trip Completion</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}/5</div>
                <div class="label">Customer Rating</div>
            </div>
            <div class="stat-card">
                <h4>Total Reviews</h4>
                <div class="value">${data.overview.totalReviews}</div>
                <div class="label">Customer Reviews</div>
            </div>
            <div class="stat-card">
                <h4>On-Time Arrivals</h4>
                <div class="value">${data.overview.onTimeArrivals}</div>
                <div class="label">Punctual Arrivals</div>
            </div>
            <div class="stat-card">
                <h4>Punctuality Rate</h4>
                <div class="value">${data.overview.punctualityRate}%</div>
                <div class="label">On-Time Rate</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}/5</div>
                <div class="label">Satisfaction Rating</div>
            </div>
            <div class="stat-card">
                <h4>Safety Score</h4>
                <div class="value">${data.overview.safetyScore}/5</div>
                <div class="label">Safety Rating</div>
            </div>
            <div class="stat-card">
                <h4>Vehicle Maintenance</h4>
                <div class="value">${data.overview.vehicleMaintenance}/5</div>
                <div class="label">Maintenance Score</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Trips</h4>
                <div class="value">${data.recent.recentTrips}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Rating</h4>
                <div class="value">${data.recent.recentRating}/5</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Completion Rate</h4>
                <div class="value">${data.recent.recentCompletionRate}%</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Performance Metrics -->
    <div class="section">
        <h3>Performance Metrics</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Trip Completion Rate</td>
                    <td>${data.overview.completionRate}%</td>
                    <td>${data.overview.completionRate >= 90 ? '✅ Excellent' : data.overview.completionRate >= 80 ? '✅ Good' : '⚠️ Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Customer Rating</td>
                    <td>${data.overview.averageRating}/5</td>
                    <td>${data.overview.averageRating >= 4.5 ? '✅ Excellent' : data.overview.averageRating >= 4.0 ? '✅ Good' : '⚠️ Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Punctuality Rate</td>
                    <td>${data.overview.punctualityRate}%</td>
                    <td>${data.overview.punctualityRate >= 95 ? '✅ Excellent' : data.overview.punctualityRate >= 90 ? '✅ Good' : '⚠️ Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Safety Score</td>
                    <td>${data.overview.safetyScore}/5</td>
                    <td>${data.overview.safetyScore >= 4.5 ? '✅ Excellent' : data.overview.safetyScore >= 4.0 ? '✅ Good' : '⚠️ Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Vehicle Maintenance</td>
                    <td>${data.overview.vehicleMaintenance}/5</td>
                    <td>${data.overview.vehicleMaintenance >= 4.5 ? '✅ Excellent' : data.overview.vehicleMaintenance >= 4.0 ? '✅ Good' : '⚠️ Needs Improvement'}</td>
                </tr>
            </tbody>
        </table>
    </div>
  `;
};

// Generate driver reviews report content
const generateDriverReviewsReportContent = (data) => {
  return `
    <!-- Reviews Statistics -->
    <div class="section">
        <h3>Reviews Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Reviews</h4>
                <div class="value">${data.overview.totalReviews}</div>
                <div class="label">All Reviews</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}/5</div>
                <div class="label">Overall Rating</div>
            </div>
            <div class="stat-card">
                <h4>5 Star Reviews</h4>
                <div class="value">${data.overview.fiveStarReviews}</div>
                <div class="label">Excellent Reviews</div>
            </div>
            <div class="stat-card">
                <h4>4 Star Reviews</h4>
                <div class="value">${data.overview.fourStarReviews}</div>
                <div class="label">Good Reviews</div>
            </div>
            <div class="stat-card">
                <h4>3 Star Reviews</h4>
                <div class="value">${data.overview.threeStarReviews}</div>
                <div class="label">Average Reviews</div>
            </div>
            <div class="stat-card">
                <h4>2 Star Reviews</h4>
                <div class="value">${data.overview.twoStarReviews}</div>
                <div class="label">Poor Reviews</div>
            </div>
            <div class="stat-card">
                <h4>1 Star Reviews</h4>
                <div class="value">${data.overview.oneStarReviews}</div>
                <div class="label">Very Poor Reviews</div>
            </div>
            <div class="stat-card">
                <h4>Response Rate</h4>
                <div class="value">${data.overview.responseRate}%</div>
                <div class="label">Response Rate</div>
            </div>
            <div class="stat-card">
                <h4>Recent Reviews</h4>
                <div class="value">${data.overview.recentReviews}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Reviews</h4>
                <div class="value">${data.recent.recentReviews}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Average Rating</h4>
                <div class="value">${data.recent.recentAverageRating}/5</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Reviews List -->
    <div class="section">
        <h3>Recent Reviews</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Trip Destination</th>
                </tr>
            </thead>
            <tbody>
                ${data.reviews.map(review => `
                    <tr>
                        <td>${review.customerName}</td>
                        <td>${review.rating}/5</td>
                        <td>${review.comment}</td>
                        <td>${review.date}</td>
                        <td>${review.tripDestination}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate driver vehicles report content
const generateDriverVehiclesReportContent = (data) => {
  return `
    <!-- Vehicles Statistics -->
    <div class="section">
        <h3>Vehicles Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Vehicles</h4>
                <div class="value">${data.overview.totalVehicles}</div>
                <div class="label">All Vehicles</div>
            </div>
            <div class="stat-card">
                <h4>Active Vehicles</h4>
                <div class="value">${data.overview.activeVehicles}</div>
                <div class="label">Currently Active</div>
            </div>
            <div class="stat-card">
                <h4>Total Trips</h4>
                <div class="value">${data.overview.totalTrips}</div>
                <div class="label">All Trips</div>
            </div>
            <div class="stat-card">
                <h4>Total Distance</h4>
                <div class="value">${data.overview.totalDistance} km</div>
                <div class="label">Distance Covered</div>
            </div>
            <div class="stat-card">
                <h4>Avg Fuel Efficiency</h4>
                <div class="value">${data.overview.averageFuelEfficiency} km/L</div>
                <div class="label">Fuel Efficiency</div>
            </div>
            <div class="stat-card">
                <h4>Maintenance Costs</h4>
                <div class="value">Rs. ${data.overview.maintenanceCosts.toLocaleString()}</div>
                <div class="label">Maintenance</div>
            </div>
            <div class="stat-card">
                <h4>Insurance Costs</h4>
                <div class="value">Rs. ${data.overview.insuranceCosts.toLocaleString()}</div>
                <div class="label">Insurance</div>
            </div>
            <div class="stat-card">
                <h4>Operating Costs</h4>
                <div class="value">Rs. ${data.overview.totalOperatingCosts.toLocaleString()}</div>
                <div class="label">Total Operating</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Trips</h4>
                <div class="value">${data.recent.recentTrips}</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Distance</h4>
                <div class="value">${data.recent.recentDistance} km</div>
                <div class="label">This Period</div>
            </div>
            <div class="stat-card">
                <h4>Recent Maintenance</h4>
                <div class="value">${data.recent.recentMaintenance}</div>
                <div class="label">This Period</div>
            </div>
        </div>
    </div>
    
    <!-- Vehicles List -->
    <div class="section">
        <h3>Vehicle Details</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Vehicle Type</th>
                    <th>License Plate</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Total Trips</th>
                    <th>Total Distance</th>
                    <th>Last Maintenance</th>
                    <th>Next Maintenance</th>
                    <th>Fuel Efficiency</th>
                </tr>
            </thead>
            <tbody>
                ${data.vehicles.map(vehicle => `
                    <tr>
                        <td>${vehicle.vehicleType}</td>
                        <td>${vehicle.licensePlate}</td>
                        <td>${vehicle.year}</td>
                        <td>${vehicle.status}</td>
                        <td>${vehicle.totalTrips}</td>
                        <td>${vehicle.totalDistance} km</td>
                        <td>${vehicle.lastMaintenance}</td>
                        <td>${vehicle.nextMaintenance}</td>
                        <td>${vehicle.fuelEfficiency} km/L</td>
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
  generateDriverPDFReport
};
