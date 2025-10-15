const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const User = require('../models/User');
const CustomTrip = require('../models/CustomTrip');
const asyncHandler = require('express-async-handler');

// Debug Stripe key
console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
const { 
  sendPaymentConfirmationEmail, 
  sendPaymentFailureEmail, 
  sendRefundConfirmationEmail 
} = require('../services/paymentEmailService');

// @desc    Create payment intent for guest booking
// @route   POST /api/payments/create-guest-intent
// @access  Public
const createGuestPaymentIntent = asyncHandler(async (req, res) => {
  try {
    const { bookingId, amount, currency = 'LKR', customerEmail, customerName } = req.body;

    // Validate required fields
    if (!bookingId || !amount || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, amount, and customer email are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('guide');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Convert amount to cents (Stripe expects amounts in smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId,
        customerEmail: customerEmail,
        customerName: customerName || 'Guest',
        bookingReference: booking.bookingReference
      },
      description: `Payment for booking ${booking.bookingReference}`,
      receipt_email: customerEmail
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    console.log('✅ Guest payment intent created and stored:', {
      paymentIntentId: paymentIntent.id,
      bookingId: booking._id,
      bookingReference: booking.bookingReference
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency
      }
    });

  } catch (error) {
    console.error('Error creating guest payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @desc    Create payment intent for booking
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  try {
    const { bookingId, amount, currency = 'LKR' } = req.body;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and amount are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('user guide');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Convert amount to cents (Stripe expects amounts in smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId,
        userId: req.user._id.toString(),
        bookingReference: booking.bookingReference
      },
      description: `Payment for booking ${booking.bookingReference}`,
      receipt_email: booking.user.email
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @desc    Confirm payment and update booking status
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    console.log('🔍 Confirming payment:', { paymentIntentId });

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('💳 Stripe payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Find booking by payment intent ID
    const booking = await Booking.findOne({ paymentIntentId }).populate('user guide');
    console.log('📋 Found booking:', booking ? booking._id : 'NOT FOUND');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking with payment details
    booking.paymentStatus = 'paid';
    booking.amountPaid = paymentIntent.amount / 100; // Convert from cents
    booking.paymentDate = new Date();
    booking.status = 'confirmed';
    await booking.save();

    console.log('✅ Booking updated successfully:', {
      bookingId: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amountPaid: booking.amountPaid
    });

    // If this is a custom trip booking, update the custom trip status
    if (booking.customTrip) {
      try {
        const customTrip = await CustomTrip.findById(booking.customTrip);
        if (customTrip) {
          customTrip.status = 'confirmed';
          customTrip.paymentStatus = 'paid';
          await customTrip.save();
          console.log('Custom trip status updated:', customTrip._id);
        }
      } catch (customTripError) {
        console.error('Failed to update custom trip status:', customTripError);
        // Don't fail the payment if custom trip update fails
      }
    }

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(booking, booking.user);
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        booking: booking,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100
        }
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @desc    Confirm guest payment and update booking status
// @route   POST /api/payments/confirm-guest
// @access  Public
const confirmGuestPayment = asyncHandler(async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    console.log('🔍 Confirming guest payment:', { paymentIntentId });

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('💳 Stripe guest payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Find booking by payment intent ID
    const booking = await Booking.findOne({ paymentIntentId }).populate('user guide');
    console.log('📋 Found guest booking:', booking ? booking._id : 'NOT FOUND');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking with payment details
    booking.paymentStatus = 'paid';
    booking.amountPaid = paymentIntent.amount / 100; // Convert from cents
    booking.paymentDate = new Date();
    booking.status = 'confirmed';
    await booking.save();

    console.log('✅ Guest booking updated successfully:', {
      bookingId: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amountPaid: booking.amountPaid
    });

    // If this is a custom trip booking, update the custom trip status
    if (booking.customTrip) {
      try {
        const customTrip = await CustomTrip.findById(booking.customTrip);
        if (customTrip) {
          customTrip.status = 'confirmed';
          customTrip.paymentStatus = 'paid';
          await customTrip.save();
          console.log('Custom trip status updated:', customTrip._id);
        }
      } catch (customTripError) {
        console.error('Failed to update custom trip status:', customTripError);
      }
    }

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(booking, booking.user);
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amountPaid: booking.amountPaid
      }
    });

  } catch (error) {
    console.error('Error confirming guest payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @desc    Handle Stripe webhook events
// @route   POST /api/payments/webhook
// @access  Public (Stripe webhook)
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Find and update booking
      const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id }).populate('user');
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.amountPaid = paymentIntent.amount / 100;
        booking.paymentDate = new Date();
        booking.status = 'confirmed';
        await booking.save();
        
        // If this is a custom trip booking, update the custom trip status
        if (booking.customTrip) {
          try {
            const customTrip = await CustomTrip.findById(booking.customTrip);
            if (customTrip) {
              customTrip.status = 'confirmed';
              customTrip.paymentStatus = 'paid';
              await customTrip.save();
              console.log('Custom trip status updated via webhook:', customTrip._id);
            }
          } catch (customTripError) {
            console.error('Failed to update custom trip status via webhook:', customTripError);
          }
        }
        
        // Send payment confirmation email
        try {
          await sendPaymentConfirmationEmail(booking, booking.user);
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
        }
        
        console.log('Booking updated:', booking._id);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // Find and update booking
      const failedBooking = await Booking.findOne({ paymentIntentId: failedPayment.id });
      if (failedBooking) {
        failedBooking.paymentStatus = 'failed';
        await failedBooking.save();
        
        console.log('Booking payment failed:', failedBooking._id);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @desc    Get payment status for a booking
// @route   GET /api/payments/status/:bookingId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('user guide');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        amountPaid: booking.amountPaid,
        totalAmount: booking.totalAmount,
        paymentDate: booking.paymentDate,
        paymentIntentId: booking.paymentIntentId,
        bookingStatus: booking.status
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
});

// @desc    Process refund for a booking
// @route   POST /api/payments/refund/:bookingId
// @access  Private
const processRefund = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, reason } = req.body;

    const booking = await Booking.findById(bookingId).populate('user guide');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to the user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this booking'
      });
    }

    if (!booking.paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this booking'
      });
    }

    // Create refund in Stripe
    const refundAmount = amount ? Math.round(amount * 100) : undefined; // Convert to cents
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: refundAmount,
      reason: reason || 'requested_by_customer'
    });

    // Update booking status
    booking.paymentStatus = 'refunded';
    booking.refundAmount = refund.amount / 100;
    booking.status = 'cancelled';
    await booking.save();

    // Send refund confirmation email
    try {
      await sendRefundConfirmationEmail(booking, booking.user, refund.amount / 100);
    } catch (emailError) {
      console.error('Failed to send refund confirmation email:', emailError);
      // Don't fail the refund if email fails
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

module.exports = {
  createPaymentIntent,
  createGuestPaymentIntent,
  confirmPayment,
  confirmGuestPayment,
  handleWebhook,
  getPaymentStatus,
  processRefund
};
