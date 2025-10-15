const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (booking, user) => {
  try {
    const transporter = createTransporter();
    
    const bookingType = booking.tour ? 'Tour' : 
                       booking.guide ? 'Guide Service' : 
                       booking.vehicle ? 'Vehicle Rental' : 
                       booking.customTrip ? 'Custom Trip' : 'Booking';
    
    const bookingDetails = booking.tour ? {
      name: booking.tour.title,
      description: booking.tour.description,
      startDate: booking.startDate,
      endDate: booking.endDate,
      groupSize: booking.groupSize
    } : booking.guide ? {
      name: `${booking.guide.firstName} ${booking.guide.lastName}`,
      description: 'Personal Guide Service',
      startDate: booking.startDate,
      endDate: booking.endDate,
      groupSize: booking.groupSize
    } : booking.vehicle ? {
      name: `${booking.vehicle.make} ${booking.vehicle.model}`,
      description: 'Vehicle Rental',
      startDate: booking.startDate,
      endDate: booking.endDate,
      groupSize: booking.groupSize
    } : booking.customTrip ? {
      name: 'Custom Trip',
      description: 'Personalized Travel Experience',
      startDate: booking.startDate,
      endDate: booking.endDate,
      groupSize: booking.groupSize
    } : {};

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Payment Confirmation - ${bookingType} Booking`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Confirmed!</h1>
              <p>Your ${bookingType} booking has been successfully paid</p>
            </div>
            
            <div class="content">
              <h2>Booking Details</h2>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span>${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span>${bookingDetails.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Description:</span>
                  <span>${bookingDetails.description}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Date:</span>
                  <span>${new Date(bookingDetails.startDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">End Date:</span>
                  <span>${new Date(bookingDetails.endDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Group Size:</span>
                  <span>${bookingDetails.groupSize} ${bookingDetails.groupSize === 1 ? 'person' : 'people'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount Paid:</span>
                  <span class="total">$${booking.amountPaid}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Date:</span>
                  <span>${new Date(booking.paymentDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <p>Thank you for choosing Serendib GO! We're excited to provide you with an amazing experience.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-bookings" class="button">
                  View My Bookings
                </a>
              </div>
              
              <div class="footer">
                <p>If you have any questions, please contact our support team at support@serendibgo.com</p>
                <p>Serendib GO - Your Gateway to Sri Lanka</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};

// Send payment failure email
const sendPaymentFailureEmail = async (booking, user, errorMessage) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Payment Failed - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
              <p>We were unable to process your payment</p>
            </div>
            
            <div class="content">
              <div class="alert">
                <strong>Booking Reference:</strong> ${booking.bookingReference}<br>
                <strong>Error:</strong> ${errorMessage}
              </div>
              
              <p>Your booking is still pending payment. Please try again or contact our support team for assistance.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${booking._id}" class="button">
                  Retry Payment
                </a>
              </div>
              
              <div class="footer">
                <p>If you continue to experience issues, please contact our support team at support@serendibgo.com</p>
                <p>Serendib GO - Your Gateway to Sri Lanka</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment failure email sent to:', user.email);
  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
};

// Send refund confirmation email
const sendRefundConfirmationEmail = async (booking, user, refundAmount) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Refund Processed - Serendib GO',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Refund Processed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .refund-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
            .refund-amount { font-size: 18px; font-weight: bold; color: #059669; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Refund Processed</h1>
              <p>Your refund has been successfully processed</p>
            </div>
            
            <div class="content">
              <h2>Refund Details</h2>
              <div class="refund-details">
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span>${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Refund Amount:</span>
                  <span class="refund-amount">$${refundAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Refund Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Processing Time:</span>
                  <span>3-5 business days</span>
                </div>
              </div>
              
              <p>The refund will be credited back to your original payment method within 3-5 business days.</p>
              
              <div class="footer">
                <p>If you have any questions about this refund, please contact our support team at support@serendibgo.com</p>
                <p>Serendib GO - Your Gateway to Sri Lanka</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Refund confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending refund confirmation email:', error);
  }
};

module.exports = {
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
  sendRefundConfirmationEmail
};
