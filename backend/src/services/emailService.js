const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.EMAIL_PASS || process.env.SENDGRID_API_KEY
      }
    });
  }

  async sendEmail(options) {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', options.email);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - SerendibGo</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SerendibGo!</h1>
              <p>Your adventure in Sri Lanka starts here</p>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering with SerendibGo! To complete your registration and start exploring amazing tours in Sri Lanka, please verify your email address.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>If you didn't create an account with SerendibGo, please ignore this email.</p>
              <p>&copy; 2024 SerendibGo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to SerendibGo!
      
      Thank you for registering with SerendibGo! To complete your registration and start exploring amazing tours in Sri Lanka, please verify your email address.
      
      Click this link to verify your email: ${verificationUrl}
      
      Note: This verification link will expire in 24 hours.
      
      If you didn't create an account with SerendibGo, please ignore this email.
      
      © 2024 SerendibGo. All rights reserved.
    `;

    await this.sendEmail({
      email,
      subject: 'Verify Your Email - SerendibGo',
      html,
      text
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - SerendibGo</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p>SerendibGo Account Security</p>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password for your SerendibGo account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in 10 minutes for your security.
              </div>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>If you have any concerns about your account security, please contact our support team.</p>
              <p>&copy; 2024 SerendibGo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request - SerendibGo
      
      We received a request to reset your password for your SerendibGo account.
      
      Click this link to reset your password: ${resetUrl}
      
      Security Notice: This password reset link will expire in 10 minutes for your security.
      
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      
      If you have any concerns about your account security, please contact our support team.
      
      © 2024 SerendibGo. All rights reserved.
    `;

    await this.sendEmail({
      email,
      subject: 'Reset Your Password - SerendibGo',
      html,
      text
    });
  }

  async sendBookingConfirmationEmail(bookingData) {
    const { booking, customTrip, tour, user, guide } = bookingData;
    
    // Determine if it's a custom trip or regular booking
    const isCustomTrip = !!customTrip;
    
    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Format currency
    const formatCurrency = (amount) => {
      return `LKR ${amount?.toLocaleString() || '0'}`;
    };

    let html, subject, text;

    if (isCustomTrip) {
      // Custom Trip Email Template
      const tripDetails = customTrip.requestDetails;
      const staffAssignment = customTrip.staffAssignment;
      const totalBudget = staffAssignment?.totalBudget || {};
      const itinerary = staffAssignment?.itinerary || [];
      const hotelBookings = staffAssignment?.hotelBookings || [];

      subject = `Custom Trip Confirmation - ${tripDetails?.destination || 'Sri Lanka'} | Serendib GO`;
      
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Custom Trip Confirmation - Serendib GO</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background: #f8fafc;
              }
              .email-container { 
                max-width: 700px; 
                margin: 0 auto; 
                background: #ffffff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border-radius: 12px;
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
              }
              .header-content { position: relative; z-index: 1; }
              .logo { 
                font-size: 36px; 
                font-weight: bold; 
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .header-subtitle { 
                font-size: 18px; 
                opacity: 0.9; 
                margin-bottom: 20px;
              }
              .confirmation-badge {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 8px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 1px solid rgba(255,255,255,0.3);
              }
              .content { 
                padding: 40px 30px; 
                background: #ffffff;
              }
              .greeting {
                font-size: 24px;
                color: #2d3748;
                margin-bottom: 30px;
                font-weight: 300;
              }
              .trip-overview { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                border-radius: 12px; 
                margin-bottom: 30px; 
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .trip-overview::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
              }
              @keyframes shimmer {
                0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
                50% { transform: translateX(100%) translateY(100%) rotate(30deg); }
              }
              .trip-content { position: relative; z-index: 1; }
              .trip-title { 
                font-size: 28px; 
                margin-bottom: 15px; 
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .trip-dates { 
                font-size: 18px; 
                margin-bottom: 20px;
                opacity: 0.9;
              }
              .trip-stats {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                flex-wrap: wrap;
              }
              .stat-item {
                text-align: center;
                margin: 10px;
              }
              .stat-value {
                font-size: 20px;
                font-weight: bold;
                display: block;
              }
              .stat-label {
                font-size: 12px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .section { 
                margin-bottom: 35px; 
              }
              .section-title { 
                font-size: 22px; 
                font-weight: bold; 
                color: #2d3748; 
                margin-bottom: 20px; 
                padding-bottom: 10px; 
                border-bottom: 3px solid #667eea;
                position: relative;
              }
              .section-title::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: 0;
                width: 50px;
                height: 3px;
                background: #764ba2;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
              }
              .info-card {
                background: #f8fafc;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #667eea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: transform 0.2s ease;
              }
              .info-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .info-label {
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
                font-weight: bold;
              }
              .info-value {
                font-size: 16px;
                color: #2d3748;
                font-weight: 500;
              }
              .budget-breakdown { 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 12px; 
                padding: 25px; 
                margin: 20px 0;
                border: 1px solid #e2e8f0;
              }
              .budget-item { 
                display: flex; 
                justify-content: space-between; 
                padding: 12px 0; 
                border-bottom: 1px solid #e2e8f0;
                font-size: 15px;
              }
              .budget-item:last-child { 
                border-bottom: none; 
                font-weight: bold; 
                font-size: 18px; 
                color: #667eea; 
                border-top: 2px solid #667eea; 
                margin-top: 15px; 
                padding-top: 20px;
                background: rgba(102, 126, 234, 0.05);
                border-radius: 8px;
                padding-left: 15px;
                padding-right: 15px;
              }
              .budget-label { 
                color: #4a5568; 
                font-weight: 500;
              }
              .budget-amount { 
                font-weight: bold; 
                color: #2d3748;
              }
              .itinerary-item { 
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                padding: 20px; 
                border-radius: 10px; 
                margin: 15px 0; 
                border-left: 4px solid #667eea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                border: 1px solid #e2e8f0;
              }
              .itinerary-day {
                font-size: 18px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
              }
              .itinerary-details {
                color: #4a5568;
                line-height: 1.6;
              }
              .hotel-item, .vehicle-item { 
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border: 1px solid #e2e8f0; 
                border-radius: 10px; 
                padding: 20px; 
                margin-bottom: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                border-left: 4px solid #667eea;
              }
              .hotel-name, .vehicle-type { 
                font-weight: bold; 
                color: #667eea; 
                font-size: 18px; 
                margin-bottom: 10px;
              }
              .hotel-details, .vehicle-details { 
                font-size: 14px; 
                color: #4a5568; 
                line-height: 1.6;
              }
              .special-requests {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 1px solid #f59e0b;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
              }
              .special-requests h4 {
                color: #92400e;
                margin-bottom: 10px;
                font-size: 16px;
              }
              .important-info {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 1px solid #3b82f6;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #3b82f6;
              }
              .important-info h4 {
                color: #1e40af;
                margin-bottom: 15px;
                font-size: 16px;
              }
              .important-info ul {
                list-style: none;
                padding: 0;
              }
              .important-info li {
                margin-bottom: 8px;
                color: #1e40af;
                position: relative;
                padding-left: 20px;
              }
              .important-info li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #3b82f6;
                font-weight: bold;
              }
              .footer { 
                background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
                color: white;
                text-align: center; 
                padding: 30px; 
                margin-top: 40px;
              }
              .footer-text { 
                color: #a0aec0; 
                font-size: 16px; 
                margin-bottom: 15px;
                font-weight: 300;
              }
              .contact-info { 
                color: #cbd5e0; 
                font-size: 14px; 
                margin-bottom: 10px;
              }
              .status-badge { 
                display: inline-block; 
                padding: 6px 15px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold; 
                text-transform: uppercase; 
                letter-spacing: 1px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .status-confirmed { 
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                color: #065f46;
                border: 1px solid #10b981;
              }
              .status-paid { 
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                color: #1e40af;
                border: 1px solid #3b82f6;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: transform 0.2s ease;
              }
              .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
              }
              @media (max-width: 600px) {
                .email-container { margin: 10px; border-radius: 8px; }
                .header, .content { padding: 20px; }
                .trip-stats { flex-direction: column; }
                .info-grid { grid-template-columns: 1fr; }
                .budget-item { flex-direction: column; gap: 5px; }
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <!-- Header -->
              <div class="header">
                <div class="header-content">
                  <div class="logo">🌴 Serendib GO</div>
                  <div class="header-subtitle">Your Gateway to Sri Lankan Adventures</div>
                  <div class="confirmation-badge">Custom Trip Confirmed</div>
                </div>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  Dear ${user?.firstName || ''} ${user?.lastName || ''},
                </div>

                <p style="font-size: 18px; color: #4a5568; margin-bottom: 30px; line-height: 1.6;">
                  We're thrilled to confirm your custom trip to <strong>${tripDetails?.destination || 'Sri Lanka'}</strong>! 
                  Your personalized adventure is all set, and we can't wait to show you the beauty of Sri Lanka.
                </p>

                <!-- Trip Overview -->
                <div class="trip-overview">
                  <div class="trip-content">
                    <div class="trip-title">🎯 Your Custom Trip</div>
                    <div class="trip-dates">${formatDate(tripDetails?.startDate)} - ${formatDate(tripDetails?.endDate)}</div>
                    <div class="trip-stats">
                      <div class="stat-item">
                        <span class="stat-value">${tripDetails?.groupSize || 'N/A'}</span>
                        <span class="stat-label">Travelers</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value">${Math.ceil((new Date(tripDetails?.endDate) - new Date(tripDetails?.startDate)) / (1000 * 60 * 60 * 24))}</span>
                        <span class="stat-label">Days</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value">${formatCurrency(totalBudget?.totalAmount || booking?.totalAmount)}</span>
                        <span class="stat-label">Total Cost</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Booking Information -->
                <div class="section">
                  <h2 class="section-title">📋 Booking Information</h2>
                  <div class="info-grid">
                    <div class="info-card">
                      <div class="info-label">Booking Reference</div>
                      <div class="info-value">${booking?.bookingReference || booking?._id || 'N/A'}</div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Status</div>
                      <div class="info-value">
                        <span class="status-badge status-confirmed">${booking?.status || customTrip?.status || 'Confirmed'}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Payment</div>
                      <div class="info-value">
                        <span class="status-badge status-paid">${booking?.paymentStatus || customTrip?.paymentStatus || 'Paid'}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Booking Date</div>
                      <div class="info-value">${formatDate(booking?.bookingDate || booking?.createdAt)}</div>
                    </div>
                  </div>
                </div>

                ${guide ? `
                <!-- Guide Information -->
                <div class="section">
                  <h2 class="section-title">👨‍🏫 Your Personal Guide</h2>
                  <div class="info-card">
                    <div class="info-label">Guide Name</div>
                    <div class="info-value" style="font-size: 20px; color: #667eea; font-weight: bold;">${guide?.firstName || ''} ${guide?.lastName || ''}</div>
                    <div style="margin-top: 15px;">
                      <div class="info-label">Contact Information</div>
                      <div class="info-value">📧 ${guide?.email || 'N/A'}</div>
                      <div class="info-value">📱 ${guide?.phone || 'N/A'}</div>
                      ${guide?.profile?.specialties ? `
                        <div class="info-value" style="margin-top: 10px;">
                          <strong>Specialties:</strong> ${guide.profile.specialties.join(', ')}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
                ` : ''}

                <!-- Cost Breakdown -->
                <div class="section">
                  <h2 class="section-title">💰 Cost Breakdown</h2>
                  <div class="budget-breakdown">
                    <div class="budget-item">
                      <span class="budget-label">Guide Fees</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.guideFees || 0)}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Vehicle Costs</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.vehicleCosts || 0)}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Hotel Accommodation</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.hotelCosts || 0)}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Activities & Experiences</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.activityCosts || 0)}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Additional Fees</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.additionalFees || 0)}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Total Amount</span>
                      <span class="budget-amount">${formatCurrency(totalBudget?.totalAmount || booking?.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                ${hotelBookings.length > 0 ? `
                <!-- Hotel Bookings -->
                <div class="section">
                  <h2 class="section-title">🏨 Accommodation Details</h2>
                  ${hotelBookings.map(hotel => `
                    <div class="hotel-item">
                      <div class="hotel-name">${hotel?.hotel?.name || 'Hotel Name'}</div>
                      <div class="hotel-details">
                        <div><strong>📍 Location:</strong> ${hotel?.city || hotel?.hotel?.location?.city || 'N/A'}</div>
                        <div><strong>🛏️ Room Type:</strong> ${hotel?.roomType || 'N/A'}</div>
                        <div><strong>📅 Check-in:</strong> ${formatDate(hotel?.checkInDate)}</div>
                        <div><strong>📅 Check-out:</strong> ${formatDate(hotel?.checkOutDate)}</div>
                        <div><strong>🌙 Nights:</strong> ${hotel?.nights || 'N/A'} | <strong>🏠 Rooms:</strong> ${hotel?.rooms || 'N/A'}</div>
                        <div><strong>💰 Total:</strong> ${formatCurrency(hotel?.totalPrice || 0)}</div>
                        ${hotel?.specialRequests ? `<div><strong>📝 Special Requests:</strong> ${hotel.specialRequests}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
                ` : ''}

                ${itinerary.length > 0 ? `
                <!-- Itinerary -->
                <div class="section">
                  <h2 class="section-title">🗓️ Your Daily Itinerary</h2>
                  ${itinerary.slice(0, 3).map(day => `
                    <div class="itinerary-item">
                      <div class="itinerary-day">Day ${day?.day || ''} - ${formatDate(day?.date)}</div>
                      <div class="itinerary-details">
                        <div><strong>📍 Location:</strong> ${day?.location || 'N/A'}</div>
                        <div><strong>🎯 Activities:</strong> ${day?.activities?.join(', ') || 'N/A'}</div>
                        <div><strong>🏨 Accommodation:</strong> ${day?.accommodation || 'N/A'}</div>
                        <div><strong>🍽️ Meals:</strong> ${day?.meals?.join(', ') || 'N/A'}</div>
                        ${day?.notes ? `<div><strong>📝 Notes:</strong> ${day.notes}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                  ${itinerary.length > 3 ? `
                    <div style="text-align: center; margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 10px; border: 1px solid #0ea5e9;">
                      <strong style="color: #0369a1;">✨ And ${itinerary.length - 3} more days of amazing experiences await you!</strong>
                    </div>
                  ` : ''}
                </div>
                ` : ''}

                ${tripDetails?.specialRequests ? `
                <!-- Special Requests -->
                <div class="special-requests">
                  <h4>📝 Your Special Requests</h4>
                  <p>${tripDetails.specialRequests}</p>
                </div>
                ` : ''}

                <!-- Important Information -->
                <div class="important-info">
                  <h4>📞 Important Information</h4>
                  <ul>
                    <li>Please arrive at the designated meeting point 15 minutes before departure</li>
                    <li>Keep this confirmation email handy during your trip</li>
                    <li>Contact your guide directly for any last-minute changes</li>
                    <li>For emergencies, contact our 24/7 support: +94 11 234 5678</li>
                    <li>Don't forget to bring your camera for amazing photo opportunities!</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL}/my-bookings" class="cta-button">
                    View Your Booking Details
                  </a>
                </div>

                <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 10px; border: 1px solid #0ea5e9;">
                  <p style="font-size: 18px; color: #0369a1; margin: 0;">
                    <strong>Thank you for choosing Serendib GO for your Sri Lankan adventure!</strong>
                  </p>
                  <p style="font-size: 14px; color: #0284c7; margin: 10px 0 0 0;">
                    We're excited to create unforgettable memories with you.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <div class="footer-text">
                  Need help? We're here for you!
                </div>
                <div class="contact-info">
                  📧 info@serendibgo.com | 📱 +94 11 234 5678
                </div>
                <div class="contact-info" style="margin-top: 15px; font-size: 12px;">
                  This confirmation was generated on ${formatDate(new Date())} | Invoice #${booking?.bookingReference || booking?._id || 'N/A'}
                </div>
                <div class="contact-info" style="margin-top: 10px; font-size: 12px;">
                  &copy; 2024 Serendib GO. All rights reserved.
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      text = `
        Custom Trip Confirmation - Serendib GO
        
        Dear ${user?.firstName || ''} ${user?.lastName || ''},
        
        Your custom trip to ${tripDetails?.destination || 'Sri Lanka'} has been confirmed!
        
        TRIP DETAILS:
        - Destination: ${tripDetails?.destination || 'Sri Lanka'}
        - Dates: ${formatDate(tripDetails?.startDate)} to ${formatDate(tripDetails?.endDate)}
        - Group Size: ${tripDetails?.groupSize || 'N/A'} people
        - Total Amount: ${formatCurrency(totalBudget?.totalAmount || booking?.totalAmount)}
        
        BOOKING INFORMATION:
        - Booking Reference: ${booking?.bookingReference || booking?._id || 'N/A'}
        - Status: ${booking?.status || customTrip?.status || 'Confirmed'}
        - Payment: ${booking?.paymentStatus || customTrip?.paymentStatus || 'Paid'}
        
        ${guide ? `
        YOUR GUIDE:
        - Name: ${guide?.firstName || ''} ${guide?.lastName || ''}
        - Email: ${guide?.email || 'N/A'}
        - Phone: ${guide?.phone || 'N/A'}
        ` : ''}
        
        IMPORTANT INFORMATION:
        - Please arrive at the designated meeting point 15 minutes before departure
        - Keep this confirmation email handy during your trip
        - Contact your guide directly for any last-minute changes
        - For emergencies, contact our 24/7 support: +94 11 234 5678
        
        Thank you for choosing Serendib GO for your Sri Lankan adventure!
        
        Best regards,
        The Serendib GO Team
        
        Need help? Contact us at info@serendibgo.com or +94 11 234 5678
        © 2024 Serendib GO. All rights reserved.
      `;

    } else {
      // Regular Tour Booking Email Template
      subject = `Tour Booking Confirmation - ${tour?.title || 'Serendib GO Tour'} | Serendib GO`;
      
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tour Booking Confirmation - Serendib GO</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background: #f8fafc;
              }
              .email-container { 
                max-width: 700px; 
                margin: 0 auto; 
                background: #ffffff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border-radius: 12px;
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
                position: relative;
                overflow: hidden;
              }
              .header-content { position: relative; z-index: 1; }
              .logo { 
                font-size: 36px; 
                font-weight: bold; 
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .header-subtitle { 
                font-size: 18px; 
                opacity: 0.9; 
                margin-bottom: 20px;
              }
              .confirmation-badge {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 8px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 1px solid rgba(255,255,255,0.3);
              }
              .content { 
                padding: 40px 30px; 
                background: #ffffff;
              }
              .greeting {
                font-size: 24px;
                color: #2d3748;
                margin-bottom: 30px;
                font-weight: 300;
              }
              .tour-overview { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                border-radius: 12px; 
                margin-bottom: 30px; 
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .tour-content { position: relative; z-index: 1; }
              .tour-title { 
                font-size: 28px; 
                margin-bottom: 15px; 
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .tour-dates { 
                font-size: 18px; 
                margin-bottom: 20px;
                opacity: 0.9;
              }
              .tour-stats {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                flex-wrap: wrap;
              }
              .stat-item {
                text-align: center;
                margin: 10px;
              }
              .stat-value {
                font-size: 20px;
                font-weight: bold;
                display: block;
              }
              .stat-label {
                font-size: 12px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .section { 
                margin-bottom: 35px; 
              }
              .section-title { 
                font-size: 22px; 
                font-weight: bold; 
                color: #2d3748; 
                margin-bottom: 20px; 
                padding-bottom: 10px; 
                border-bottom: 3px solid #667eea;
                position: relative;
              }
              .section-title::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: 0;
                width: 50px;
                height: 3px;
                background: #764ba2;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
              }
              .info-card {
                background: #f8fafc;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #667eea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: transform 0.2s ease;
              }
              .info-label {
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
                font-weight: bold;
              }
              .info-value {
                font-size: 16px;
                color: #2d3748;
                font-weight: 500;
              }
              .footer { 
                background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
                color: white;
                text-align: center; 
                padding: 30px; 
                margin-top: 40px;
              }
              .footer-text { 
                color: #a0aec0; 
                font-size: 16px; 
                margin-bottom: 15px;
                font-weight: 300;
              }
              .contact-info { 
                color: #cbd5e0; 
                font-size: 14px; 
                margin-bottom: 10px;
              }
              .status-badge { 
                display: inline-block; 
                padding: 6px 15px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold; 
                text-transform: uppercase; 
                letter-spacing: 1px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .status-confirmed { 
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                color: #065f46;
                border: 1px solid #10b981;
              }
              .status-paid { 
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                color: #1e40af;
                border: 1px solid #3b82f6;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: transform 0.2s ease;
              }
              .important-info {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 1px solid #3b82f6;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #3b82f6;
              }
              .important-info h4 {
                color: #1e40af;
                margin-bottom: 15px;
                font-size: 16px;
              }
              .important-info ul {
                list-style: none;
                padding: 0;
              }
              .important-info li {
                margin-bottom: 8px;
                color: #1e40af;
                position: relative;
                padding-left: 20px;
              }
              .important-info li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #3b82f6;
                font-weight: bold;
              }
              @media (max-width: 600px) {
                .email-container { margin: 10px; border-radius: 8px; }
                .header, .content { padding: 20px; }
                .tour-stats { flex-direction: column; }
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <!-- Header -->
              <div class="header">
                <div class="header-content">
                  <div class="logo">🌴 Serendib GO</div>
                  <div class="header-subtitle">Your Gateway to Sri Lankan Adventures</div>
                  <div class="confirmation-badge">Tour Booking Confirmed</div>
                </div>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  Dear ${user?.firstName || ''} ${user?.lastName || ''},
                </div>

                <p style="font-size: 18px; color: #4a5568; margin-bottom: 30px; line-height: 1.6;">
                  We're excited to confirm your tour booking! Your adventure in Sri Lanka is all set, 
                  and we can't wait to show you the amazing sights and experiences that await you.
                </p>

                <!-- Tour Overview -->
                <div class="tour-overview">
                  <div class="tour-content">
                    <div class="tour-title">🎯 ${tour?.title || 'Tour Booking'}</div>
                    <div class="tour-dates">${formatDate(booking?.startDate)} - ${formatDate(booking?.endDate)}</div>
                    <div class="tour-stats">
                      <div class="stat-item">
                        <span class="stat-value">${booking?.groupSize || 'N/A'}</span>
                        <span class="stat-label">Travelers</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value">${booking?.duration || 'N/A'}</span>
                        <span class="stat-label">Duration</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value">${formatCurrency(booking?.totalAmount)}</span>
                        <span class="stat-label">Total Cost</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Booking Information -->
                <div class="section">
                  <h2 class="section-title">📋 Booking Information</h2>
                  <div class="info-grid">
                    <div class="info-card">
                      <div class="info-label">Booking Reference</div>
                      <div class="info-value">${booking?.bookingReference || booking?._id || 'N/A'}</div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Status</div>
                      <div class="info-value">
                        <span class="status-badge status-confirmed">${booking?.status || 'Confirmed'}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Payment</div>
                      <div class="info-value">
                        <span class="status-badge status-paid">${booking?.paymentStatus || 'Paid'}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-label">Booking Date</div>
                      <div class="info-value">${formatDate(booking?.bookingDate || booking?.createdAt)}</div>
                    </div>
                  </div>
                </div>

                ${tour?.description ? `
                <!-- Tour Description -->
                <div class="section">
                  <h2 class="section-title">📖 Tour Description</h2>
                  <div class="info-card">
                    <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">${tour.description}</p>
                  </div>
                </div>
                ` : ''}

                ${guide ? `
                <!-- Guide Information -->
                <div class="section">
                  <h2 class="section-title">👨‍🏫 Your Personal Guide</h2>
                  <div class="info-card">
                    <div class="info-label">Guide Name</div>
                    <div class="info-value" style="font-size: 20px; color: #667eea; font-weight: bold;">${guide?.firstName || ''} ${guide?.lastName || ''}</div>
                    <div style="margin-top: 15px;">
                      <div class="info-label">Contact Information</div>
                      <div class="info-value">📧 ${guide?.email || 'N/A'}</div>
                      <div class="info-value">📱 ${guide?.phone || 'N/A'}</div>
                      ${guide?.profile?.specialties ? `
                        <div class="info-value" style="margin-top: 10px;">
                          <strong>Specialties:</strong> ${guide.profile.specialties.join(', ')}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
                ` : ''}

                ${booking?.specialRequests ? `
                <!-- Special Requests -->
                <div class="section">
                  <h2 class="section-title">📝 Special Requests</h2>
                  <div class="info-card">
                    <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">${booking.specialRequests}</p>
                  </div>
                </div>
                ` : ''}

                <!-- Important Information -->
                <div class="important-info">
                  <h4>📞 Important Information</h4>
                  <ul>
                    <li>Please arrive at the designated meeting point 15 minutes before departure</li>
                    <li>Keep this confirmation email handy during your trip</li>
                    <li>Contact your guide directly for any last-minute changes</li>
                    <li>For emergencies, contact our 24/7 support: +94 11 234 5678</li>
                    <li>Don't forget to bring your camera for amazing photo opportunities!</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL}/my-bookings" class="cta-button">
                    View Your Booking Details
                  </a>
                </div>

                <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 10px; border: 1px solid #0ea5e9;">
                  <p style="font-size: 18px; color: #0369a1; margin: 0;">
                    <strong>Thank you for choosing Serendib GO for your Sri Lankan adventure!</strong>
                  </p>
                  <p style="font-size: 14px; color: #0284c7; margin: 10px 0 0 0;">
                    We're excited to create unforgettable memories with you.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <div class="footer-text">
                  Need help? We're here for you!
                </div>
                <div class="contact-info">
                  📧 info@serendibgo.com | 📱 +94 11 234 5678
                </div>
                <div class="contact-info" style="margin-top: 15px; font-size: 12px;">
                  This confirmation was generated on ${formatDate(new Date())} | Booking #${booking?.bookingReference || booking?._id || 'N/A'}
                </div>
                <div class="contact-info" style="margin-top: 10px; font-size: 12px;">
                  &copy; 2024 Serendib GO. All rights reserved.
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      text = `
        Tour Booking Confirmation - Serendib GO
        
        Dear ${user?.firstName || ''} ${user?.lastName || ''},
        
        Your tour booking has been confirmed!
        
        TOUR DETAILS:
        - Tour: ${tour?.title || 'Tour Booking'}
        - Dates: ${formatDate(booking?.startDate)} to ${formatDate(booking?.endDate)}
        - Duration: ${booking?.duration || 'N/A'}
        - Group Size: ${booking?.groupSize || 'N/A'} people
        - Total Amount: ${formatCurrency(booking?.totalAmount)}
        
        BOOKING INFORMATION:
        - Booking Reference: ${booking?.bookingReference || booking?._id || 'N/A'}
        - Status: ${booking?.status || 'Confirmed'}
        - Payment: ${booking?.paymentStatus || 'Paid'}
        
        ${guide ? `
        YOUR GUIDE:
        - Name: ${guide?.firstName || ''} ${guide?.lastName || ''}
        - Email: ${guide?.email || 'N/A'}
        - Phone: ${guide?.phone || 'N/A'}
        ` : ''}
        
        IMPORTANT INFORMATION:
        - Please arrive at the designated meeting point 15 minutes before departure
        - Keep this confirmation email handy during your trip
        - Contact your guide directly for any last-minute changes
        - For emergencies, contact our 24/7 support: +94 11 234 5678
        
        Thank you for choosing Serendib GO for your Sri Lankan adventure!
        
        Best regards,
        The Serendib GO Team
        
        Need help? Contact us at info@serendibgo.com or +94 11 234 5678
        © 2024 Serendib GO. All rights reserved.
      `;
    }

    await this.sendEmail({
      email: user?.email,
      subject,
      html,
      text
    });
  }
}

module.exports = new EmailService();