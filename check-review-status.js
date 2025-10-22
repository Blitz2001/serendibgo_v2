const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Review = require('./src/models/Review');
const HotelReview = require('./src/models/hotels/HotelReview');
const CustomTripReview = require('./src/models/CustomTripReview');
const VehicleBooking = require('./src/models/vehicles/VehicleBooking');

async function checkReviewStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendibgo');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Checking review isActive status...\n');

    // Check guide reviews
    const guideReviews = await Review.find({}).select('isActive rating comment');
    console.log(`📊 Guide Reviews (${guideReviews.length} total):`);
    guideReviews.forEach((review, index) => {
      console.log(`  ${index + 1}. isActive: ${review.isActive}, rating: ${review.rating}`);
    });

    // Check custom trip reviews
    const customTripReviews = await CustomTripReview.find({}).select('isActive rating comment');
    console.log(`\n🗺️ Custom Trip Reviews (${customTripReviews.length} total):`);
    customTripReviews.forEach((review, index) => {
      console.log(`  ${index + 1}. isActive: ${review.isActive}, rating: ${review.rating}`);
    });

    // Check hotel reviews
    const hotelReviews = await HotelReview.find({}).select('isActive rating');
    console.log(`\n🏨 Hotel Reviews (${hotelReviews.length} total):`);
    hotelReviews.forEach((review, index) => {
      console.log(`  ${index + 1}. isActive: ${review.isActive}, rating: ${review.rating?.overall}`);
    });

    // Check vehicle reviews
    const vehicleReviews = await VehicleBooking.find({ 
      'review.rating': { $exists: true, $ne: null } 
    }).select('review');
    console.log(`\n🚗 Vehicle Reviews (${vehicleReviews.length} total):`);
    vehicleReviews.forEach((review, index) => {
      console.log(`  ${index + 1}. rating: ${review.review?.rating}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the function
checkReviewStatus();
