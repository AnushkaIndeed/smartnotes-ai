const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Store file in memory (RAM) — fine for small PDFs
// For production you'd use disk or cloud storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// POST /api/files/upload
// upload.single('file') — expects a form field named "file"
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // req.file.buffer is the raw PDF bytes
    // pdf-parse extracts readable text from it
    const data = await pdfParse(req.file.buffer);

    const file = await File.create({
      filename: req.file.originalname,
      extractedText: data.text,
      userId: req.userId
    });

    res.status(201).json({
      _id: file._id,
      filename: file.filename,
      preview: data.text.slice(0, 200) // just send a preview, not the whole text
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files — list all uploaded files for this user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId })
      .select('filename createdAt') // don't send full text in the list
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;