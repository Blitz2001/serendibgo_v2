const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Review = require('./src/models/Review');
const HotelReview = require('./src/models/hotels/HotelReview');
const CustomTripReview = require('./src/models/CustomTripReview');

async function activateReviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendibgo');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔧 Activating reviews...\n');

    // Activate guide reviews
    const guideResult = await Review.updateMany({}, { isActive: true });
    console.log(`📊 Updated ${guideResult.modifiedCount} guide reviews to active`);

    // Activate custom trip reviews
    const customTripResult = await CustomTripReview.updateMany({}, { isActive: true });
    console.log(`🗺️ Updated ${customTripResult.modifiedCount} custom trip reviews to active`);

    // Activate hotel reviews
    const hotelResult = await HotelReview.updateMany({}, { isActive: true });
    console.log(`🏨 Updated ${hotelResult.modifiedCount} hotel reviews to active`);

    console.log('\n✅ All reviews have been activated!');
    console.log('📊 Statistics should now show the correct counts.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the function
activateReviews();
