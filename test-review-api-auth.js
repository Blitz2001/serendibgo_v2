const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test function to check review API endpoints
async function testReviewAPI() {
  try {
    console.log('🧪 Testing Review Management API...\n');

    // First, let's try to login as admin to get a token
    console.log('1. Attempting to login as admin...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@serendibgo.com', // You may need to adjust this
        password: 'admin123' // You may need to adjust this
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Login successful, token received');
      
      // Test 1: Get all reviews
      console.log('\n2. Testing GET /admin/reviews...');
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Successfully fetched reviews:', response.data.data?.reviews?.length || 0, 'reviews found');
        console.log('📊 Review types:', response.data.data?.reviews?.map(r => r.reviewType) || []);
        console.log('📋 Sample reviews:', response.data.data?.reviews?.slice(0, 2) || []);
      } catch (error) {
        console.log('❌ Error fetching reviews:', error.response?.data?.message || error.message);
        console.log('❌ Status:', error.response?.status);
      }

      // Test 2: Get review statistics
      console.log('\n3. Testing GET /admin/reviews/stats...');
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/reviews/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Successfully fetched review statistics:');
        console.log('📈 Total Reviews:', response.data.data?.totalReviews || 0);
        console.log('🏨 Hotel Reviews:', response.data.data?.hotelReviews?.total || 0);
        console.log('👨‍🏫 Guide Reviews:', response.data.data?.guideReviews?.total || 0);
        console.log('🗺️ Custom Trip Reviews:', response.data.data?.customTripReviews?.total || 0);
        console.log('🚗 Vehicle Reviews:', response.data.data?.vehicleReviews?.total || 0);
      } catch (error) {
        console.log('❌ Error fetching review statistics:', error.response?.data?.message || error.message);
        console.log('❌ Status:', error.response?.status);
      }

    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
      console.log('💡 You may need to create an admin user or check the credentials');
    }

    console.log('\n🎉 Review API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReviewAPI();
