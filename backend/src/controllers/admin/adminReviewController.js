const asyncHandler = require('express-async-handler');
const puppeteer = require('puppeteer');
const Review = require('../../models/Review');
const HotelReview = require('../../models/hotels/HotelReview');
const CustomTripReview = require('../../models/CustomTripReview');
const VehicleBooking = require('../../models/vehicles/VehicleBooking');
const User = require('../../models/User');
const Hotel = require('../../models/hotels/Hotel');
const CustomTrip = require('../../models/CustomTrip');
const Tour = require('../../models/Tour');
const Vehicle = require('../../models/Vehicle');

// @desc    Get all reviews for admin dashboard
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
const getAllReviews = asyncHandler(async (req, res) => {
  try {
    console.log('Admin Review Controller: Getting all reviews with params:', req.query);
    
    const { 
      page = 1, 
      limit = 20, 
      type = 'all', 
      status = 'all',
      rating = 'all',
      search = '',
      sortBy = 'newest'
    } = req.query;

    const skip = (page - 1) * limit;
    let reviews = [];
    let totalCount = 0;

    // Build base query
    const baseQuery = {};
    
    // Add search filter
    if (search) {
      baseQuery.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Add rating filter
    if (rating !== 'all') {
      if (type === 'hotel') {
        baseQuery['rating.overall'] = parseInt(rating);
      } else {
        baseQuery.rating = parseInt(rating);
      }
    }

    // Add status filter
    if (status !== 'all') {
      if (status === 'active') {
        baseQuery.isActive = true;
      } else if (status === 'inactive') {
        baseQuery.isActive = false;
      }
    }

    // Get reviews based on type
    if (type === 'hotel' || type === 'all') {
      const hotelReviews = await HotelReview.find(baseQuery)
        .populate('user', 'firstName lastName email avatar')
        .populate('hotel', 'name location')
        .populate('booking', 'checkIn checkOut')
        .sort(sortBy === 'newest' ? { createdAt: -1 } : { createdAt: 1 })
        .skip(type === 'all' ? skip : 0)
        .limit(type === 'all' ? limit : 0);

      if (type === 'hotel') {
        reviews = hotelReviews;
        totalCount = await HotelReview.countDocuments(baseQuery);
      } else {
        reviews = [...reviews, ...hotelReviews.map(review => ({
          ...review.toObject(),
          reviewType: 'hotel',
          reviewId: review._id
        }))];
      }
    }

    if (type === 'guide' || type === 'all') {
      const guideReviews = await Review.find(baseQuery)
        .populate('user', 'firstName lastName email avatar')
        .populate('guide', 'firstName lastName email')
        .populate('tour', 'title')
        .populate('booking', 'startDate endDate')
        .sort(sortBy === 'newest' ? { createdAt: -1 } : { createdAt: 1 })
        .skip(type === 'all' ? skip : 0)
        .limit(type === 'all' ? limit : 0);

      if (type === 'guide') {
        reviews = guideReviews;
        totalCount = await Review.countDocuments(baseQuery);
      } else {
        reviews = [...reviews, ...guideReviews.map(review => ({
          ...review.toObject(),
          reviewType: 'guide',
          reviewId: review._id
        }))];
      }
    }

    if (type === 'custom-trip' || type === 'all') {
      const customTripReviews = await CustomTripReview.find(baseQuery)
        .populate('user', 'firstName lastName email avatar')
        .populate('customTrip', 'title destination')
        .sort(sortBy === 'newest' ? { createdAt: -1 } : { createdAt: 1 })
        .skip(type === 'all' ? skip : 0)
        .limit(type === 'all' ? limit : 0);

      if (type === 'custom-trip') {
        reviews = customTripReviews;
        totalCount = await CustomTripReview.countDocuments(baseQuery);
      } else {
        reviews = [...reviews, ...customTripReviews.map(review => ({
          ...review.toObject(),
          reviewType: 'custom-trip',
          reviewId: review._id
        }))];
      }
    }

    if (type === 'vehicle' || type === 'all') {
      // Build query for vehicle bookings with reviews
      const vehicleQuery = {
        ...baseQuery,
        'review.rating': { $exists: true, $ne: null },
        'review.comment': { $exists: true, $ne: '' }
      };

      // Adjust rating filter for vehicle reviews
      if (rating !== 'all') {
        vehicleQuery['review.rating'] = parseInt(rating);
      }

      const vehicleBookings = await VehicleBooking.find(vehicleQuery)
        .populate('user', 'firstName lastName email avatar')
        .populate('vehicle', 'make model year licensePlate')
        .populate('driver.assignedDriver', 'firstName lastName email')
        .sort(sortBy === 'newest' ? { 'review.reviewedAt': -1 } : { 'review.reviewedAt': 1 })
        .skip(type === 'all' ? skip : 0)
        .limit(type === 'all' ? limit : 0);

      if (type === 'vehicle') {
        reviews = vehicleBookings.map(booking => ({
          ...booking.toObject(),
          reviewType: 'vehicle',
          reviewId: booking._id,
          rating: booking.review?.rating,
          comment: booking.review?.comment,
          createdAt: booking.review?.reviewedAt || booking.createdAt,
          user: booking.user,
          vehicle: booking.vehicle,
          driver: booking.driver?.assignedDriver
        }));
        totalCount = await VehicleBooking.countDocuments(vehicleQuery);
      } else {
        reviews = [...reviews, ...vehicleBookings.map(booking => ({
          ...booking.toObject(),
          reviewType: 'vehicle',
          reviewId: booking._id,
          rating: booking.review?.rating,
          comment: booking.review?.comment,
          createdAt: booking.review?.reviewedAt || booking.createdAt,
          user: booking.user,
          vehicle: booking.vehicle,
          driver: booking.driver?.assignedDriver
        }))];
      }
    }

    // Sort combined results if type is 'all'
    if (type === 'all') {
      reviews.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
      });
      
      // Apply pagination to combined results
      const startIndex = skip;
      const endIndex = skip + parseInt(limit);
      reviews = reviews.slice(startIndex, endIndex);
      
      // Get total count for all types
      const hotelCount = await HotelReview.countDocuments(baseQuery);
      const guideCount = await Review.countDocuments(baseQuery);
      const customTripCount = await CustomTripReview.countDocuments(baseQuery);
      const vehicleCount = await VehicleBooking.countDocuments({
        ...baseQuery,
        'review.rating': { $exists: true, $ne: null },
        'review.comment': { $exists: true, $ne: '' }
      });
      totalCount = hotelCount + guideCount + customTripCount + vehicleCount;
    }

    // Get review statistics
    const stats = await calculateReviewStatistics();

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalReviews: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('Admin Review Controller: Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message
    });
  }
});

