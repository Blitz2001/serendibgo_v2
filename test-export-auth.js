const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function testExportWithAuth() {
  try {
    console.log('🧪 Testing Reviews Export with Authentication...\n');

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
    console.log('📄 Filename:', exportResponse.data.filename);
    console.log('📊 PDF data length:', exportResponse.data.data?.length || 0);
    
    console.log('\n🎉 Export test passed! The issue is likely authentication in the frontend.');
    console.log('💡 Solution: Make sure you are logged in as admin in the frontend.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testExportWithAuth();
