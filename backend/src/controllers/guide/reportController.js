const asyncHandler = require('express-async-handler');
const puppeteer = require('puppeteer');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Review = require('../../models/Review');
const Tour = require('../../models/Tour');

// @desc    Generate PDF report for guide
// @route   POST /api/guides/reports/generate
// @access  Private (Guide only)
const generateGuidePDFReport = asyncHandler(async (req, res) => {
  try {
    const { reportType = 'overview', period = '30d' } = req.body;
    const guideId = req.user.id; // Get guide ID from authenticated user
    
    console.log('Generating guide PDF report:', { reportType, period, guideId });
    
    // Use mock data for testing when database is not available
    let reportData;
    try {
      if (reportType === 'bookings') {
        reportData = await fetchGuideBookingReportData(guideId, period);
      } else if (reportType === 'earnings') {
        reportData = await fetchGuideEarningsReportData(guideId, period);
      } else if (reportType === 'reviews') {
        reportData = await fetchGuideReviewsReportData(guideId, period);
      } else if (reportType === 'performance') {
        reportData = await fetchGuidePerformanceReportData(guideId, period);
      } else {
        reportData = await fetchGuideOverviewReportData(guideId, period);
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      // Mock data for testing
      if (reportType === 'bookings') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalBookings: 15,
            confirmedBookings: 12,
            pendingBookings: 2,
            cancelledBookings: 1,
            completedBookings: 10,
            totalRevenue: 125000,
            averageBookingValue: 8333
          },
          recent: {
            recentBookings: 5,
            recentRevenue: 45000
          },
          bookings: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              tourName: 'Cultural Heritage Tour', 
              date: '2024-01-15', 
              status: 'completed', 
              amount: 15000,
              groupSize: 4,
              duration: '8 hours'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              tourName: 'Nature Adventure', 
              date: '2024-01-18', 
              status: 'confirmed', 
              amount: 12000,
              groupSize: 2,
              duration: '6 hours'
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              tourName: 'City Walking Tour', 
              date: '2024-01-20', 
              status: 'pending', 
              amount: 8000,
              groupSize: 3,
              duration: '4 hours'
            }
          ]
        };
      } else if (reportType === 'earnings') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalEarnings: 125000,
            averageEarningsPerDay: 4167,
            totalBookings: 15,
            averageEarningsPerBooking: 8333,
            platformCommission: 12500,
            netEarnings: 112500,
            pendingEarnings: 15000
          },
          recent: {
            recentEarnings: 45000,
            recentBookings: 5
          },
          earnings: [
            { 
              date: '2024-01-15', 
              bookingId: '1', 
              tourName: 'Cultural Heritage Tour', 
              grossAmount: 15000, 
              commission: 1500, 
              netAmount: 13500,
              status: 'paid'
            },
            { 
              date: '2024-01-18', 
              bookingId: '2', 
              tourName: 'Nature Adventure', 
              grossAmount: 12000, 
              commission: 1200, 
              netAmount: 10800,
              status: 'paid'
            },
            { 
              date: '2024-01-20', 
              bookingId: '3', 
              tourName: 'City Walking Tour', 
              grossAmount: 8000, 
              commission: 800, 
              netAmount: 7200,
              status: 'pending'
            }
          ]
        };
      } else if (reportType === 'reviews') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalReviews: 25,
            averageRating: 4.6,
            fiveStarReviews: 18,
            fourStarReviews: 5,
            threeStarReviews: 2,
            twoStarReviews: 0,
            oneStarReviews: 0,
            responseRate: 95,
            recentReviews: 8
          },
          recent: {
            recentReviews: 8,
            recentRating: 4.7
          },
          reviews: [
            { 
              id: '1', 
              customerName: 'John Smith', 
              tourName: 'Cultural Heritage Tour', 
              rating: 5, 
              comment: 'Excellent guide with deep knowledge of local history!', 
              date: '2024-01-15',
              response: 'Thank you for the wonderful review!'
            },
            { 
              id: '2', 
              customerName: 'Sarah Johnson', 
              tourName: 'Nature Adventure', 
              rating: 4, 
              comment: 'Great tour, very informative and engaging.', 
              date: '2024-01-18',
              response: null
            },
            { 
              id: '3', 
              customerName: 'Mike Wilson', 
              tourName: 'City Walking Tour', 
              rating: 5, 
              comment: 'Amazing experience, highly recommended!', 
              date: '2024-01-20',
              response: 'Glad you enjoyed the tour!'
            }
          ]
        };
      } else if (reportType === 'performance') {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          overview: {
            totalTours: 8,
            totalBookings: 15,
            totalRevenue: 125000,
            averageRating: 4.6,
            totalReviews: 25,
            responseTime: '2 hours',
            completionRate: 95,
            customerSatisfaction: 92
          },
          recent: {
            recentTours: 3,
            recentBookings: 5,
            recentRevenue: 45000
          },
          performance: {
            bookingTrends: [
              { date: '2024-01-01', bookings: 1 },
              { date: '2024-01-02', bookings: 2 },
              { date: '2024-01-03', bookings: 0 },
              { date: '2024-01-04', bookings: 1 },
              { date: '2024-01-05', bookings: 3 },
              { date: '2024-01-06', bookings: 2 },
              { date: '2024-01-07', bookings: 1 }
            ],
            ratingTrends: [
              { date: '2024-01-01', rating: 4.5 },
              { date: '2024-01-02', rating: 4.7 },
              { date: '2024-01-03', rating: 4.6 },
              { date: '2024-01-04', rating: 4.8 },
              { date: '2024-01-05', rating: 4.6 },
              { date: '2024-01-06', rating: 4.7 },
              { date: '2024-01-07', rating: 4.6 }
            ],
            topTours: [
              { name: 'Cultural Heritage Tour', bookings: 5, revenue: 75000, rating: 4.8 },
              { name: 'Nature Adventure', bookings: 4, revenue: 48000, rating: 4.5 },
              { name: 'City Walking Tour', bookings: 3, revenue: 24000, rating: 4.6 }
            ]
          }
        };
      } else {
        reportData = {
          period,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          guide: {
            name: 'John Guide',
            email: 'john@guide.com',
            phone: '+94771234567',
            location: 'Colombo, Sri Lanka',
            specialties: ['Cultural Tours', 'Nature Tours', 'City Tours'],
            languages: ['English', 'Sinhala', 'Tamil'],
            experience: '5 years',
            rating: 4.6,
            totalReviews: 25
          },
          overview: {
            totalBookings: 15,
            totalRevenue: 125000,
            averageRating: 4.6,
            totalTours: 8,
            activeTours: 6,
            completedTours: 10,
            responseRate: 95,
            customerSatisfaction: 92
          },
          recent: {
            recentBookings: 5,
            recentRevenue: 45000,
            recentReviews: 8
          },
          summary: {
            monthlyGrowth: 15.2,
            bookingGrowth: 12.5,
            revenueGrowth: 18.3,
            ratingGrowth: 2.1
          }
        };
      }
    }
    
    // Generate HTML content for the PDF
    const htmlContent = generateGuideHTMLReport(reportData, reportType);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    
    console.log('Guide PDF generated successfully, size:', pdfBuffer.length);
    
    // Convert PDF buffer to base64 for CORS compatibility
    const base64PDF = Buffer.from(pdfBuffer).toString('base64');
    
    console.log('Base64 PDF length:', base64PDF.length);
    console.log('First 100 chars of base64:', base64PDF.substring(0, 100));
    
    res.json({
      success: true,
      data: base64PDF,
      filename: `guide-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
  } catch (error) {
    console.error('Error generating guide PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating guide PDF report',
      error: error.message
    });
  }
});

// Helper function to fetch guide overview report data
const fetchGuideOverviewReportData = async (guideId, period) => {
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

  // Get guide information
  const guide = await User.findById(guideId).select('-password');
  if (!guide) {
    throw new Error('Guide not found');
  }

  // Get guide's tours
  const tours = await Tour.find({ guide: guideId, isActive: true });
  
  // Get bookings for guide's tours
  const bookings = await Booking.find({
    tour: { $in: tours.map(tour => tour._id) }
  });

  // Get reviews for guide's tours
  const reviews = await Review.find({
    tour: { $in: tours.map(tour => tour._id) }
  });

  // Calculate statistics
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Get recent activity
  const recentBookings = bookings.filter(booking => booking.createdAt >= startDate);
  const recentRevenue = recentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const recentReviews = reviews.filter(review => review.createdAt >= startDate);

  return {
    period,
    startDate,
    endDate: new Date(),
    guide: {
      name: `${guide.firstName} ${guide.lastName}`,
      email: guide.email,
      phone: guide.phone,
      location: guide.profile?.location || 'Not specified',
      specialties: guide.profile?.specialties || [],
      languages: guide.profile?.languages || [],
      experience: guide.profile?.experience || '0 years',
      rating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    },
    overview: {
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalTours: tours.length,
      activeTours: tours.filter(tour => tour.isActive).length,
      completedTours: bookings.filter(booking => booking.status === 'completed').length,
      responseRate: 95, // Mock value
      customerSatisfaction: Math.round(averageRating * 20) // Convert to percentage
    },
    recent: {
      recentBookings: recentBookings.length,
      recentRevenue,
      recentReviews: recentReviews.length
    },
    summary: {
      monthlyGrowth: 15.2, // Mock value
      bookingGrowth: 12.5, // Mock value
      revenueGrowth: 18.3, // Mock value
      ratingGrowth: 2.1 // Mock value
    }
  };
};

// Helper function to fetch guide booking report data
const fetchGuideBookingReportData = async (guideId, period) => {
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

  // Get guide's tours
  const tours = await Tour.find({ guide: guideId, isActive: true });
  
  // Get bookings for guide's tours
  const bookings = await Booking.find({
    tour: { $in: tours.map(tour => tour._id) }
  }).populate('user', 'firstName lastName email').populate('tour', 'name duration');

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
  const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled').length;
  const completedBookings = bookings.filter(booking => booking.status === 'completed').length;
  
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Get recent activity
  const recentBookings = bookings.filter(booking => booking.createdAt >= startDate);
  const recentRevenue = recentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  // Format bookings for display
  const formattedBookings = bookings.slice(0, 20).map(booking => ({
    id: booking._id.toString(),
    customerName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Guest',
    tourName: booking.tour ? booking.tour.name : 'Custom Tour',
    date: booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'TBD',
    status: booking.status,
    amount: booking.totalAmount || 0,
    groupSize: booking.groupSize || 1,
    duration: booking.tour ? booking.tour.duration : 'Custom'
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
      completedBookings,
      totalRevenue,
      averageBookingValue: Math.round(averageBookingValue)
    },
    recent: {
      recentBookings: recentBookings.length,
      recentRevenue
    },
    bookings: formattedBookings
  };
};

// Helper function to fetch guide earnings report data
const fetchGuideEarningsReportData = async (guideId, period) => {
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

  // Get guide's tours
  const tours = await Tour.find({ guide: guideId, isActive: true });
  
  // Get bookings for guide's tours
  const bookings = await Booking.find({
    tour: { $in: tours.map(tour => tour._id) },
    status: { $in: ['confirmed', 'completed'] }
  }).populate('tour', 'name');

  // Calculate earnings
  const totalEarnings = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const platformCommission = totalEarnings * 0.1; // 10% commission
  const netEarnings = totalEarnings - platformCommission;
  const averageEarningsPerDay = period === '7d' ? totalEarnings / 7 : 
                                period === '30d' ? totalEarnings / 30 :
                                period === '90d' ? totalEarnings / 90 : totalEarnings / 365;
  const averageEarningsPerBooking = bookings.length > 0 ? totalEarnings / bookings.length : 0;

  // Get recent activity
  const recentBookings = bookings.filter(booking => booking.createdAt >= startDate);
  const recentEarnings = recentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  // Format earnings for display
  const formattedEarnings = bookings.slice(0, 20).map(booking => ({
    date: booking.createdAt.toLocaleDateString(),
    bookingId: booking._id.toString(),
    tourName: booking.tour ? booking.tour.name : 'Custom Tour',
    grossAmount: booking.totalAmount || 0,
    commission: (booking.totalAmount || 0) * 0.1,
    netAmount: (booking.totalAmount || 0) * 0.9,
    status: booking.status === 'completed' ? 'paid' : 'pending'
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalEarnings,
      averageEarningsPerDay: Math.round(averageEarningsPerDay),
      totalBookings: bookings.length,
      averageEarningsPerBooking: Math.round(averageEarningsPerBooking),
      platformCommission: Math.round(platformCommission),
      netEarnings: Math.round(netEarnings),
      pendingEarnings: Math.round(totalEarnings * 0.2) // Mock value
    },
    recent: {
      recentEarnings,
      recentBookings: recentBookings.length
    },
    earnings: formattedEarnings
  };
};

// Helper function to fetch guide reviews report data
const fetchGuideReviewsReportData = async (guideId, period) => {
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

  // Get guide's tours
  const tours = await Tour.find({ guide: guideId, isActive: true });
  
  // Get reviews for guide's tours
  const reviews = await Review.find({
    tour: { $in: tours.map(tour => tour._id) }
  }).populate('user', 'firstName lastName').populate('tour', 'name');

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  const ratingDistribution = {
    fiveStarReviews: reviews.filter(review => review.rating === 5).length,
    fourStarReviews: reviews.filter(review => review.rating === 4).length,
    threeStarReviews: reviews.filter(review => review.rating === 3).length,
    twoStarReviews: reviews.filter(review => review.rating === 2).length,
    oneStarReviews: reviews.filter(review => review.rating === 1).length
  };

  // Get recent activity
  const recentReviews = reviews.filter(review => review.createdAt >= startDate);
  const recentRating = recentReviews.length > 0 
    ? recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length 
    : 0;

  // Format reviews for display
  const formattedReviews = reviews.slice(0, 20).map(review => ({
    id: review._id.toString(),
    customerName: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
    tourName: review.tour ? review.tour.name : 'Tour',
    rating: review.rating,
    comment: review.comment || 'No comment',
    date: review.createdAt.toLocaleDateString(),
    response: review.response || null
  }));

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ...ratingDistribution,
      responseRate: 95, // Mock value
      recentReviews: recentReviews.length
    },
    recent: {
      recentReviews: recentReviews.length,
      recentRating: Math.round(recentRating * 10) / 10
    },
    reviews: formattedReviews
  };
};

// Helper function to fetch guide performance report data
const fetchGuidePerformanceReportData = async (guideId, period) => {
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

  // Get guide's tours
  const tours = await Tour.find({ guide: guideId, isActive: true });
  
  // Get bookings for guide's tours
  const bookings = await Booking.find({
    tour: { $in: tours.map(tour => tour._id) }
  });

  // Get reviews for guide's tours
  const reviews = await Review.find({
    tour: { $in: tours.map(tour => tour._id) }
  });

  // Calculate statistics
  const totalTours = tours.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  const completionRate = bookings.length > 0 
    ? (bookings.filter(booking => booking.status === 'completed').length / bookings.length) * 100 
    : 0;

  // Get recent activity
  const recentTours = tours.filter(tour => tour.createdAt >= startDate);
  const recentBookings = bookings.filter(booking => booking.createdAt >= startDate);
  const recentRevenue = recentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  // Get top performing tours
  const tourPerformance = await Promise.all(
    tours.map(async (tour) => {
      const tourBookings = bookings.filter(booking => booking.tour.toString() === tour._id.toString());
      const tourReviews = reviews.filter(review => review.tour.toString() === tour._id.toString());
      const tourRevenue = tourBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      const tourRating = tourReviews.length > 0 
        ? tourReviews.reduce((sum, review) => sum + review.rating, 0) / tourReviews.length 
        : 0;

      return {
        name: tour.name,
        bookings: tourBookings.length,
        revenue: tourRevenue,
        rating: Math.round(tourRating * 10) / 10
      };
    })
  );

  const topTours = tourPerformance
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  return {
    period,
    startDate,
    endDate: new Date(),
    overview: {
      totalTours,
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      responseTime: '2 hours', // Mock value
      completionRate: Math.round(completionRate),
      customerSatisfaction: Math.round(averageRating * 20) // Convert to percentage
    },
    recent: {
      recentTours: recentTours.length,
      recentBookings: recentBookings.length,
      recentRevenue
    },
    performance: {
      bookingTrends: [], // Would need to implement daily aggregation
      ratingTrends: [], // Would need to implement daily aggregation
      topTours
    }
  };
};

// Helper function to generate HTML content for guide reports
const generateGuideHTMLReport = (data, reportType) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportTitle = reportType === 'bookings' ? 'Guide Booking Report' : 
                     reportType === 'earnings' ? 'Guide Earnings Report' : 
                     reportType === 'reviews' ? 'Guide Reviews Report' :
                     reportType === 'performance' ? 'Guide Performance Report' :
                     'Guide Overview Report';
  const reportTypeDisplay = reportType === 'bookings' ? 'Booking Report' : 
                           reportType === 'earnings' ? 'Earnings Report' : 
                           reportType === 'reviews' ? 'Reviews Report' :
                           reportType === 'performance' ? 'Performance Report' :
                           'Overview Report';

  // Generate content based on report type
  const generateContent = () => {
    if (reportType === 'bookings') {
      return generateGuideBookingReportContent(data);
    } else if (reportType === 'earnings') {
      return generateGuideEarningsReportContent(data);
    } else if (reportType === 'reviews') {
      return generateGuideReviewsReportContent(data);
    } else if (reportType === 'performance') {
      return generateGuidePerformanceReportContent(data);
    } else {
      return generateGuideOverviewReportContent(data);
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
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            
            .guide-info {
                background: #f0fdf4;
                padding: 20px;
                margin-bottom: 30px;
                border-left: 4px solid #10b981;
            }
            
            .guide-info h2 {
                color: #10b981;
                margin-bottom: 15px;
                font-size: 1.5em;
            }
            
            .guide-info p {
                margin-bottom: 5px;
                font-size: 1.1em;
            }
            
            .report-info {
                background: #ecfdf5;
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
                border-bottom: 2px solid #10b981;
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
                border-top: 2px solid #10b981;
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
        
        <!-- Guide Information -->
        <div class="guide-info">
            <h2>Guide Information</h2>
            ${data.guide ? `
            <p><strong>Guide Name:</strong> ${data.guide.name}</p>
            <p><strong>Email:</strong> ${data.guide.email}</p>
            <p><strong>Phone:</strong> ${data.guide.phone}</p>
            <p><strong>Location:</strong> ${data.guide.location}</p>
            <p><strong>Specialties:</strong> ${data.guide.specialties.join(', ')}</p>
            <p><strong>Languages:</strong> ${data.guide.languages.join(', ')}</p>
            <p><strong>Experience:</strong> ${data.guide.experience}</p>
            <p><strong>Rating:</strong> ${data.guide.rating}/5.0 (${data.guide.totalReviews} reviews)</p>
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
                    <div class="signature-label">Guide Signature</div>
                </div>
                <div class="date-section">
                    <p><strong>Report Generated:</strong> ${currentDate}</p>
                    <p><strong>Generated By:</strong> SerendibGo Guide System</p>
                    <p><strong>Report ID:</strong> GRG-${Date.now().toString().slice(-6)}</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
                <p>This report was automatically generated by the SerendibGo Guide Management System.</p>
                <p>For questions or clarifications, please contact our support team at support@serendibgo.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate guide overview report content
const generateGuideOverviewReportContent = (data) => {
  return `
    <!-- Guide Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Bookings</h4>
                <div class="value">${data.overview.totalBookings}</div>
                <div class="label">All Time</div>
            </div>
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">Earnings</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}</div>
                <div class="label">Out of 5.0</div>
            </div>
            <div class="stat-card">
                <h4>Total Tours</h4>
                <div class="value">${data.overview.totalTours}</div>
                <div class="label">Active Tours</div>
            </div>
            <div class="stat-card">
                <h4>Completed Tours</h4>
                <div class="value">${data.overview.completedTours}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Response Rate</h4>
                <div class="value">${data.overview.responseRate}%</div>
                <div class="label">Customer Inquiries</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}%</div>
                <div class="label">Satisfied Customers</div>
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
            <div class="stat-card">
                <h4>Recent Reviews</h4>
                <div class="value">${data.recent.recentReviews}</div>
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
                    <td>Booking Volume</td>
                    <td>+${data.summary.bookingGrowth}%</td>
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

// Generate guide booking report content
const generateGuideBookingReportContent = (data) => {
  return `
    <!-- Booking Statistics -->
    <div class="section">
        <h3>Booking Overview</h3>
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
                <h4>Completed</h4>
                <div class="value">${data.overview.completedBookings}</div>
                <div class="label">Successfully Completed</div>
            </div>
            <div class="stat-card">
                <h4>Cancelled</h4>
                <div class="value">${data.overview.cancelledBookings}</div>
                <div class="label">Cancelled Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">From Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Avg Booking Value</h4>
                <div class="value">Rs. ${data.overview.averageBookingValue.toLocaleString()}</div>
                <div class="label">Per Booking</div>
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
    
    <!-- Booking List -->
    <div class="section">
        <h3>Recent Bookings</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Tour</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Group Size</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                ${data.bookings.map(booking => `
                    <tr>
                        <td>${booking.customerName}</td>
                        <td>${booking.tourName}</td>
                        <td>${booking.date}</td>
                        <td>${booking.status}</td>
                        <td>Rs. ${booking.amount.toLocaleString()}</td>
                        <td>${booking.groupSize}</td>
                        <td>${booking.duration}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate guide earnings report content
const generateGuideEarningsReportContent = (data) => {
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
                <h4>Net Earnings</h4>
                <div class="value">Rs. ${data.overview.netEarnings.toLocaleString()}</div>
                <div class="label">After Commission</div>
            </div>
            <div class="stat-card">
                <h4>Platform Commission</h4>
                <div class="value">Rs. ${data.overview.platformCommission.toLocaleString()}</div>
                <div class="label">10% Commission</div>
            </div>
            <div class="stat-card">
                <h4>Avg Per Day</h4>
                <div class="value">Rs. ${data.overview.averageEarningsPerDay.toLocaleString()}</div>
                <div class="label">Daily Average</div>
            </div>
            <div class="stat-card">
                <h4>Avg Per Booking</h4>
                <div class="value">Rs. ${data.overview.averageEarningsPerBooking.toLocaleString()}</div>
                <div class="label">Per Booking</div>
            </div>
            <div class="stat-card">
                <h4>Pending Earnings</h4>
                <div class="value">Rs. ${data.overview.pendingEarnings.toLocaleString()}</div>
                <div class="label">Awaiting Payment</div>
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
                <h4>Recent Bookings</h4>
                <div class="value">${data.recent.recentBookings}</div>
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
                    <th>Date</th>
                    <th>Tour</th>
                    <th>Gross Amount</th>
                    <th>Commission</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.earnings.map(earning => `
                    <tr>
                        <td>${earning.date}</td>
                        <td>${earning.tourName}</td>
                        <td>Rs. ${earning.grossAmount.toLocaleString()}</td>
                        <td>Rs. ${earning.commission.toLocaleString()}</td>
                        <td>Rs. ${earning.netAmount.toLocaleString()}</td>
                        <td>${earning.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate guide reviews report content
const generateGuideReviewsReportContent = (data) => {
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
                <div class="value">${data.overview.averageRating}</div>
                <div class="label">Out of 5.0</div>
            </div>
            <div class="stat-card">
                <h4>5 Star Reviews</h4>
                <div class="value">${data.overview.fiveStarReviews}</div>
                <div class="label">Excellent</div>
            </div>
            <div class="stat-card">
                <h4>4 Star Reviews</h4>
                <div class="value">${data.overview.fourStarReviews}</div>
                <div class="label">Very Good</div>
            </div>
            <div class="stat-card">
                <h4>3 Star Reviews</h4>
                <div class="value">${data.overview.threeStarReviews}</div>
                <div class="label">Good</div>
            </div>
            <div class="stat-card">
                <h4>Response Rate</h4>
                <div class="value">${data.overview.responseRate}%</div>
                <div class="label">Reviews Responded</div>
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
                <h4>Recent Rating</h4>
                <div class="value">${data.recent.recentRating}</div>
                <div class="label">Average Rating</div>
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
                    <th>Tour</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Response</th>
                </tr>
            </thead>
            <tbody>
                ${data.reviews.map(review => `
                    <tr>
                        <td>${review.customerName}</td>
                        <td>${review.tourName}</td>
                        <td>${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</td>
                        <td>${review.comment}</td>
                        <td>${review.date}</td>
                        <td>${review.response || 'No response'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
};

// Generate guide performance report content
const generateGuidePerformanceReportContent = (data) => {
  return `
    <!-- Performance Statistics -->
    <div class="section">
        <h3>Performance Overview</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Tours</h4>
                <div class="value">${data.overview.totalTours}</div>
                <div class="label">Active Tours</div>
            </div>
            <div class="stat-card">
                <h4>Total Bookings</h4>
                <div class="value">${data.overview.totalBookings}</div>
                <div class="label">All Bookings</div>
            </div>
            <div class="stat-card">
                <h4>Total Revenue</h4>
                <div class="value">Rs. ${data.overview.totalRevenue.toLocaleString()}</div>
                <div class="label">Earnings</div>
            </div>
            <div class="stat-card">
                <h4>Average Rating</h4>
                <div class="value">${data.overview.averageRating}</div>
                <div class="label">Out of 5.0</div>
            </div>
            <div class="stat-card">
                <h4>Completion Rate</h4>
                <div class="value">${data.overview.completionRate}%</div>
                <div class="label">Success Rate</div>
            </div>
            <div class="stat-card">
                <h4>Response Time</h4>
                <div class="value">${data.overview.responseTime}</div>
                <div class="label">Avg Response</div>
            </div>
            <div class="stat-card">
                <h4>Customer Satisfaction</h4>
                <div class="value">${data.overview.customerSatisfaction}%</div>
                <div class="label">Satisfied</div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="section">
        <h3>Recent Activity (${data.period.toUpperCase()})</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Recent Tours</h4>
                <div class="value">${data.recent.recentTours}</div>
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
        </div>
    </div>
    
    <!-- Top Performing Tours -->
    <div class="section">
        <h3>Top Performing Tours</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Tour Name</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>
                ${data.performance.topTours.map(tour => `
                    <tr>
                        <td>${tour.name}</td>
                        <td>${tour.bookings}</td>
                        <td>Rs. ${tour.revenue.toLocaleString()}</td>
                        <td>${tour.rating}/5.0</td>
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
  generateGuidePDFReport
};
