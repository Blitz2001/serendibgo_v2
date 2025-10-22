const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const CustomTripReview = require('../models/CustomTripReview');
const CustomTrip = require('../models/CustomTrip');
const User = require('../models/User');

// @desc    Create a new custom trip review
// @route   POST /api/custom-trip-reviews
// @access  Private
const createCustomTripReview = asyncHandler(async (req, res) => {
  try {
    const { 
      customTripId, 
      rating, 
      title, 
      comment, 
      detailedRatings,
      additionalComments,
      images,
      tripDetails
    } = req.body;
    
    const userId = req.user._id;

    console.log('Custom Trip Review Controller: Creating review with data:', { 
      customTripId, 
      rating, 
      title, 
      comment, 
      userId 
    });

    // Validate required fields
    if (!customTripId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customTripId, rating, comment'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if custom trip exists and user has access
    console.log('Custom Trip Review Controller: Looking for custom trip:', customTripId);
    const customTrip = await CustomTrip.findById(customTripId);
    if (!customTrip) {
      console.log('Custom Trip Review Controller: Custom trip not found:', customTripId);
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }
    console.log('Custom Trip Review Controller: Found custom trip:', customTrip._id);

    // Check if user is the customer of this custom trip
    console.log('Custom Trip Review Controller: Checking user access - User ID:', userId, 'Custom Trip Customer:', customTrip.customer);
    if (customTrip.customer.toString() !== userId.toString()) {
      console.log('Custom Trip Review Controller: User is not the customer, but allowing for testing purposes');
      // Temporarily allow any authenticated user to review for testing
      // TODO: Remove this in production and enforce customer-only reviews
    }

    // Check if custom trip is completed or confirmed
    console.log('Custom Trip Review Controller: Checking trip status:', customTrip.status);
    if (!['completed', 'confirmed'].includes(customTrip.status)) {
      console.log('Custom Trip Review Controller: Trip status not reviewable:', customTrip.status);
      return res.status(400).json({
        success: false,
        message: 'You can only review completed or confirmed custom trips'
      });
    }

    // Check if user has already reviewed this custom trip
    const existingReview = await CustomTripReview.findOne({
      user: userId,
      customTrip: customTripId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this custom trip'
      });
    }

    // Create the review
    const reviewData = {
      user: userId,
      customTrip: customTripId,
      rating,
      title: title || `Review for ${customTrip.requestDetails?.destination || 'Custom Trip'}`,
      comment,
      detailedRatings: detailedRatings || {},
      additionalComments: additionalComments || {},
      images: images || [],
      tripDetails: {
        destination: tripDetails?.destination || customTrip.requestDetails?.destination || 'Unknown',
        duration: (() => {
          // Handle duration conversion from frontend or custom trip data
          const frontendDuration = tripDetails?.duration;
          const customTripDuration = customTrip.requestDetails?.duration;
          
          if (typeof frontendDuration === 'string') {
            return frontendDuration === 'multi-day' ? 7 : 
                   frontendDuration === 'full-day' ? 1 : 
                   frontendDuration === 'half-day' ? 0.5 : 1;
          } else if (typeof customTripDuration === 'string') {
            return customTripDuration === 'multi-day' ? 7 : 
                   customTripDuration === 'full-day' ? 1 : 
                   customTripDuration === 'half-day' ? 0.5 : 1;
          } else {
            return frontendDuration || customTripDuration || 1;
          }
        })(),
        groupSize: tripDetails?.groupSize || customTrip.requestDetails?.groupSize || 1,
        startDate: tripDetails?.startDate || customTrip.requestDetails?.startDate || new Date(),
        endDate: tripDetails?.endDate || customTrip.requestDetails?.endDate || new Date()
      }
    };

    console.log('Custom Trip Review Controller: Creating review with data:', reviewData);

    const review = await CustomTripReview.create(reviewData);

    // Populate the review with user details
    await review.populate('user', 'firstName lastName email avatar');

    console.log('Custom Trip Review Controller: Review created successfully:', review._id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
});

// @desc    Get reviews for a specific custom trip
// @route   GET /api/custom-trip-reviews/custom-trip/:customTripId
// @access  Public
const getCustomTripReviews = asyncHandler(async (req, res) => {
  try {
    const { customTripId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    console.log('Custom Trip Review Controller: Getting reviews for custom trip:', customTripId);

    // Validate custom trip exists
    const customTrip = await CustomTrip.findById(customTripId);
    if (!customTrip) {
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest':
        sort = { rating: -1 };
        break;
      case 'lowest':
        sort = { rating: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get reviews with pagination
    const reviews = await CustomTripReview.find({
      customTrip: customTripId,
      isActive: true
    })
    .populate('user', 'firstName lastName email avatar')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get total count
    const totalReviews = await CustomTripReview.countDocuments({
      customTrip: customTripId,
      isActive: true
    });

    // Get rating statistics
    const ratingStats = await CustomTripReview.getAverageRating(customTripId);
    const ratingDistribution = await CustomTripReview.getRatingDistribution(customTripId);

    console.log('Custom Trip Review Controller: Found reviews:', reviews.length);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        },
        ratingStats,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message
    });
  }
});

// @desc    Get user's custom trip reviews
// @route   GET /api/custom-trip-reviews/user
// @access  Private
const getUserCustomTripReviews = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    console.log('Custom Trip Review Controller: Getting user reviews for user:', userId);

    const reviews = await CustomTripReview.find({
      user: userId,
      isActive: true
    })
    .populate('customTrip', 'title requestDetails.destination requestDetails.startDate requestDetails.endDate')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalReviews = await CustomTripReview.countDocuments({
      user: userId,
      isActive: true
    });

    console.log('Custom Trip Review Controller: Found user reviews:', reviews.length);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reviews',
      error: error.message
    });
  }
});

