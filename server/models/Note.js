const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled note'
  },
  content: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // links to a User document
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);