const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  extractedText: { type: String, default: '' }, // V1 documents only
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // V2 fields. Old V1 documents have none of these and are treated as 'legacy'.
  status: {
    type: String,
    enum: ['legacy', 'processing', 'completed', 'failed'],
    default: 'legacy',
  },
  storageKey: { type: String, default: null },
  totalPages: { type: Number, default: null },
  chunkCount: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);