const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testReviewsAPI() {
  try {
    console.log('🧪 Testing Reviews API with proper authentication...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@serandibgo.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test reviews API
    console.log('\n2. Testing GET /admin/reviews...');
    const reviewsResponse = await axios.get(`${API_BASE_URL}/admin/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Reviews API successful!');
    console.log('📊 Response structure:', Object.keys(reviewsResponse.data));
    console.log('📊 Data structure:', Object.keys(reviewsResponse.data.data || {}));
    console.log('📊 Reviews count:', reviewsResponse.data.data?.reviews?.length || 0);
    
    if (reviewsResponse.data.data?.reviews?.length > 0) {
      console.log('📋 Sample review:', {
        type: reviewsResponse.data.data.reviews[0].reviewType,
        rating: reviewsResponse.data.data.reviews[0].rating,
        user: reviewsResponse.data.data.reviews[0].user?.firstName
      });
    }
    
    // Step 3: Test review statistics
    console.log('\n3. Testing GET /admin/reviews/stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/admin/reviews/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Review stats API successful!');
    console.log('📈 Total Reviews:', statsResponse.data.data?.totalReviews || 0);
    console.log('🏨 Hotel Reviews:', statsResponse.data.data?.hotelReviews?.total || 0);
    console.log('👨‍🏫 Guide Reviews:', statsResponse.data.data?.guideReviews?.total || 0);
    console.log('🗺️ Custom Trip Reviews:', statsResponse.data.data?.customTripReviews?.total || 0);
    console.log('🚗 Vehicle Reviews:', statsResponse.data.data?.vehicleReviews?.total || 0);

    console.log('\n🎉 All tests passed! The reviews should now display in the admin dashboard.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testReviewsAPI();
