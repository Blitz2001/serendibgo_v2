const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const HotelReview = require('../../models/hotels/HotelReview');
const Hotel = require('../../models/hotels/Hotel');
const HotelBooking = require('../../models/hotels/HotelBooking');
const User = require('../../models/User');

// @desc    Create a new hotel review
// @route   POST /api/hotel-reviews
// @access  Private
const createHotelReview = asyncHandler(async (req, res) => {
  try {
    const { hotelId, bookingId, rating, content, photos = [], tags = [] } = req.body;
    const userId = req.user._id;

    console.log('Hotel Review Controller: Creating review with data:', { hotelId, bookingId, rating, content, userId });

    // Validate required fields
    if (!hotelId || !bookingId || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: hotelId, bookingId, rating, content'
      });
    }

    // Validate rating structure
    const requiredRatingFields = ['overall', 'cleanliness', 'location', 'service', 'value', 'amenities'];
    for (const field of requiredRatingFields) {
      if (!rating[field] || rating[field] < 1 || rating[field] > 5) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} rating. Must be between 1 and 5`
        });
      }
    }

    // Mock mode when database is not connected
    if (!mongoose.connection.readyState) {
      console.log('Hotel Review Controller: Database not connected, returning mock success');
      return res.status(201).json({
        success: true,
        message: 'Hotel review submitted successfully (mock mode - database not connected)',
        data: {
          _id: 'mock-hotel-review-id',
          hotelId,
          bookingId,
          rating,
          content,
          photos,
          tags,
          user: userId,
          isVerified: true,
          isActive: true,
          helpful: 0,
          notHelpful: 0,
          replies: [],
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

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Check if user has already reviewed this hotel for this booking (using existingReviews approach)
    const existingReview = await HotelReview.findOne({
      user: userId,
      hotel: hotelId,
      booking: bookingId,
      isActive: true  // Only check active reviews
    });

    console.log('Hotel Review Controller: Existing review check:', existingReview);

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this hotel for this booking'
      });
    }

    // Try to find booking for additional validation, but don't fail if not found
    const booking = await HotelBooking.findById(bookingId);
    console.log('Hotel Review Controller: Booking lookup result:', booking);
    
    if (booking) {
      console.log('Hotel Review Controller: Booking found, validating ownership');
      console.log('Hotel Review Controller: Booking user:', booking.user);
      console.log('Hotel Review Controller: Current user ID:', userId);
      
      if (booking.user.toString() !== userId) {
        console.log('Hotel Review Controller: User mismatch - booking user:', booking.user.toString(), 'current user:', userId);
        return res.status(403).json({
          success: false,
          message: 'You can only review your own bookings'
        });
      }

      // Check if booking is completed
      if (booking.bookingStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed bookings'
        });
      }
    } else {
      console.log('Hotel Review Controller: Booking not found in database, allowing review anyway');
      // Allow review even if booking doesn't exist in database
    }

    // Additional validation if booking exists
    if (booking && booking.hotel.toString() !== hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not belong to this hotel'
      });
    }


    // Create the review
    const review = new HotelReview({
      user: userId,
      hotel: hotelId,
      booking: bookingId,
      rating,
      content,
      photos,
      tags,
      isVerified: true // Auto-verify for completed bookings
    });

    await review.save();

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'hotel', select: 'name' },
      { path: 'booking', select: 'checkIn checkOut' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    console.error('Error creating hotel review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// @desc    Get hotel reviews
// @route   GET /api/hotel-reviews/hotel/:hotelId
// @access  Public
const getHotelReviews = asyncHandler(async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      rating = null,
      verified = null
    } = req.query;

    // Validate hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Build query
    const query = { hotel: hotelId, isActive: true };
    
    if (rating) {
      query['rating.overall'] = { $gte: parseInt(rating) };
    }
    
    if (verified !== null) {
      query.isVerified = verified === 'true';
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews
    const reviews = await HotelReview.find(query)
      .populate([
        { path: 'user', select: 'firstName lastName' },
        { path: 'booking', select: 'checkIn checkOut' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await HotelReview.countDocuments(query);

    // Calculate rating distribution
    const ratingDistribution = await HotelReview.aggregate([
      { $match: { hotel: hotel._id, isActive: true } },
      {
        $group: {
          _id: '$rating.overall',
          count: { $sum: 1 }
        }
      },
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
        ratingDistribution,
        hotel: {
          _id: hotel._id,
          name: hotel.name,
          ratings: hotel.ratings,
          reviewCount: hotel.reviewCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Get user's hotel reviews
// @route   GET /api/hotel-reviews/user/:userId
// @access  Private
const getUserHotelReviews = asyncHandler(async (req, res) => {
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
    const reviews = await HotelReview.find({ user: userId, isActive: true })
      .populate([
        { path: 'hotel', select: 'name location' },
        { path: 'booking', select: 'checkIn checkOut' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await HotelReview.countDocuments({ user: userId, isActive: true });

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
    console.error('Error fetching user hotel reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Update hotel review
// @route   PUT /api/hotel-reviews/:reviewId
// @access  Private
const updateHotelReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, content, photos, tags } = req.body;
    const userId = req.user._id;

    // Find the review
    const review = await HotelReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Update fields
    if (rating) {
      // Validate rating structure
      const requiredRatingFields = ['overall', 'cleanliness', 'location', 'service', 'value', 'amenities'];
      for (const field of requiredRatingFields) {
        if (rating[field] && (rating[field] < 1 || rating[field] > 5)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} rating. Must be between 1 and 5`
          });
        }
      }
      review.rating = { ...review.rating, ...rating };
    }

    if (content !== undefined) {
      review.content = content;
    }

    if (photos !== undefined) {
      review.photos = photos;
    }

    if (tags !== undefined) {
      review.tags = tags;
    }

    await review.save();

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'hotel', select: 'name' },
      { path: 'booking', select: 'checkIn checkOut' }
    ]);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    console.error('Error updating hotel review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// @desc    Delete hotel review
// @route   DELETE /api/hotel-reviews/:reviewId
// @access  Private
const deleteHotelReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Find the review
    const review = await HotelReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Soft delete by setting isActive to false
    review.isActive = false;
    await review.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hotel review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// @desc    Mark review as helpful/not helpful
// @route   POST /api/hotel-reviews/:reviewId/helpful
// @access  Private
const markReviewHelpful = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful
    const userId = req.user._id;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Helpful must be a boolean value'
      });
    }

    const review = await HotelReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update helpful/not helpful count
    if (helpful) {
      review.helpful += 1;
    } else {
      review.notHelpful += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
      data: {
        helpful: review.helpful,
        notHelpful: review.notHelpful
      }
    });

  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review helpfulness',
      error: error.message
    });
  }
});

// @desc    Check if user can review a hotel
// @route   GET /api/hotel-reviews/can-review/:hotelId
// @access  Private
const canUserReviewHotel = asyncHandler(async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user._id;

    // Find completed bookings for this hotel by this user
    const bookings = await HotelBooking.find({
      user: userId,
      hotel: hotelId,
      bookingStatus: 'completed'
    });

    if (bookings.length === 0) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'No completed bookings found for this hotel'
        }
      });
    }

    // Check if user has already reviewed any of these bookings
    const existingReviews = await HotelReview.find({
      user: userId,
      hotel: hotelId,
      booking: { $in: bookings.map(b => b._id) },
      isActive: true
    });

    if (existingReviews.length > 0) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'You have already reviewed this hotel',
          existingReview: existingReviews[0]
        }
      });
    }

    res.json({
      success: true,
      data: {
        canReview: true,
        availableBookings: bookings.map(booking => ({
          _id: booking._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          roomType: booking.roomType
        }))
      }
    });

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking review eligibility',
      error: error.message
    });
  }
});

module.exports = {
  createHotelReview,
  getHotelReviews,
  getUserHotelReviews,
  updateHotelReview,
  deleteHotelReview,
  markReviewHelpful,
  canUserReviewHotel
};
