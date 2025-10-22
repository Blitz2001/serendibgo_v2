const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

async function checkAndCreateAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendibgo');
    console.log('✅ Connected to MongoDB');

    // Check existing users
    console.log('\n🔍 Checking existing users...');
    const users = await User.find({}).select('firstName lastName email role isActive');
    console.log(`📊 Total users found: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('\n✅ Admin user already exists:', adminUser.email);
    } else {
      console.log('\n⚠️ No admin user found. Creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@serendibgo.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isVerified: true,
        phone: '+94123456789'
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@serendibgo.com');
      console.log('🔑 Password: admin123');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the function
checkAndCreateAdminUser();
