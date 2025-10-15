const puppeteer = require('puppeteer');
const path = require('path');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateCustomTripInvoice(bookingData) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Generate HTML content for the invoice
      const htmlContent = this.generateInvoiceHTML(bookingData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with professional styling
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate()
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  generateInvoiceHTML(bookingData) {
    const { booking, customTrip, user, guide } = bookingData;
    const tripDetails = customTrip.requestDetails;
    const staffAssignment = customTrip.staffAssignment;
    const totalBudget = staffAssignment?.totalBudget || {};
    const itinerary = staffAssignment?.itinerary || [];
    const hotelBookings = staffAssignment?.hotelBookings || [];
    const assignedVehicles = staffAssignment?.assignedVehicles || [];

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

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Custom Trip Invoice - Serendib GO</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }

          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }

          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }

          .company-info {
            color: #666;
            font-size: 14px;
          }

          .invoice-title {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }

          .invoice-info, .customer-info {
            flex: 1;
          }

          .info-section h3 {
            color: #2563eb;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
          }

          .info-item {
            margin-bottom: 8px;
            font-size: 14px;
          }

          .info-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 120px;
          }

          .trip-overview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
          }

          .trip-overview h2 {
            font-size: 24px;
            margin-bottom: 15px;
            text-align: center;
          }

          .trip-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }

          .trip-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }

          .trip-item-label {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .trip-item-value {
            font-size: 16px;
            font-weight: bold;
          }

          .section {
            margin-bottom: 30px;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }

          .budget-breakdown {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .budget-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .budget-item:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            margin-top: 10px;
            padding-top: 15px;
          }

          .budget-label {
            color: #374151;
          }

          .budget-amount {
            font-weight: bold;
            color: #1f2937;
          }

          .itinerary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .itinerary-table th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }

          .itinerary-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }

          .itinerary-table tr:nth-child(even) {
            background: #f9fafb;
          }

          .hotel-item, .vehicle-item {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
          }

          .hotel-name, .vehicle-type {
            font-weight: bold;
            color: #2563eb;
            font-size: 16px;
            margin-bottom: 8px;
          }

          .hotel-details, .vehicle-details {
            font-size: 14px;
            color: #6b7280;
          }

          .special-requests {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
          }

          .special-requests h4 {
            color: #92400e;
            margin-bottom: 10px;
          }

          .footer {
            margin-top: 50px;
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-top: 3px solid #2563eb;
          }

          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }

          .contact-info {
            color: #374151;
            font-size: 12px;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .status-confirmed {
            background: #d1fae5;
            color: #065f46;
          }

          .status-paid {
            background: #dbeafe;
            color: #1e40af;
          }

          @media print {
            .invoice-container {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="logo">🌴 Serendib GO</div>
            <div class="company-info">
              Your Gateway to Sri Lankan Adventures<br>
              Email: info@serendibgo.com | Phone: +94 11 234 5678<br>
              Web: www.serendibgo.com
            </div>
          </div>

          <!-- Invoice Title -->
          <div class="invoice-title">Custom Trip Invoice</div>

          <!-- Invoice Details -->
          <div class="invoice-details">
            <div class="invoice-info">
              <div class="info-section">
                <h3>Invoice Details</h3>
                <div class="info-item">
                  <span class="info-label">Invoice #:</span>
                  ${booking?.bookingReference || booking?._id || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Issue Date:</span>
                  ${formatDate(new Date())}
                </div>
                <div class="info-item">
                  <span class="info-label">Trip ID:</span>
                  ${customTrip?._id || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="status-badge status-confirmed">${booking?.status || customTrip?.status || 'Confirmed'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment:</span>
                  <span class="status-badge status-paid">${booking?.paymentStatus || customTrip?.paymentStatus || 'Paid'}</span>
                </div>
              </div>
            </div>
            <div class="customer-info">
              <div class="info-section">
                <h3>Customer Information</h3>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  ${user?.firstName || ''} ${user?.lastName || ''}
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  ${user?.email || ''}
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  ${user?.phone || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Group Size:</span>
                  ${tripDetails?.groupSize || 'N/A'} people
                </div>
              </div>
            </div>
          </div>

          <!-- Trip Overview -->
          <div class="trip-overview">
            <h2>🎯 Your Custom Trip to ${tripDetails?.destination || 'Sri Lanka'}</h2>
            <div class="trip-grid">
              <div class="trip-item">
                <div class="trip-item-label">Start Date</div>
                <div class="trip-item-value">${formatDate(tripDetails?.startDate)}</div>
              </div>
              <div class="trip-item">
                <div class="trip-item-label">End Date</div>
                <div class="trip-item-value">${formatDate(tripDetails?.endDate)}</div>
              </div>
              <div class="trip-item">
                <div class="trip-item-label">Duration</div>
                <div class="trip-item-value">${Math.ceil((new Date(tripDetails?.endDate) - new Date(tripDetails?.startDate)) / (1000 * 60 * 60 * 24))} days</div>
              </div>
              <div class="trip-item">
                <div class="trip-item-label">Total Amount</div>
                <div class="trip-item-value">${formatCurrency(totalBudget?.totalAmount || booking?.totalAmount)}</div>
              </div>
            </div>
          </div>

          <!-- Budget Breakdown -->
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

          <!-- Guide Information -->
          ${guide ? `
          <div class="section">
            <h2 class="section-title">👨‍🏫 Your Guide</h2>
            <div class="hotel-item">
              <div class="hotel-name">${guide?.firstName || ''} ${guide?.lastName || ''}</div>
              <div class="hotel-details">
                Email: ${guide?.email || 'N/A'}<br>
                Phone: ${guide?.phone || 'N/A'}<br>
                Specialties: ${guide?.profile?.specialties?.join(', ') || 'General Tourism'}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Hotel Bookings -->
          ${hotelBookings.length > 0 ? `
          <div class="section">
            <h2 class="section-title">🏨 Accommodation Details</h2>
            ${hotelBookings.map(hotel => `
              <div class="hotel-item">
                <div class="hotel-name">${hotel?.hotel?.name || 'Hotel Name'}</div>
                <div class="hotel-details">
                  Location: ${hotel?.city || hotel?.hotel?.location?.city || 'N/A'}<br>
                  Room Type: ${hotel?.roomType || 'N/A'}<br>
                  Check-in: ${formatDate(hotel?.checkInDate)}<br>
                  Check-out: ${formatDate(hotel?.checkOutDate)}<br>
                  Nights: ${hotel?.nights || 'N/A'}<br>
                  Rooms: ${hotel?.rooms || 'N/A'}<br>
                  Price per Night: ${formatCurrency(hotel?.pricePerNight || 0)}<br>
                  Total: ${formatCurrency(hotel?.totalPrice || 0)}
                  ${hotel?.specialRequests ? `<br>Special Requests: ${hotel.specialRequests}` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Vehicle Assignments -->
          ${assignedVehicles.length > 0 ? `
          <div class="section">
            <h2 class="section-title">🚗 Transportation</h2>
            ${assignedVehicles.map(vehicle => `
              <div class="vehicle-item">
                <div class="vehicle-type">${vehicle?.vehicleType || 'Vehicle'}</div>
                <div class="vehicle-details">
                  Driver: ${vehicle?.driver?.firstName || ''} ${vehicle?.driver?.lastName || ''}<br>
                  Daily Rate: ${formatCurrency(vehicle?.dailyRate || 0)}<br>
                  Total Days: ${vehicle?.totalDays || 'N/A'}<br>
                  Total Cost: ${formatCurrency((vehicle?.dailyRate || 0) * (vehicle?.totalDays || 0))}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Itinerary -->
          ${itinerary.length > 0 ? `
          <div class="section">
            <h2 class="section-title">🗓️ Daily Itinerary</h2>
            <table class="itinerary-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Activities</th>
                  <th>Accommodation</th>
                  <th>Meals</th>
                </tr>
              </thead>
              <tbody>
                ${itinerary.map(day => `
                  <tr>
                    <td>Day ${day?.day || ''}</td>
                    <td>${formatDate(day?.date)}</td>
                    <td>${day?.location || 'N/A'}</td>
                    <td>${day?.activities?.join(', ') || 'N/A'}</td>
                    <td>${day?.accommodation || 'N/A'}</td>
                    <td>${day?.meals?.join(', ') || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Special Requests -->
          ${tripDetails?.specialRequests ? `
          <div class="special-requests">
            <h4>📝 Special Requests & Notes</h4>
            <p>${tripDetails.specialRequests}</p>
          </div>
          ` : ''}

          <!-- Dietary & Accessibility -->
          ${(tripDetails?.dietaryRequirements || tripDetails?.accessibility) ? `
          <div class="section">
            <h2 class="section-title">ℹ️ Additional Information</h2>
            ${tripDetails?.dietaryRequirements ? `
              <div class="info-item">
                <span class="info-label">Dietary Requirements:</span>
                ${tripDetails.dietaryRequirements}
              </div>
            ` : ''}
            ${tripDetails?.accessibility ? `
              <div class="info-item">
                <span class="info-label">Accessibility Needs:</span>
                ${tripDetails.accessibility}
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">
              Thank you for choosing Serendib GO for your Sri Lankan adventure!
            </div>
            <div class="contact-info">
              For any questions or support, contact us at info@serendibgo.com or +94 11 234 5678
            </div>
            <div class="contact-info" style="margin-top: 10px;">
              This invoice was generated on ${formatDate(new Date())} | Invoice #${booking?.bookingReference || booking?._id || 'N/A'}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getHeaderTemplate() {
    return `
      <div style="font-size: 10px; padding: 5px; text-align: center; width: 100%; color: #666;">
        Serendib GO - Custom Trip Invoice
      </div>
    `;
  }

  getFooterTemplate() {
    return `
      <div style="font-size: 10px; padding: 5px; text-align: center; width: 100%; color: #666;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span> | 
        Generated on ${new Date().toLocaleDateString()}
      </div>
    `;
  }

  async generateRegularBookingPDF(bookingData) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      const htmlContent = this.generateRegularBookingHTML(bookingData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate()
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  generateRegularBookingHTML(bookingData) {
    const { booking, tour, user, guide } = bookingData;

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount) => {
      return `LKR ${amount?.toLocaleString() || '0'}`;
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - Serendib GO</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }

          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }

          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }

          .company-info {
            color: #666;
            font-size: 14px;
          }

          .invoice-title {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .booking-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }

          .booking-info, .customer-info {
            flex: 1;
          }

          .info-section h3 {
            color: #2563eb;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
          }

          .info-item {
            margin-bottom: 8px;
            font-size: 14px;
          }

          .info-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 120px;
          }

          .tour-overview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
          }

          .tour-overview h2 {
            font-size: 24px;
            margin-bottom: 15px;
            text-align: center;
          }

          .tour-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }

          .tour-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }

          .tour-item-label {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .tour-item-value {
            font-size: 16px;
            font-weight: bold;
          }

          .section {
            margin-bottom: 30px;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }

          .guide-info {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .guide-name {
            font-weight: bold;
            color: #2563eb;
            font-size: 18px;
            margin-bottom: 10px;
          }

          .guide-details {
            font-size: 14px;
            color: #6b7280;
          }

          .footer {
            margin-top: 50px;
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-top: 3px solid #2563eb;
          }

          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }

          .contact-info {
            color: #374151;
            font-size: 12px;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .status-confirmed {
            background: #d1fae5;
            color: #065f46;
          }

          .status-paid {
            background: #dbeafe;
            color: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="logo">🌴 Serendib GO</div>
            <div class="company-info">
              Your Gateway to Sri Lankan Adventures<br>
              Email: info@serendibgo.com | Phone: +94 11 234 5678<br>
              Web: www.serendibgo.com
            </div>
          </div>

          <!-- Invoice Title -->
          <div class="invoice-title">Booking Confirmation</div>

          <!-- Booking Details -->
          <div class="booking-details">
            <div class="booking-info">
              <div class="info-section">
                <h3>Booking Details</h3>
                <div class="info-item">
                  <span class="info-label">Booking #:</span>
                  ${booking?.bookingReference || booking?._id || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Booking Date:</span>
                  ${formatDate(booking?.bookingDate || booking?.createdAt)}
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="status-badge status-confirmed">${booking?.status || 'Confirmed'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment:</span>
                  <span class="status-badge status-paid">${booking?.paymentStatus || 'Paid'}</span>
                </div>
              </div>
            </div>
            <div class="customer-info">
              <div class="info-section">
                <h3>Customer Information</h3>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  ${user?.firstName || ''} ${user?.lastName || ''}
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  ${user?.email || ''}
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  ${user?.phone || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Group Size:</span>
                  ${booking?.groupSize || 'N/A'} people
                </div>
              </div>
            </div>
          </div>

          <!-- Tour Overview -->
          <div class="tour-overview">
            <h2>🎯 ${tour?.title || 'Tour Booking'}</h2>
            <div class="tour-grid">
              <div class="tour-item">
                <div class="tour-item-label">Start Date</div>
                <div class="tour-item-value">${formatDate(booking?.startDate)}</div>
              </div>
              <div class="tour-item">
                <div class="tour-item-label">End Date</div>
                <div class="tour-item-value">${formatDate(booking?.endDate)}</div>
              </div>
              <div class="tour-item">
                <div class="tour-item-label">Duration</div>
                <div class="tour-item-value">${booking?.duration || 'N/A'}</div>
              </div>
              <div class="tour-item">
                <div class="tour-item-label">Total Amount</div>
                <div class="tour-item-value">${formatCurrency(booking?.totalAmount)}</div>
              </div>
            </div>
          </div>

          <!-- Tour Description -->
          ${tour?.description ? `
          <div class="section">
            <h2 class="section-title">📖 Tour Description</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.8;">
              ${tour.description}
            </div>
          </div>
          ` : ''}

          <!-- Guide Information -->
          ${guide ? `
          <div class="section">
            <h2 class="section-title">👨‍🏫 Your Guide</h2>
            <div class="guide-info">
              <div class="guide-name">${guide?.firstName || ''} ${guide?.lastName || ''}</div>
              <div class="guide-details">
                Email: ${guide?.email || 'N/A'}<br>
                Phone: ${guide?.phone || 'N/A'}<br>
                Specialties: ${guide?.profile?.specialties?.join(', ') || 'General Tourism'}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Special Requests -->
          ${booking?.specialRequests ? `
          <div class="section">
            <h2 class="section-title">📝 Special Requests</h2>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px;">
              <p>${booking.specialRequests}</p>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">
              Thank you for choosing Serendib GO for your Sri Lankan adventure!
            </div>
            <div class="contact-info">
              For any questions or support, contact us at info@serendibgo.com or +94 11 234 5678
            </div>
            <div class="contact-info" style="margin-top: 10px;">
              This confirmation was generated on ${formatDate(new Date())} | Booking #${booking?.bookingReference || booking?._id || 'N/A'}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFService();
