const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
    // Tour is optional - validation handled in controller
  },
  customTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTrip'
  },
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Guide is required']
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    type: String,
    enum: ['half-day', 'full-day', 'multi-day'],
    required: [true, 'Duration is required']
  },
  groupSize: {
    type: Number,
    required: [true, 'Group size is required'],
    min: [1, 'Group size must be at least 1'],
    max: [50, 'Group size cannot exceed 50']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'bank_transfer'],
    default: 'card'
  },
  paymentIntentId: {
    type: String,
    sparse: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  cancellationReason: String,
  refundAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookingReference: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ tour: 1 });
bookingSchema.index({ guide: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
