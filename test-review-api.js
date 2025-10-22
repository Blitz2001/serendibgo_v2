const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test function to check review API endpoints
async function testReviewAPI() {
  try {
    console.log('🧪 Testing Review Management API...\n');

    // Test 1: Get all reviews
    console.log('1. Testing GET /admin/reviews...');
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reviews`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
        }
      });
      console.log('✅ Successfully fetched reviews:', response.data.data?.reviews?.length || 0, 'reviews found');
      console.log('📊 Review types:', response.data.data?.reviews?.map(r => r.reviewType) || []);
    } catch (error) {
      console.log('❌ Error fetching reviews:', error.response?.data?.message || error.message);
    }

    // Test 2: Get review statistics
    console.log('\n2. Testing GET /admin/reviews/stats...');
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reviews/stats`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
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
    }

    // Test 3: Test filtering by type
    console.log('\n3. Testing review filtering by type...');
    const reviewTypes = ['hotel', 'guide', 'custom-trip', 'vehicle'];
    
    for (const type of reviewTypes) {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/reviews?type=${type}`, {
          headers: {
            'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
          }
        });
        console.log(`✅ ${type} reviews:`, response.data.data?.reviews?.length || 0, 'found');
      } catch (error) {
        console.log(`❌ Error fetching ${type} reviews:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Review API testing completed!');
    console.log('\n📝 Note: To test with actual data, you need to:');
    console.log('1. Replace YOUR_ADMIN_TOKEN_HERE with a valid admin JWT token');
    console.log('2. Ensure you have some reviews in your database');
    console.log('3. Make sure the backend server is running on port 5000');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReviewAPI();
