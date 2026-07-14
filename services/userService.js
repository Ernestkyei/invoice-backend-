// services/userService.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Login user (No registration needed - single user)
exports.login = async (email, password) => {
  try {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);    
    if (!isPasswordMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user._id);
    return {
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get user profile
exports.getProfile = async (userId) => {
  try {
    const user = await User.findById(userId);    
    if (!user) {
      throw new Error('User not found');
    }
    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  } catch (error) {
    throw error;
  }
};

// Update user profile
exports.updateProfile = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);    
    if (!user) {
      throw new Error('User not found');
    }
    // Update only allowed fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;

    // If updating password, it will be hashed by the pre-save hook
    if (updateData.password) {
      user.password = updateData.password;
    }

    await user.save();
    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt
      }
    };
  } catch (error) {
    throw error;
  }
};

// Change password
exports.changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);    
    if (!isPasswordMatch) {
      throw new Error('Current password is incorrect');
    }
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    throw error;
  }
};

// Delete user account
exports.deleteAccount = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);    
    if (!user) {
      throw new Error('User not found');
    }
    return {
      success: true,
      message: 'Account deleted successfully'
    };
  } catch (error) {
    throw error;
  }
};

// Create first user (setup/seed only)
exports.createFirstUser = async (userData) => {
  try {
    const { name, email, password } = userData;
    // Check if any user exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      throw new Error('User already exists. Only one user allowed.');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    throw error;
  }
};