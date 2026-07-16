// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
}, {
  timestamps: true,
  collection: 'users'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  console.log(`🔐 Pre-save hook: hashing password for ${this.email}`);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log(`✅ Password hashed. Hash starts with: ${this.password.substring(0, 20)}...`);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log(`🔄 Comparing: candidate password vs stored hash starting with ${this.password.substring(0, 20)}...`);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log(`📊 bcrypt.compare result: ${isMatch}`);
  return isMatch;
};

module.exports = mongoose.model('User', userSchema);