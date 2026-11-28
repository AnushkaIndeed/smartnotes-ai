const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
const { STORAGE_DIR, storagePath } = require('../lib/storage');
const { ingestDocument, ProcessorError } = require('../lib/processor');

const router = express.Router();

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});
const uploadPdf = upload.single('file');

// POST /api/files/upload
router.post(
  '/upload',
  authMiddleware,
  (req, res, next) => {
    uploadPdf(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `PDF is too large. The limit is ${MAX_UPLOAD_MB} MB.` });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    let file = null;
    let absPath = null;
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
        return res.status(400).json({ error: 'This file is not a PDF.' });
      }

      file = await File.create({
        filename: req.file.originalname,
        userId: req.userId,
        status: 'processing',
      });

      const storageKey = `${req.userId}/${file._id}.pdf`;
      absPath = storagePath(storageKey);
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, req.file.buffer);
      file.storageKey = storageKey;
      await file.save();

      const result = await ingestDocument({
        docId: String(file._id),
        userId: String(req.userId),
        fileKey: storageKey,
      });

      if (!result.chunks) {
        throw new ProcessorError(422, 'No readable text found. Scanned or image-only PDFs are not supported yet.');
      }

      file.status = 'completed';
      file.totalPages = result.pages;
      file.chunkCount = result.chunks;
      await file.save();

      res.status(201).json({
        _id: file._id,
        filename: file.filename,
        status: file.status,
        totalPages: file.totalPages,
        chunkCount: file.chunkCount,
      });
    } catch (err) {
      // Don't leave half-finished uploads behind.
      if (file) await File.deleteOne({ _id: file._id }).catch(() => {});
      if (absPath) await fs.rm(absPath, { force: true }).catch(() => {});
      const status = err instanceof ProcessorError ? err.status : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

// GET /api/files: list this user's files (no text, keep it light)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId })
      .select('filename createdAt status totalPages')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/:id/file: stream the original PDF (owner only). Day 7's viewer uses this.
router.get('/:id/file', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.userId }).select('filename storageKey');
    if (!file || !file.storageKey) {
      return res.status(404).json({ error: 'Original file not available' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(file.storageKey, { root: STORAGE_DIR, dotfiles: 'deny' }, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Original file not available' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id
// NOTE: removes the database record only. Day 11 makes it also remove the stored PDF and the vectors.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;