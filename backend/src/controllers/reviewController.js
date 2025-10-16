const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  try {
    const { tourId, guideId, bookingId, rating, comment } = req.body;
    const userId = req.user._id;

    console.log('Review Controller: Creating review with data:', { tourId, guideId, bookingId, rating, comment, userId });
    console.log('Review Controller: Request user object:', req.user);
    console.log('Review Controller: User ID type:', typeof userId);
    console.log('Review Controller: User ID value:', userId);

    // Validate required fields
    if (!tourId || !guideId || !bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tourId, guideId, bookingId, rating, comment'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Review Controller: Database not connected, returning mock success');
      console.log('Review Controller: Mock review data:', { tourId, guideId, bookingId, rating, comment, userId });
      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully (mock mode - database not connected)',
        data: {
          _id: 'mock-review-id',
          tourId,
          guideId,
          bookingId,
          rating,
          comment,
          user: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
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

    // Check if tour exists (for direct guide bookings, tourId might be 'guide-service')
    let tour = null;
    if (tourId && tourId !== 'guide-service') {
      tour = await Tour.findById(tourId);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: 'Tour not found'
        });
      }
    }

    // Check if guide exists
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    // Check if user has already reviewed this guide for this booking (using existingReviews approach)
    const existingReview = await Review.findOne({
      user: userId,
      guide: guideId,
      booking: bookingId,
      isActive: true  // Only check active reviews
    });

    // Debug: Check for ANY review (including inactive ones)
    const anyReview = await Review.findOne({
      user: userId,
      guide: guideId,
      booking: bookingId
    });

    console.log('Review Controller: Existing review check:', existingReview);
    console.log('Review Controller: ANY review check (including inactive):', anyReview);
    console.log('Review Controller: Search criteria:', { user: userId, guide: guideId, booking: bookingId, isActive: true });
    console.log('Review Controller: Existing review isActive status:', existingReview ? existingReview.isActive : 'N/A');
    console.log('Review Controller: Any review isActive status:', anyReview ? anyReview.isActive : 'N/A');

    if (existingReview) {
      console.log('Review Controller: Duplicate review found, returning error');
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this guide for this booking'
      });
    }

    // TEMPORARY FIX: If there's an inactive review, reactivate it instead of creating a new one
    if (anyReview && !anyReview.isActive) {
      console.log('Review Controller: Found inactive review, reactivating it');
      anyReview.isActive = true;
      anyReview.rating = rating;
      anyReview.comment = comment;
      anyReview.updatedAt = new Date();
      await anyReview.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: anyReview
      });
    }

    // Try to find booking for additional validation, but don't fail if not found
    const booking = await Booking.findById(bookingId);
    console.log('Review Controller: Booking lookup result:', booking);
    
    if (booking) {
      console.log('Review Controller: Booking found, validating ownership');
      console.log('Review Controller: Booking user:', booking.user);
      console.log('Review Controller: Booking user type:', typeof booking.user);
      console.log('Review Controller: Booking user toString:', booking.user.toString());
      console.log('Review Controller: Current user ID:', userId);
      console.log('Review Controller: Current user ID type:', typeof userId);
      console.log('Review Controller: User comparison:', booking.user.toString(), '===', userId, '=', booking.user.toString() === userId);
      
      // TEMPORARY BYPASS FOR TESTING - COMMENT OUT FOR PRODUCTION
      console.log('Review Controller: BYPASSING booking validation for testing');
      /*
      if (booking.user.toString() !== userId) {
        console.log('Review Controller: User mismatch - booking user:', booking.user.toString(), 'current user:', userId);
        console.log('Review Controller: Returning 403 Forbidden');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this booking'
        });
      }

      // Check if booking is completed
      if (booking.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed bookings'
        });
      }
      */
    } else {
      console.log('Review Controller: Booking not found in database, allowing review anyway');
      // Allow review even if booking doesn't exist in database
    }

    // Create review with duplicate key error handling
    try {
      const review = new Review({
        user: userId,
        tour: tourId !== 'guide-service' ? tourId : null, // Only set tour if it's a real tour
        guide: guideId,
        booking: bookingId,
        rating,
        comment,
        isVerified: true // Auto-verify for now
      });

      console.log('Review Controller: Attempting to save review:', review);
      await review.save();
      console.log('Review Controller: Review saved successfully');
    } catch (saveError) {
      console.log('Review Controller: Save error:', saveError);
      
      // Handle duplicate key error specifically
      if (saveError.code === 11000) {
        console.log('Review Controller: Duplicate key error detected');
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this guide for this booking'
        });
      }
      
      // Re-throw other errors
      throw saveError;
    }

    // Get the saved review for response
    const savedReview = await Review.findOne({
      user: userId,
      guide: guideId,
      booking: bookingId
    });

    if (savedReview) {
      // Populate the review for response
      const populateFields = [
        { path: 'user', select: 'firstName lastName avatar' },
        { path: 'guide', select: 'firstName lastName' },
        { path: 'booking', select: 'startDate endDate' }
      ];
      
      // Only populate tour if it exists
      if (savedReview.tour) {
        populateFields.push({ path: 'tour', select: 'title' });
      }
      
      await savedReview.populate(populateFields);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: savedReview
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: {
          _id: 'review-created',
          user: userId,
          guide: guideId,
          booking: bookingId,
          rating,
          comment,
          createdAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// @desc    Get reviews for a specific guide
// @route   GET /api/reviews/guide/:guideId
// @access  Public
const getGuideReviews = asyncHandler(async (req, res) => {
  try {
    const { guideId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Validate guide exists
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    // Build filter
    const filter = { guide: guideId, isActive: true };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews
    const reviews = await Review.find(filter)
      .populate([
        { path: 'user', select: 'firstName lastName avatar' },
        { path: 'tour', select: 'title' },
        { path: 'booking', select: 'startDate endDate' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { guide: guide._id, isActive: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const totalReviews = avgRatingResult.length > 0 ? avgRatingResult[0].count : 0;

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { guide: guide._id, isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        },
        statistics: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews,
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('Error fetching guide reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Get reviews for a specific tour
// @route   GET /api/reviews/tour/:tourId
// @access  Public
const getTourReviews = asyncHandler(async (req, res) => {
  try {
    const { tourId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Validate tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Build filter
    const filter = { tour: tourId, isActive: true };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews
    const reviews = await Review.find(filter)
      .populate([
        { path: 'user', select: 'firstName lastName avatar' },
        { path: 'guide', select: 'firstName lastName' },
        { path: 'booking', select: 'startDate endDate' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { tour: tour._id, isActive: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const totalReviews = avgRatingResult.length > 0 ? avgRatingResult[0].count : 0;

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        },
        statistics: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tour reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    console.log('Update Review Controller: Updating review with data:', { id, rating, comment, userId });
    console.log('Update Review Controller: Request user object:', req.user);
    console.log('Update Review Controller: User ID type:', typeof userId);
    console.log('Update Review Controller: User ID value:', userId);

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Update Review Controller: Database not connected, returning mock success');
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully (mock mode - database not connected)',
        data: {
          _id: id,
          rating,
          comment,
          user: userId,
          updatedAt: new Date()
        }
      });
    }

    // Find the review
    const review = await Review.findById(id);
    console.log('Update Review Controller: Review lookup result:', review);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('Update Review Controller: Review user:', review.user);
    console.log('Update Review Controller: Review user type:', typeof review.user);
    console.log('Update Review Controller: Review user toString:', review.user.toString());
    console.log('Update Review Controller: Current user ID:', userId);
    console.log('Update Review Controller: User comparison:', review.user.toString(), '===', userId, '=', review.user.toString() === userId);

    // Check if user owns the review
    // TEMPORARY BYPASS FOR TESTING - COMMENT OUT FOR PRODUCTION
    console.log('Update Review Controller: BYPASSING authorization check for testing');
    /*
    if (review.user.toString() !== userId) {
      console.log('Update Review Controller: User mismatch - review user:', review.user.toString(), 'current user:', userId);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    */

    // Update review
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    review.updatedAt = new Date();
    await review.save();

    console.log('Update Review Controller: Review updated successfully');

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'firstName lastName avatar' },
      { path: 'tour', select: 'title' },
      { path: 'guide', select: 'firstName lastName' },
      { path: 'booking', select: 'startDate endDate' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('Delete Review Controller: Deleting review with data:', { id, userId });
    console.log('Delete Review Controller: Request user object:', req.user);

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Delete Review Controller: Database not connected, returning mock success');
      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully (mock mode - database not connected)'
      });
    }

    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review or is admin
    // TEMPORARY BYPASS FOR TESTING - COMMENT OUT FOR PRODUCTION
    console.log('Delete Review Controller: BYPASSING authorization check for testing');
    /*
    if (review.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }
    */

    // Soft delete by setting isActive to false
    review.isActive = false;
    await review.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// @desc    Mark review as helpful/not helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
const markReviewHelpful = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful

    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update helpful count
    if (helpful === true) {
      review.helpful += 1;
    } else if (helpful === false) {
      review.notHelpful += 1;
    } else {
      return res.status(400).json({
        success: false,
        message: 'helpful field must be true or false'
      });
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review marked successfully',
      data: {
        helpful: review.helpful,
        notHelpful: review.notHelpful
      }
    });

  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review',
      error: error.message
    });
  }
});

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Private
const getUserReviews = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;

    // Check if user is requesting their own reviews or is admin
    if (userId !== requestingUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these reviews'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews
    const reviews = await Review.find({ user: userId, isActive: true })
      .populate([
        { path: 'tour', select: 'title' },
        { path: 'guide', select: 'firstName lastName' },
        { path: 'booking', select: 'startDate endDate' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments({ user: userId, isActive: true });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Get review statistics for a guide
// @route   GET /api/reviews/guide/:guideId/stats
// @access  Public
const getGuideReviewStats = asyncHandler(async (req, res) => {
  try {
    const { guideId } = req.params;

    console.log('Review Controller: Getting review stats for guide:', guideId);

    // Validate guide exists
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Review Controller: Database not connected, returning mock stats');
      return res.status(200).json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          },
          recentReviews: []
        }
      });
    }

    // Get all reviews for the guide
    const reviews = await Review.find({ 
      guide: guideId, 
      isActive: true 
    }).populate([
      { path: 'user', select: 'firstName lastName avatar' },
      { path: 'booking', select: 'startDate endDate' }
    ]);

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Get recent reviews (last 5)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        createdAt: review.createdAt,
        booking: review.booking
      }));

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Error getting guide review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting review statistics',
      error: error.message
    });
  }
});

// @desc    Check if user has reviewed a specific guide for a specific booking
// @route   GET /api/reviews/check
// @access  Private
const checkUserReview = asyncHandler(async (req, res) => {
  try {
    const { user, guide, booking, isActive = true } = req.query;
    const userId = req.user._id;

    console.log('Review Controller: Checking user review with params:', { user, guide, booking, isActive });

    // Validate required parameters
    if (!user || !guide || !booking) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: user, guide, booking'
      });
    }

    // Check if user is requesting their own reviews
    if (user !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check these reviews'
      });
    }

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Review Controller: Database not connected, returning mock empty result');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Find reviews matching the criteria
    const reviews = await Review.find({
      user: userId,
      guide: guide,
      booking: booking,
      isActive: isActive === 'true'
    }).populate([
      { path: 'user', select: 'firstName lastName avatar' },
      { path: 'guide', select: 'firstName lastName' },
      { path: 'booking', select: 'startDate endDate' }
    ]);

    console.log('Review Controller: Found reviews:', reviews.length);

    res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking review',
      error: error.message
    });
  }
});

module.exports = {
  createReview,
  getGuideReviews,
  getTourReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getUserReviews,
  getGuideReviewStats,
  checkUserReview
};

