const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Review = require('./src/models/Review');
const HotelReview = require('./src/models/hotels/HotelReview');
const CustomTripReview = require('./src/models/CustomTripReview');
const VehicleBooking = require('./src/models/vehicles/VehicleBooking');

async function checkReviewsInDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendibgo');
    console.log('✅ Connected to MongoDB');

    // Check each review type
    console.log('\n🔍 Checking reviews in database...\n');

    // Check regular reviews (guide reviews)
    const guideReviews = await Review.find({}).populate('user', 'firstName lastName email').populate('guide', 'firstName lastName email').populate('tour', 'title').limit(5);
    console.log(`📊 Guide Reviews: ${guideReviews.length} found`);
    if (guideReviews.length > 0) {
      console.log('Sample guide review:', {
        id: guideReviews[0]._id,
        user: guideReviews[0].user?.firstName + ' ' + guideReviews[0].user?.lastName,
        guide: guideReviews[0].guide?.firstName + ' ' + guideReviews[0].guide?.lastName,
        rating: guideReviews[0].rating,
        comment: guideReviews[0].comment?.substring(0, 50) + '...'
      });
    }

    // Check hotel reviews
    const hotelReviews = await HotelReview.find({}).populate('user', 'firstName lastName email').populate('hotel', 'name').limit(5);
    console.log(`🏨 Hotel Reviews: ${hotelReviews.length} found`);
    if (hotelReviews.length > 0) {
      console.log('Sample hotel review:', {
        id: hotelReviews[0]._id,
        user: hotelReviews[0].user?.firstName + ' ' + hotelReviews[0].user?.lastName,
        hotel: hotelReviews[0].hotel?.name,
        rating: hotelReviews[0].rating?.overall,
        content: hotelReviews[0].content?.substring(0, 50) + '...'
      });
    }

    // Check custom trip reviews
    const customTripReviews = await CustomTripReview.find({}).populate('user', 'firstName lastName email').populate('customTrip', 'title destination').limit(5);
    console.log(`🗺️ Custom Trip Reviews: ${customTripReviews.length} found`);
    if (customTripReviews.length > 0) {
      console.log('Sample custom trip review:', {
        id: customTripReviews[0]._id,
        user: customTripReviews[0].user?.firstName + ' ' + customTripReviews[0].user?.lastName,
        customTrip: customTripReviews[0].customTrip?.title,
        rating: customTripReviews[0].rating,
        comment: customTripReviews[0].comment?.substring(0, 50) + '...'
      });
    }

    // Check vehicle booking reviews
    const vehicleBookings = await VehicleBooking.find({ 
      'review.rating': { $exists: true, $ne: null },
      'review.comment': { $exists: true, $ne: '' }
    }).populate('user', 'firstName lastName email').populate('vehicle', 'make model year licensePlate').populate('driver.assignedDriver', 'firstName lastName email').limit(5);
    console.log(`🚗 Vehicle Reviews: ${vehicleBookings.length} found`);
    if (vehicleBookings.length > 0) {
      console.log('Sample vehicle review:', {
        id: vehicleBookings[0]._id,
        user: vehicleBookings[0].user?.firstName + ' ' + vehicleBookings[0].user?.lastName,
        vehicle: vehicleBookings[0].vehicle?.make + ' ' + vehicleBookings[0].vehicle?.model,
        rating: vehicleBookings[0].review?.rating,
        comment: vehicleBookings[0].review?.comment?.substring(0, 50) + '...'
      });
    }

    // Total count
    const totalGuideReviews = await Review.countDocuments({});
    const totalHotelReviews = await HotelReview.countDocuments({});
    const totalCustomTripReviews = await CustomTripReview.countDocuments({});
    const totalVehicleReviews = await VehicleBooking.countDocuments({ 
      'review.rating': { $exists: true, $ne: null },
      'review.comment': { $exists: true, $ne: '' }
    });

    console.log('\n📈 Total Review Counts:');
    console.log(`Guide Reviews: ${totalGuideReviews}`);
    console.log(`Hotel Reviews: ${totalHotelReviews}`);
    console.log(`Custom Trip Reviews: ${totalCustomTripReviews}`);
    console.log(`Vehicle Reviews: ${totalVehicleReviews}`);
    console.log(`Total Reviews: ${totalGuideReviews + totalHotelReviews + totalCustomTripReviews + totalVehicleReviews}`);

    if (totalGuideReviews + totalHotelReviews + totalCustomTripReviews + totalVehicleReviews === 0) {
      console.log('\n⚠️ No reviews found in database!');
      console.log('This explains why the admin dashboard shows "No reviews found"');
      console.log('\n💡 To test the review system, you need to:');
      console.log('1. Create some test reviews in the database');
      console.log('2. Or use the application to create reviews through the normal user flow');
    }

  } catch (error) {
    console.error('❌ Error checking reviews:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkReviewsInDatabase();