// @desc    Get review statistics for admin dashboard
// @route   GET /api/admin/reviews/stats
// @access  Private (Admin only)
const getReviewStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = await calculateReviewStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin Review Controller: Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review statistics',
      error: error.message
    });
  }
});

// Helper function to get review statistics
const calculateReviewStatistics = async () => {
  try {
    console.log('Calculating review statistics...');
    
    // Hotel reviews stats
    const hotelStats = await HotelReview.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$rating.overall' },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }}
    ]);
    console.log('Hotel stats:', hotelStats);

    // Guide reviews stats
    const guideStats = await Review.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }}
    ]);
    console.log('Guide stats:', guideStats);

    // Custom trip reviews stats
    const customTripStats = await CustomTripReview.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }}
    ]);
    console.log('Custom trip stats:', customTripStats);

    // Vehicle booking reviews stats
    const vehicleStats = await VehicleBooking.aggregate([
      { $match: { 'review.rating': { $exists: true, $ne: null } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$review.rating' },
        ratingDistribution: {
          $push: '$review.rating'
        }
      }}
    ]);
    console.log('Vehicle stats:', vehicleStats);

    // Calculate rating distribution
    const calculateRatingDistribution = (ratings) => {
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      if (ratings && Array.isArray(ratings)) {
        ratings.forEach(rating => {
          if (rating >= 1 && rating <= 5) {
            distribution[Math.round(rating)]++;
          }
        });
      }
      return distribution;
    };

    const hotelDistribution = hotelStats[0] ? calculateRatingDistribution(hotelStats[0].ratingDistribution) : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const guideDistribution = guideStats[0] ? calculateRatingDistribution(guideStats[0].ratingDistribution) : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const customTripDistribution = customTripStats[0] ? calculateRatingDistribution(customTripStats[0].ratingDistribution) : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const vehicleDistribution = vehicleStats[0] ? calculateRatingDistribution(vehicleStats[0].ratingDistribution) : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const result = {
      totalReviews: (hotelStats[0]?.total || 0) + (guideStats[0]?.total || 0) + (customTripStats[0]?.total || 0) + (vehicleStats[0]?.total || 0),
      hotelReviews: {
        total: hotelStats[0]?.total || 0,
        averageRating: hotelStats[0]?.averageRating || 0,
        ratingDistribution: hotelDistribution
      },
      guideReviews: {
        total: guideStats[0]?.total || 0,
        averageRating: guideStats[0]?.averageRating || 0,
        ratingDistribution: guideDistribution
      },
      customTripReviews: {
        total: customTripStats[0]?.total || 0,
        averageRating: customTripStats[0]?.averageRating || 0,
        ratingDistribution: customTripDistribution
      },
      vehicleReviews: {
        total: vehicleStats[0]?.total || 0,
        averageRating: vehicleStats[0]?.averageRating || 0,
        ratingDistribution: vehicleDistribution
      }
    };
    
    console.log('Final statistics result:', result);
    return result;
  } catch (error) {
    console.error('Error calculating review statistics:', error);
    return {
      totalReviews: 0,
      hotelReviews: { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      guideReviews: { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      customTripReviews: { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      vehicleReviews: { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
    };
  }
};

// @desc    Update review status (approve/reject/activate/deactivate)
// @route   PUT /api/admin/reviews/:reviewId/status
// @access  Private (Admin only)
const updateReviewStatus = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, reviewType } = req.body; // status: 'active', 'inactive', 'approved', 'rejected'

    let review;
    
    // Find review based on type
    switch (reviewType) {
      case 'hotel':
        review = await HotelReview.findById(reviewId);
        break;
      case 'guide':
        review = await Review.findById(reviewId);
        break;
      case 'custom-trip':
        review = await CustomTripReview.findById(reviewId);
        break;
      case 'vehicle':
        review = await VehicleBooking.findById(reviewId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid review type'
        });
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update status based on action
    if (status === 'active') {
      review.isActive = true;
    } else if (status === 'inactive') {
      review.isActive = false;
    } else if (status === 'approved') {
      review.isActive = true;
      review.status = 'approved';
    } else if (status === 'rejected') {
      review.isActive = false;
      review.status = 'rejected';
    }

    review.updatedAt = new Date();
    await review.save();

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: review
    });

  } catch (error) {
    console.error('Admin Review Controller: Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
      error: error.message
    });
  }
});

