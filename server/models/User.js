const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,  // no two users can have same email
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  }
}, { timestamps: true }); // auto adds createdAt, updatedAt

module.exports = mongoose.model('User', userSchema);