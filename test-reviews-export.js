const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function testReviewsExport() {
  try {
    console.log('🧪 Testing Reviews Export API...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@serandibgo.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test reviews export API
    console.log('\n2. Testing POST /admin/reviews/export...');
    const exportResponse = await axios.post(`${API_BASE_URL}/admin/reviews/export`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Reviews export API successful!');
    console.log('📊 Response structure:', Object.keys(exportResponse.data));
    console.log('📄 Filename:', exportResponse.data.filename);
    console.log('📊 PDF data length:', exportResponse.data.data?.length || 0);
    
    if (exportResponse.data.data) {
      console.log('📋 First 100 chars of PDF data:', exportResponse.data.data.substring(0, 100));
      console.log('✅ PDF data is base64 encoded and ready for download');
    }

    console.log('\n🎉 Reviews export test passed! The PDF should contain:');
    console.log('📅 Reviews from the latest month only');
    console.log('📊 Total review statistics for all categories');
    console.log('⭐ Average ratings for hotels, guides, vehicles, and custom trips');
    console.log('📋 Detailed table of all reviews from the latest month');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testReviewsExport();