// @desc    Delete review (admin only)
// @route   DELETE /api/admin/reviews/:reviewId
// @access  Private (Admin only)
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reviewType } = req.body;

    let review;
    
    // Find review based on type
    switch (reviewType) {
      case 'hotel':
        review = await HotelReview.findById(reviewId);
        break;
      case 'guide':
        review = await Review.findById(reviewId);
        break;
      case 'custom-trip':
        review = await CustomTripReview.findById(reviewId);
        break;
      case 'vehicle':
        review = await VehicleBooking.findById(reviewId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid review type'
        });
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Admin Review Controller: Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

// @desc    Export reviews to PDF
// @route   POST /api/admin/reviews/export
// @access  Private (Admin only)
const exportReviewsToPDF = asyncHandler(async (req, res) => {
  try {
    console.log('Generating reviews PDF export...');
    
    // Calculate date range for latest month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    console.log('Date range:', { startDate, endDate });
    
    // Fetch reviews from latest month
    const latestMonthReviews = await fetchLatestMonthReviews(startDate, endDate);
    
    // Get review statistics
    const stats = await calculateReviewStatistics();
    
    // Generate HTML content for the PDF
    const htmlContent = generateReviewsHTMLReport(latestMonthReviews, stats, startDate, endDate);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    
    console.log('Reviews PDF generated successfully, size:', pdfBuffer.length);
    
    // Convert PDF buffer to base64 for CORS compatibility
    const base64PDF = Buffer.from(pdfBuffer).toString('base64');
    
    res.json({
      success: true,
      data: base64PDF,
      filename: `serendibgo-reviews-${new Date().toISOString().split('T')[0]}.pdf`
    });
  } catch (error) {
    console.error('Error generating reviews PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reviews PDF',
      error: error.message
    });
  }
});

