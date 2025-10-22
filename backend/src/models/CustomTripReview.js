const mongoose = require('mongoose');

const customTripReviewSchema = new mongoose.Schema({
  // User who wrote the review
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  // Custom trip being reviewed
  customTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTrip',
    required: [true, 'Custom trip is required']
  },
  
  // Overall rating for the custom trip experience
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  // Detailed ratings for different aspects
  detailedRatings: {
    // Guide service rating
    guideService: {
      type: Number,
      min: [1, 'Guide service rating must be at least 1'],
      max: [5, 'Guide service rating cannot exceed 5']
    },
    // Hotel accommodation rating
    accommodation: {
      type: Number,
      min: [1, 'Accommodation rating must be at least 1'],
      max: [5, 'Accommodation rating cannot exceed 5']
    },
    // Transportation rating
    transportation: {
      type: Number,
      min: [1, 'Transportation rating must be at least 1'],
      max: [5, 'Transportation rating cannot exceed 5']
    },
    // Itinerary planning rating
    itinerary: {
      type: Number,
      min: [1, 'Itinerary rating must be at least 1'],
      max: [5, 'Itinerary rating cannot exceed 5']
    },
    // Value for money rating
    valueForMoney: {
      type: Number,
      min: [1, 'Value for money rating must be at least 1'],
      max: [5, 'Value for money rating cannot exceed 5']
    }
  },
  
  // Review title
  title: {
    type: String,
    required: false,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  // Main review comment
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  
  // Additional comments for different aspects
  additionalComments: {
    guideComment: {
      type: String,
      maxlength: [500, 'Guide comment cannot exceed 500 characters']
    },
    accommodationComment: {
      type: String,
      maxlength: [500, 'Accommodation comment cannot exceed 500 characters']
    },
    transportationComment: {
      type: String,
      maxlength: [500, 'Transportation comment cannot exceed 500 characters']
    },
    itineraryComment: {
      type: String,
      maxlength: [500, 'Itinerary comment cannot exceed 500 characters']
    }
  },
  
  // Review verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Review status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Helpful votes
  helpful: {
    type: Number,
    default: 0
  },
  
  // Not helpful votes
  notHelpful: {
    type: Number,
    default: 0
  },
  
  // Review images (optional)
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Trip details for context
  tripDetails: {
    destination: String,
    duration: Number,
    groupSize: Number,
    startDate: Date,
    endDate: Date
  },
  
  // Response from service provider (optional)
  response: {
    comment: {
      type: String,
      maxlength: [1000, 'Response comment cannot exceed 1000 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
customTripReviewSchema.index({ customTrip: 1 });
customTripReviewSchema.index({ user: 1 });
customTripReviewSchema.index({ rating: 1 });
customTripReviewSchema.index({ isActive: 1 });
customTripReviewSchema.index({ createdAt: -1 });

// Virtual for average detailed rating
customTripReviewSchema.virtual('averageDetailedRating').get(function() {
  const ratings = this.detailedRatings;
  const validRatings = Object.values(ratings).filter(rating => rating && rating > 0);
  
  if (validRatings.length === 0) {
    return this.rating; // Fallback to overall rating
  }
  
  return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
});

// Virtual for review age
customTripReviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const reviewDate = this.createdAt;
  const diffTime = Math.abs(now - reviewDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Pre-save middleware to ensure only one primary image
customTripReviewSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    }
  }
  next();
});

// Method to check if user can edit review
customTripReviewSchema.methods.canEdit = function(userId) {
  return this.user.toString() === userId.toString() && this.isActive;
};

// Method to check if user can delete review
customTripReviewSchema.methods.canDelete = function(userId) {
  return this.user.toString() === userId.toString();
};

// Static method to get average rating for a custom trip
customTripReviewSchema.statics.getAverageRating = async function(customTripId) {
  const result = await this.aggregate([
    { $match: { customTrip: new mongoose.Types.ObjectId(customTripId), isActive: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews
  } : { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution
customTripReviewSchema.statics.getRatingDistribution = async function(customTripId) {
  const result = await this.aggregate([
    { $match: { customTrip: new mongoose.Types.ObjectId(customTripId), isActive: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach(item => {
    distribution[item._id] = item.count;
  });
  
  return distribution;
};

module.exports = mongoose.model('CustomTripReview', customTripReviewSchema);
