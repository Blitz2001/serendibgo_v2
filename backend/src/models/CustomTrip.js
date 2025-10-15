const mongoose = require('mongoose');

const customTripSchema = new mongoose.Schema({
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  
  // Customer Request Details
  requestDetails: {
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      enum: [
        'Colombo', 'Kandy', 'Galle', 'Negombo', 'Bentota', 'Hikkaduwa', 
        'Unawatuna', 'Mirissa', 'Weligama', 'Tangalle', 'Arugam Bay',
        'Nuwara Eliya', 'Ella', 'Bandarawela', 'Haputale',
        'Sigiriya', 'Dambulla', 'Anuradhapura', 'Polonnaruwa', 'Trincomalee',
        'Batticaloa', 'Jaffna', 'Kalpitiya', 'Chilaw', 'Puttalam',
        'Multiple Cities', 'Sri Lanka'
      ]
    },
    destinations: [{
      type: String,
      trim: true,
      maxlength: [100, 'Destination name cannot exceed 100 characters']
    }],
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number, // in days
      min: 1
    },
    groupSize: {
      type: Number,
      required: [true, 'Group size is required'],
      min: [1, 'Group size must be at least 1'],
      max: [50, 'Group size cannot exceed 50']
    },
    budget: {
      type: String,
      required: [true, 'Budget is required']
    },
    budgetAmount: {
      type: Number,
      min: 0
    },
    interests: [{
      type: String,
      enum: ['culture', 'nature', 'adventure', 'beach', 'food', 'photography', 'shopping', 'nightlife']
    }],
    activities: [{
      id: String,
      label: String,
      price: Number
    }],
    accommodation: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury', 'resort', 'homestay'],
      default: 'mid-range'
    },
    transport: [{
      type: String,
      enum: ['bus', 'private-car', 'train', 'flight', 'boat', 'bike']
    }],
    specialRequests: {
      type: String,
      maxlength: [1000, 'Special requests cannot exceed 1000 characters']
    },
    dietaryRequirements: {
      type: String,
      maxlength: [500, 'Dietary requirements cannot exceed 500 characters']
    },
    accessibility: {
      type: String,
      maxlength: [500, 'Accessibility requirements cannot exceed 500 characters']
    },
    emergencyContact: {
      type: String
    },
    contactInfo: {
      name: {
        type: String,
        required: [true, 'Contact name is required']
      },
      email: {
        type: String,
        required: [true, 'Contact email is required']
      },
      phone: {
        type: String,
        required: [true, 'Contact phone is required']
      },
      emergencyContact: String
    }
  },

  // Staff Assignment Details
  staffAssignment: {
    assignedGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedVehicles: [{
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
      },
      vehicleType: String,
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dailyRate: Number,
      totalDays: Number
    }],
    hotelBookings: [{
      hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel'
      },
      roomType: String,
      checkInDate: Date,
      checkOutDate: Date,
      nights: Number,
      rooms: Number,
      pricePerNight: Number,
      totalPrice: Number,
      city: String,
      specialRequests: String
    }],
    totalBudget: {
      guideFees: {
        type: Number,
        default: 0
      },
      vehicleCosts: {
        type: Number,
        default: 0
      },
      hotelCosts: {
        type: Number,
        default: 0
      },
      activityCosts: {
        type: Number,
        default: 0
      },
      additionalFees: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      }
    },
    itinerary: [{
      day: Number,
      date: Date,
      location: String,
      activities: [String],
      accommodation: String,
      meals: [String],
      transport: String,
      notes: String
    }],
    additionalNotes: {
      type: String,
      maxlength: [2000, 'Additional notes cannot exceed 2000 characters']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date
  },

  // Status and Workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'confirmed', 'completed', 'cancelled', 'in_progress'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Approval Details
  approvalDetails: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    staffComments: String,
    customerFeedback: String
  },

  // Staff Response
  staffResponse: {
    message: {
      type: String
    },
    estimatedPrice: {
      type: Number
    },
    suggestedDates: [{
      type: Date
    }],
    alternativeOptions: [{
      type: String
    }],
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },

  // Booking Integration
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  // Payment Details
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },

  // Additional Information
  notes: {
    type: String
  },
  tags: [{
    type: String
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
customTripSchema.index({ customer: 1 });
customTripSchema.index({ status: 1 });
customTripSchema.index({ priority: 1 });
customTripSchema.index({ 'requestDetails.startDate': 1 });
customTripSchema.index({ 'requestDetails.endDate': 1 });
customTripSchema.index({ 'staffAssignment.assignedGuide': 1 });
customTripSchema.index({ createdAt: -1 });
customTripSchema.index({ destination: 'text', specialRequests: 'text' });

// Virtual for trip duration
customTripSchema.virtual('duration').get(function() {
  if (this.requestDetails.startDate && this.requestDetails.endDate) {
    const diffTime = Math.abs(this.requestDetails.endDate - this.requestDetails.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return this.requestDetails.duration || 0;
});

// Virtual for calculated duration
customTripSchema.virtual('calculatedDuration').get(function() {
  if (this.requestDetails.startDate && this.requestDetails.endDate) {
    const diffTime = Math.abs(this.requestDetails.endDate - this.requestDetails.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return this.requestDetails.duration;
});

// Virtual for days until trip
customTripSchema.virtual('daysUntilTrip').get(function() {
  if (this.requestDetails.startDate) {
    const diffTime = this.requestDetails.startDate - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for budget per person
customTripSchema.virtual('budgetPerPerson').get(function() {
  if (this.requestDetails.budgetAmount && this.requestDetails.groupSize) {
    return this.requestDetails.budgetAmount / this.requestDetails.groupSize;
  }
  return 0;
});

// Method to calculate total budget
customTripSchema.methods.calculateTotalBudget = function() {
  if (this.staffAssignment && this.staffAssignment.totalBudget) {
    const budget = this.staffAssignment.totalBudget;
    budget.totalAmount = budget.guideFees + budget.vehicleCosts + budget.hotelCosts + 
                        budget.activityCosts + budget.additionalFees;
    return budget.totalAmount;
  }
  return 0;
};

// Method to check if trip can be approved
customTripSchema.methods.canBeApproved = function() {
  // Allow approval for pending, under_review, and also if no status is set
  return !this.status || this.status === 'pending' || this.status === 'under_review';
};

// Method to check if trip can be confirmed
customTripSchema.methods.canBeConfirmed = function() {
  return this.status === 'approved';
};

// Method to check if trip is overdue
customTripSchema.methods.isOverdue = function() {
  if (this.status === 'pending' && this.requestDetails.startDate) {
    return new Date() > this.requestDetails.startDate;
  }
  return false;
};

// Method to get trip summary
customTripSchema.methods.getSummary = function() {
  return {
    id: this._id,
    destination: this.requestDetails.destination || this.requestDetails.destinations?.[0] || 'Multiple destinations',
    customer: this.customerName,
    status: this.status,
    priority: this.priority,
    budget: this.requestDetails.budgetAmount || this.requestDetails.budget,
    groupSize: this.requestDetails.groupSize,
    createdAt: this.createdAt
  };
};

// Pre-save middleware to update timestamps and calculate totals
customTripSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total budget if staff assignment exists
  if (this.staffAssignment && this.staffAssignment.totalBudget) {
    this.calculateTotalBudget();
  }
  
  next();
});

module.exports = mongoose.model('CustomTrip', customTripSchema);