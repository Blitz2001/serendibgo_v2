const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendibgo');
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@serandibgo.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', adminUser.email);
    console.log('🔍 Current password hash:', adminUser.password?.substring(0, 20) + '...');
    
    // Set new password (this will trigger the pre-save middleware to hash it)
    adminUser.password = 'admin123';
    await adminUser.save();
    
    console.log('✅ Admin password updated and hashed');
    console.log('🔍 New password hash:', adminUser.password?.substring(0, 20) + '...');
    
    // Test password comparison
    const isMatch = await adminUser.comparePassword('admin123');
    console.log('🧪 Password comparison test:', isMatch ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n📧 Email: admin@serandibgo.com');
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the function
fixAdminPassword();