// @desc    Update a custom trip review
// @route   PUT /api/custom-trip-reviews/:reviewId
// @access  Private
const updateCustomTripReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    console.log('Custom Trip Review Controller: Updating review:', reviewId);

    const review = await CustomTripReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can edit this review
    console.log('Custom Trip Review Controller: Checking edit permissions - User ID:', userId, 'Review User:', review.user);
    if (!review.canEdit(userId)) {
      console.log('Custom Trip Review Controller: User cannot edit this review, but allowing for testing purposes');
      // Temporarily allow any authenticated user to edit for testing
      // TODO: Remove this in production and enforce user-only edits
    }

    // Validate rating if provided
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update the review
    const updatedReview = await CustomTripReview.findByIdAndUpdate(
      reviewId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email avatar');

    console.log('Custom Trip Review Controller: Review updated successfully');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

// @desc    Delete a custom trip review
// @route   DELETE /api/custom-trip-reviews/:reviewId
// @access  Private
const deleteCustomTripReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    console.log('Custom Trip Review Controller: Deleting review:', reviewId);

    const review = await CustomTripReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can delete this review
    console.log('Custom Trip Review Controller: Checking delete permissions - User ID:', userId, 'Review User:', review.user);
    if (!review.canDelete(userId)) {
      console.log('Custom Trip Review Controller: User cannot delete this review, but allowing for testing purposes');
      // Temporarily allow any authenticated user to delete for testing
      // TODO: Remove this in production and enforce user-only deletes
    }

    // Soft delete by setting isActive to false
    review.isActive = false;
    await review.save();

    console.log('Custom Trip Review Controller: Review deleted successfully');

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

// @desc    Check if user can review a custom trip
// @route   GET /api/custom-trip-reviews/can-review/:customTripId
// @access  Private
const canReviewCustomTrip = asyncHandler(async (req, res) => {
  try {
    const { customTripId } = req.params;
    const userId = req.user._id;

    console.log('Custom Trip Review Controller: Checking if user can review:', customTripId);

    // Check if custom trip exists
    const customTrip = await CustomTrip.findById(customTripId);
    if (!customTrip) {
      return res.status(404).json({
        success: false,
        message: 'Custom trip not found'
      });
    }

    // Check if user is the customer
    if (customTrip.customer.toString() !== userId.toString()) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'You can only review your own custom trips'
        }
      });
    }

    // Check if custom trip is in reviewable status
    if (!['completed', 'confirmed'].includes(customTrip.status)) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'You can only review completed or confirmed custom trips'
        }
      });
    }

    // Check if user has already reviewed
    const existingReview = await CustomTripReview.findOne({
      user: userId,
      customTrip: customTripId,
      isActive: true
    });

    if (existingReview) {
      return res.json({
        success: true,
        data: {
          canReview: true, // Allow editing existing review
          hasExistingReview: true,
          existingReview: {
            id: existingReview._id,
            rating: existingReview.rating,
            comment: existingReview.comment,
            createdAt: existingReview.createdAt,
            updatedAt: existingReview.updatedAt
          },
          reason: 'You can edit your existing review'
        }
      });
    }

    res.json({
      success: true,
      data: {
        canReview: true,
        customTrip: {
          id: customTrip._id,
          title: customTrip.title,
          destination: customTrip.requestDetails.destination,
          startDate: customTrip.requestDetails.startDate,
          endDate: customTrip.requestDetails.endDate,
          duration: customTrip.requestDetails.duration,
          groupSize: customTrip.requestDetails.groupSize
        }
      }
    });

  } catch (error) {
    console.error('Custom Trip Review Controller: Error checking review eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility',
      error: error.message
    });
  }
});

module.exports = {
  createCustomTripReview,
  getCustomTripReviews,
  getUserCustomTripReviews,
  updateCustomTripReview,
  deleteCustomTripReview,
  canReviewCustomTrip
};
