// controllers/authController.js
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const result = await userService.login(email, password);
    const userId = result.user?.id || result.user?._id;
    const token = generateToken(userId);
    
    res.json({
      success: true,
      token,
      user: result.user
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await userService.getProfile(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const result = await userService.updateProfile(req.user._id, updateData);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const result = await userService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const result = await userService.deleteAccount(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.setup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    const result = await userService.createFirstUser({ name, email, password });
    const userId = result.user?.id || result.user?._id;
    const token = generateToken(userId);
    
    res.status(201).json({
      success: true,
      token,
      user: result.user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};