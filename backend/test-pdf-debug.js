// Load environment variables
require('dotenv').config();

const pdfService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

// Sample data for testing PDF generation
const sampleBookingData = {
  booking: {
    _id: '507f1f77bcf86cd799439011',
    bookingReference: 'CT-1234567890-ABC123',
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: 150000,
    bookingDate: new Date(),
    createdAt: new Date(),
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-20')
  },
  customTrip: {
    _id: '507f1f77bcf86cd799439012',
    status: 'confirmed',
    paymentStatus: 'paid',
    requestDetails: {
      destination: 'Kandy',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-02-20'),
      groupSize: 4,
      specialRequests: 'Vegetarian meals preferred, wheelchair accessible accommodation needed'
    },
    staffAssignment: {
      totalBudget: {
        guideFees: 50000,
        vehicleCosts: 40000,
        hotelCosts: 45000,
        activityCosts: 10000,
        additionalFees: 5000,
        totalAmount: 150000
      },
      itinerary: [
        {
          day: 1,
          date: new Date('2024-02-15'),
          location: 'Kandy',
          activities: ['Temple of the Tooth', 'Kandy Lake', 'Cultural Show'],
          accommodation: 'Hotel Kandy',
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          transport: 'Private Car',
          notes: 'Arrival day, light activities'
        }
      ],
      hotelBookings: [
        {
          hotel: {
            name: 'Hotel Kandy',
            location: { city: 'Kandy' }
          },
          roomType: 'Deluxe Room',
          checkInDate: new Date('2024-02-15'),
          checkOutDate: new Date('2024-02-16'),
          nights: 1,
          rooms: 2,
          pricePerNight: 15000,
          totalPrice: 30000,
          city: 'Kandy'
        }
      ]
    }
  },
  user: {
    _id: '507f1f77bcf86cd799439013',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'test@example.com',
    phone: '+1 555 123 4567'
  },
  guide: {
    _id: '507f1f77bcf86cd799439014',
    firstName: 'Priya',
    lastName: 'Fernando',
    email: 'priya.fernando@serendibgo.com',
    phone: '+94 77 987 6543',
    profile: {
      specialties: ['Cultural Tours', 'Nature Walks', 'Photography']
    }
  }
};

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF Generation');
    console.log('=========================');
    console.log('');

    // Test 1: Custom Trip PDF
    console.log('📄 Test 1: Custom Trip Invoice PDF');
    console.log('----------------------------------');
    
    console.log('📊 Sample data:');
    console.log('- Booking ID:', sampleBookingData.booking._id);
    console.log('- Customer:', sampleBookingData.user.firstName, sampleBookingData.user.lastName);
    console.log('- Destination:', sampleBookingData.customTrip.requestDetails.destination);
    console.log('- Total Amount:', sampleBookingData.booking.totalAmount);
    console.log('');

    console.log('🔄 Generating PDF...');
    const pdfBuffer = await pdfService.generateCustomTripInvoice(sampleBookingData);
    
    console.log('✅ PDF generated successfully!');
    console.log('📊 PDF Details:');
    console.log('- Buffer size:', pdfBuffer.length, 'bytes');
    console.log('- Buffer type:', typeof pdfBuffer);
    console.log('- Is Buffer:', Buffer.isBuffer(pdfBuffer));
    console.log('');

    // Save PDF to file for testing
    const filename = `test-custom-trip-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, filename);
    
    console.log('💾 Saving PDF to file for testing...');
    fs.writeFileSync(filepath, pdfBuffer);
    console.log('✅ PDF saved to:', filepath);
    console.log('');

    // Test 2: Regular Booking PDF
    console.log('📄 Test 2: Regular Booking PDF');
    console.log('-------------------------------');
    
    const regularBookingData = {
      booking: {
        _id: '507f1f77bcf86cd799439015',
        bookingReference: 'TR-9876543210-XYZ789',
        status: 'confirmed',
        paymentStatus: 'paid',
        totalAmount: 45000,
        bookingDate: new Date(),
        createdAt: new Date(),
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-01'),
        duration: 'full-day',
        groupSize: 2
      },
      tour: {
        _id: '507f1f77bcf86cd799439016',
        title: 'Sigiriya Rock Fortress & Dambulla Cave Temple',
        description: 'Explore the ancient rock fortress of Sigiriya and visit the magnificent Dambulla Cave Temple.',
        duration: 'full-day',
        price: 45000,
        location: 'Sigiriya, Dambulla'
      },
      user: {
        _id: '507f1f77bcf86cd799439017',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'test@example.com',
        phone: '+1 555 987 6543'
      },
      guide: {
        _id: '507f1f77bcf86cd799439018',
        firstName: 'Raj',
        lastName: 'Perera',
        email: 'raj.perera@serendibgo.com',
        phone: '+94 77 123 4567',
        profile: {
          specialties: ['Historical Sites', 'Archaeology', 'Cultural Heritage']
        }
      }
    };

    console.log('🔄 Generating regular booking PDF...');
    const regularPdfBuffer = await pdfService.generateRegularBookingPDF(regularBookingData);
    
    console.log('✅ Regular booking PDF generated successfully!');
    console.log('📊 PDF Details:');
    console.log('- Buffer size:', regularPdfBuffer.length, 'bytes');
    console.log('- Buffer type:', typeof regularPdfBuffer);
    console.log('- Is Buffer:', Buffer.isBuffer(regularPdfBuffer));
    console.log('');

    // Save regular PDF to file
    const regularFilename = `test-regular-booking-${Date.now()}.pdf`;
    const regularFilepath = path.join(__dirname, regularFilename);
    
    console.log('💾 Saving regular PDF to file...');
    fs.writeFileSync(regularFilepath, regularPdfBuffer);
    console.log('✅ Regular PDF saved to:', regularFilepath);
    console.log('');

    // Test 3: Check PDF file integrity
    console.log('🔍 Test 3: PDF File Integrity Check');
    console.log('-----------------------------------');
    
    const customTripStats = fs.statSync(filepath);
    const regularStats = fs.statSync(regularFilepath);
    
    console.log('📊 Custom Trip PDF:');
    console.log('- File size:', customTripStats.size, 'bytes');
    console.log('- File exists:', fs.existsSync(filepath));
    console.log('- Is file:', customTripStats.isFile());
    console.log('');
    
    console.log('📊 Regular Booking PDF:');
    console.log('- File size:', regularStats.size, 'bytes');
    console.log('- File exists:', fs.existsSync(regularFilepath));
    console.log('- Is file:', regularStats.isFile());
    console.log('');

    // Test 4: Check PDF header
    console.log('🔍 Test 4: PDF Header Check');
    console.log('---------------------------');
    
    const customTripHeader = pdfBuffer.slice(0, 10);
    const regularHeader = regularPdfBuffer.slice(0, 10);
    
    console.log('📊 Custom Trip PDF Header (first 10 bytes):');
    console.log('- Hex:', customTripHeader.toString('hex'));
    console.log('- ASCII:', customTripHeader.toString('ascii'));
    console.log('- Starts with %PDF:', pdfBuffer.toString('ascii', 0, 4) === '%PDF');
    console.log('');
    
    console.log('📊 Regular Booking PDF Header (first 10 bytes):');
    console.log('- Hex:', regularHeader.toString('hex'));
    console.log('- ASCII:', regularHeader.toString('ascii'));
    console.log('- Starts with %PDF:', regularPdfBuffer.toString('ascii', 0, 4) === '%PDF');
    console.log('');

    console.log('🎉 PDF Generation Test Completed Successfully!');
    console.log('==============================================');
    console.log('');
    console.log('📁 Generated Files:');
    console.log('- Custom Trip PDF:', filename);
    console.log('- Regular Booking PDF:', regularFilename);
    console.log('');
    console.log('💡 Try opening these files with a PDF viewer to verify they work correctly.');
    console.log('📧 If the files open correctly, the issue might be in the HTTP response headers.');

  } catch (error) {
    console.error('❌ PDF generation test failed:', error.message);
    console.error('');
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.message.includes('puppeteer')) {
      console.log('');
      console.log('💡 Puppeteer issue detected. This might be due to:');
      console.log('1. Missing Chrome/Chromium installation');
      console.log('2. Insufficient system resources');
      console.log('3. Permission issues');
    }
  }
}

// Run the PDF generation test
testPDFGeneration();
