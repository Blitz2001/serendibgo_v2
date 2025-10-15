const mongoose = require('mongoose');

const hotelReviewSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel is required']
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelBooking',
    required: [true, 'Booking is required']
  },
  
  // Rating details
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness: { 
      type: Number, 
      required: [true, 'Cleanliness rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    location: { 
      type: Number, 
      required: [true, 'Location rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    service: { 
      type: Number, 
      required: [true, 'Service rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    value: { 
      type: Number, 
      required: [true, 'Value rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    amenities: { 
      type: Number, 
      required: [true, 'Amenities rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  
  // Review content
  content: {
    type: String,
    required: [true, 'Review content is required'],
    maxlength: [1000, 'Review content cannot exceed 1000 characters']
  },
  
  // Photos
  photos: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags for categorization
  tags: [{
    type: String,
    enum: [
      'excellent', 'very-good', 'good', 'fair', 'poor',
      'clean', 'dirty', 'modern', 'outdated', 'spacious', 'cramped',
      'friendly-staff', 'rude-staff', 'helpful', 'unhelpful',
      'good-value', 'overpriced', 'cheap', 'expensive',
      'great-location', 'poor-location', 'convenient', 'inconvenient',
      'quiet', 'noisy', 'peaceful', 'busy',
      'romantic', 'family-friendly', 'business', 'luxury', 'budget'
    ]
  }],
  
  // Verification and status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Helpfulness ratings
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  
  // Hotel owner response
  ownerResponse: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
hotelReviewSchema.index({ hotel: 1 });
hotelReviewSchema.index({ user: 1 });
hotelReviewSchema.index({ booking: 1 });
hotelReviewSchema.index({ 'rating.overall': -1 });
hotelReviewSchema.index({ createdAt: -1 });

// Ensure one review per booking
hotelReviewSchema.index({ user: 1, hotel: 1, booking: 1 }, { unique: true });

// Pre-save middleware to update hotel ratings
hotelReviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    await this.constructor.updateHotelRatings(this.hotel);
  }
  next();
});

// Pre-remove middleware to update hotel ratings
hotelReviewSchema.pre('remove', async function(next) {
  await this.constructor.updateHotelRatings(this.hotel);
  next();
});

// Static method to update hotel ratings
hotelReviewSchema.statics.updateHotelRatings = async function(hotelId) {
  try {
    const reviews = await this.find({ hotel: hotelId, isActive: true });
    
    if (reviews.length === 0) {
      // Reset ratings if no reviews
      await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
        'ratings.overall': 0,
        'ratings.cleanliness': 0,
        'ratings.location': 0,
        'ratings.service': 0,
        'ratings.value': 0,
        'ratings.amenities': 0,
        reviewCount: 0
      });
      return;
    }
    
    // Calculate average ratings
    const ratingFields = ['overall', 'cleanliness', 'location', 'service', 'value', 'amenities'];
    const avgRatings = {};
    
    ratingFields.forEach(field => {
      const sum = reviews.reduce((total, review) => total + review.rating[field], 0);
      avgRatings[`ratings.${field}`] = Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
    });
    
    // Update hotel with new ratings and review count
    await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
      ...avgRatings,
      reviewCount: reviews.length
    });
    
  } catch (error) {
    console.error('Error updating hotel ratings:', error);
  }
};

module.exports = mongoose.model('HotelReview', hotelReviewSchema);