// Helper function to fetch reviews from latest month
const fetchLatestMonthReviews = async (startDate, endDate) => {
  try {
    const reviews = [];
    
    // Fetch guide reviews from latest month
    const guideReviews = await Review.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isActive: true
    })
      .populate('user', 'firstName lastName email')
      .populate('tour', 'title')
      .populate('guide', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    reviews.push(...guideReviews.map(review => ({
      ...review.toObject(),
      reviewType: 'guide',
      reviewId: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
      tour: review.tour,
      guide: review.guide
    })));
    
    // Fetch hotel reviews from latest month
    const hotelReviews = await HotelReview.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isActive: true
    })
      .populate('user', 'firstName lastName email')
      .populate('hotel', 'name location')
      .sort({ createdAt: -1 });
    
    reviews.push(...hotelReviews.map(review => ({
      ...review.toObject(),
      reviewType: 'hotel',
      reviewId: review._id,
      rating: review.rating?.overall || 0,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
      hotel: review.hotel
    })));
    
    // Fetch custom trip reviews from latest month
    const customTripReviews = await CustomTripReview.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isActive: true
    })
      .populate('user', 'firstName lastName email')
      .populate('customTrip', 'title')
      .sort({ createdAt: -1 });
    
    reviews.push(...customTripReviews.map(review => ({
      ...review.toObject(),
      reviewType: 'custom-trip',
      reviewId: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
      customTrip: review.customTrip
    })));
    
    // Fetch vehicle reviews from latest month
    const vehicleReviews = await VehicleBooking.find({
      createdAt: { $gte: startDate, $lte: endDate },
      'review.rating': { $exists: true, $ne: null },
      'review.comment': { $exists: true, $ne: '' }
    })
      .populate('user', 'firstName lastName email')
      .populate('vehicle', 'make model year licensePlate')
      .populate('driver.assignedDriver', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    reviews.push(...vehicleReviews.map(booking => ({
      ...booking.toObject(),
      reviewType: 'vehicle',
      reviewId: booking._id,
      rating: booking.review?.rating,
      comment: booking.review?.comment,
      createdAt: booking.review?.reviewedAt || booking.createdAt,
      user: booking.user,
      vehicle: booking.vehicle,
      driver: booking.driver?.assignedDriver
    })));
    
    // Sort all reviews by creation date
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Fetched ${reviews.length} reviews from latest month`);
    return reviews;
  } catch (error) {
    console.error('Error fetching latest month reviews:', error);
    return [];
  }
};

// Helper function to generate HTML content for reviews PDF
const generateReviewsHTMLReport = (reviews, stats, startDate, endDate) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const periodStart = startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const periodEnd = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SerendibGo Reviews Report</title>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            
            .company-info {
                background: #f8f9fa;
                padding: 20px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            }
            
            .company-info h2 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 1.5em;
            }
            
            .report-info {
                background: #e3f2fd;
                padding: 15px;
                margin-bottom: 30px;
                border-radius: 8px;
            }
            
            .report-info h3 {
                color: #1976d2;
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
                border-bottom: 2px solid #667eea;
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
            
            .review-type {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .review-type.guide {
                background: #e8f5e8;
                color: #2e7d32;
            }
            
            .review-type.hotel {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .review-type.custom-trip {
                background: #f3e5f5;
                color: #7b1fa2;
            }
            
            .review-type.vehicle {
                background: #fff3e0;
                color: #f57c00;
            }
            
            .rating {
                color: #ffc107;
                font-weight: bold;
            }
            
            .footer {
                margin-top: 50px;
                padding: 30px;
                background: #f8f9fa;
                border-top: 2px solid #667eea;
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
            <p>Reviews Management Report</p>
        </div>
        
        <!-- Company Information -->
        <div class="company-info">
            <h2>Company Information</h2>
            <p><strong>Company Name:</strong> SerendibGo (Pvt) Ltd</p>
            <p><strong>Address:</strong> 123 Colombo Street, Colombo 03, Sri Lanka</p>
            <p><strong>Phone:</strong> +94 11 234 5678</p>
            <p><strong>Email:</strong> info@serendibgo.com</p>
            <p><strong>Website:</strong> www.serendibgo.com</p>
        </div>
        
        <!-- Report Information -->
        <div class="report-info">
            <h3>Reviews Report</h3>
            <p><strong>Report Period:</strong> ${periodStart} - ${periodEnd}</p>
            <p><strong>Generated On:</strong> ${currentDate}</p>
            <p><strong>Total Reviews in Period:</strong> ${reviews.length}</p>
        </div>
        
        <!-- Review Statistics -->
        <div class="section">
            <h3>Review Statistics Summary</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Reviews</h4>
                    <div class="value">${stats.totalReviews}</div>
                    <div class="label">All Time</div>
                </div>
                <div class="stat-card">
                    <h4>Hotel Reviews</h4>
                    <div class="value">${stats.hotelReviews.total}</div>
                    <div class="label">Avg: ${stats.hotelReviews.averageRating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
                <div class="stat-card">
                    <h4>Guide Reviews</h4>
                    <div class="value">${stats.guideReviews.total}</div>
                    <div class="label">Avg: ${stats.guideReviews.averageRating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
                <div class="stat-card">
                    <h4>Custom Trip Reviews</h4>
                    <div class="value">${stats.customTripReviews.total}</div>
                    <div class="label">Avg: ${stats.customTripReviews.averageRating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
                <div class="stat-card">
                    <h4>Vehicle Reviews</h4>
                    <div class="value">${stats.vehicleReviews.total}</div>
                    <div class="label">Avg: ${stats.vehicleReviews.averageRating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
            </div>
        </div>
        
        <!-- Latest Month Reviews -->
        <div class="section">
            <h3>Reviews from Latest Month (${periodStart} - ${periodEnd})</h3>
            ${reviews.length > 0 ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>User</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Date</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(review => `
                    <tr>
                        <td><span class="review-type ${review.reviewType}">${review.reviewType?.replace('-', ' ')}</span></td>
                        <td>${review.user?.firstName} ${review.user?.lastName}</td>
                        <td><span class="rating">${review.rating} ⭐</span></td>
                        <td>${review.comment || 'No comment'}</td>
                        <td>${new Date(review.createdAt).toLocaleDateString()}</td>
                        <td>
                            ${review.reviewType === 'hotel' ? `${review.hotel?.name || 'Hotel'}` : ''}
                            ${review.reviewType === 'guide' ? `${review.tour?.title || review.guide?.firstName + ' ' + review.guide?.lastName || 'Guide'}` : ''}
                            ${review.reviewType === 'custom-trip' ? `${review.customTrip?.title || 'Custom Trip'}` : ''}
                            ${review.reviewType === 'vehicle' ? `${review.vehicle?.make} ${review.vehicle?.model} (${review.vehicle?.year})` : ''}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>No reviews found for the latest month.</p>'}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>Report Generated:</strong> ${currentDate}</p>
            <p><strong>Generated By:</strong> SerendibGo Admin System</p>
            <p><strong>Report Period:</strong> ${periodStart} - ${periodEnd}</p>
        </div>
    </body>
    </html>
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
  getAllReviews,
  getReviewStatistics,
  updateReviewStatus,
  deleteReview,
  exportReviewsToPDF
};
