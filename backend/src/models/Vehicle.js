const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Vehicle name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: [
      'car', 'van', 'bus', 'tuk-tuk', 'motorcycle', 'bicycle',
      'Car', 'Van', 'Tuk-tuk', 'Bus', 'Minibus', 'SUV', 'Motorcycle',
      'Bicycle', 'Boat', 'Train', 'Airplane', 'Helicopter'
    ]
  },
  
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1990, 'Vehicle year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Vehicle year cannot be in the future']
  },
  
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Capacity and Features
  capacity: {
    passengers: {
      type: Number,
      required: [true, 'Passenger capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    luggage: {
      type: Number,
      default: 0,
      min: [0, 'Luggage capacity cannot be negative']
    }
  },
  
  features: {
    airConditioning: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    gps: { type: Boolean, default: false },
    musicSystem: { type: Boolean, default: false },
    chargingPorts: { type: Boolean, default: false },
    wheelchairAccessible: { type: Boolean, default: false },
    childSeat: { type: Boolean, default: false }
  },
  
  // Pricing
  pricing: {
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [0, 'Daily rate cannot be negative']
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative']
    },
    fuelIncluded: {
      type: Boolean,
      default: false
    },
    driverIncluded: {
      type: Boolean,
      default: false
    }
  },
  
  // Driver and Owner Information (both optional to support different use cases)
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Location and Availability
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: [
        'Colombo', 'Kandy', 'Galle', 'Negombo', 'Bentota', 'Hikkaduwa', 
        'Unawatuna', 'Mirissa', 'Weligama', 'Tangalle', 'Arugam Bay',
        'Nuwara Eliya', 'Ella', 'Bandarawela', 'Haputale',
        'Sigiriya', 'Dambulla', 'Anuradhapura', 'Polonnaruwa', 'Trincomalee',
        'Batticaloa', 'Jaffna', 'Kalpitiya', 'Chilaw', 'Puttalam'
      ]
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: [
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
        'Monaragala', 'Ratnapura', 'Kegalle'
      ]
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [5.9, 'Invalid latitude for Sri Lanka'],
        max: [9.8, 'Invalid latitude for Sri Lanka']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [79.7, 'Invalid longitude for Sri Lanka'],
        max: [81.9, 'Invalid longitude for Sri Lanka']
      }
    }
  },
  
  // Images
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
  
  // Insurance and Documentation
  insurance: {
    policyNumber: {
      type: String,
      required: [true, 'Insurance policy number is required']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Insurance expiry date is required']
    },
    coverage: {
      type: String,
      enum: ['comprehensive', 'third-party', 'full-coverage'],
      default: 'comprehensive'
    }
  },
  
  registration: {
    number: {
      type: String,
      required: [true, 'Registration number is required']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Registration expiry date is required']
    }
  },
  
  // Status and Availability
  status: {
    type: String,
    enum: ['pending', 'available', 'booked', 'maintenance', 'out-of-service', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  availability: {
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    workingHours: {
      start: {
        type: String,
        default: '06:00'
      },
      end: {
        type: String,
        default: '22:00'
      }
    },
    blockedDates: [{
      date: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        default: 'Not available'
      }
    }]
  },
  
  // Ratings and Reviews
  ratings: {
    overall: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness: { type: Number, default: 0, min: 0, max: 5 },
    comfort: { type: Number, default: 0, min: 0, max: 5 },
    driver: { type: Number, default: 0, min: 0, max: 5 },
    value: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Business Information
  isActive: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // Additional Information
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Approval Details
  approvalDetails: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    needsApproval: {
      type: Boolean,
      default: false
    },
    approvedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ 'location.city': 1 });
vehicleSchema.index({ 'location.district': 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ 'ratings.overall': -1 });
vehicleSchema.index({ featured: 1 });
vehicleSchema.index({ 'location.coordinates': '2dsphere' });
vehicleSchema.index({ driver: 1 });

// Virtual for primary image
vehicleSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for vehicle age
vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Method to check availability for specific dates
vehicleSchema.methods.isAvailable = function(startDate, endDate) {
  if (this.status !== 'available') return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check blocked dates
  for (const blockedDate of this.availability.blockedDates) {
    const blocked = new Date(blockedDate.date);
    if (blocked >= start && blocked <= end) {
      return false;
    }
  }
  
  return true;
};

// Method to calculate distance from a point
vehicleSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.location.coordinates.latitude) * Math.PI / 180;
  const dLng = (lng - this.location.coordinates.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Method to update ratings
vehicleSchema.methods.updateRatings = function() {
  // This would be called when a new review is added
  // Implementation would calculate average ratings from reviews
};

// Validation to ensure at least one of driver or owner is provided
vehicleSchema.pre('validate', function(next) {
  if (!this.driver && !this.owner) {
    return next(new Error('Either driver or owner must be specified'));
  }
  next();
});

// Pre-save middleware to ensure only one primary image
vehicleSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    }
  }
  next();
});

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
