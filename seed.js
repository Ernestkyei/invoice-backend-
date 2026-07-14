// seed.js - Run this once to create the first user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const createFirstUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('User already exists. Skipping setup.');
      process.exit(0);
    }

    // Create default user
    const user = await User.create({
      name: 'Admin',
      email: 'admin@paylink.com',
      password: 'password123'
    });

    console.log('First user created successfully!');
    console.log('Email: admin@paylink.com');
    console.log('Password: password123');
    console.log('User ID:', user._id);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createFirstUser();