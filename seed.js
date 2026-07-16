// seed.js - Create or reset the admin user
// IMPORTANT: This will delete any existing users and create a fresh admin account
// Run: npm run seed (after adding script to package.json)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete any existing users
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing user(s)`);

    // Create fresh admin user
    const user = await User.create({
      name: 'Admin',
      email: 'admin@paylink.com',
      password: 'password123'
    });

    console.log('\n✨ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@paylink.com');
    console.log('🔑 Password: password123');
    console.log('🆔 User ID:  ' + user._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();