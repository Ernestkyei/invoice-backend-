// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  setup
} = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/setup', setup); 

// Private routes (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete', protect, deleteAccount);

module.exports = router;