const asyncHandler = require('express-async-handler');
const Review = require('../../models/Review');
const HotelReview = require('../../models/hotels/HotelReview');
const CustomTripReview = require('../../models/CustomTripReview');
const User = require('../../models/User');
const Hotel = require('../../models/hotels/Hotel');
const CustomTrip = require('../../models/CustomTrip');
const Tour = require('../../models/Tour');

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
      totalCount = hotelCount + guideCount + customTripCount;
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

    const result = {
      totalReviews: (hotelStats[0]?.total || 0) + (guideStats[0]?.total || 0) + (customTripStats[0]?.total || 0),
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
      customTripReviews: { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
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

module.exports = {
  getAllReviews,
  getReviewStatistics,
  updateReviewStatus,
  deleteReview
};
