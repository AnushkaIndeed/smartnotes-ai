const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Note = require('../models/Note');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');

const _apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(_apiKey);

const router = express.Router();

// POST /api/ai/chat
// Body: { contentId, contentType: 'note' | 'file', question }
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { contentId, contentType, question } = req.body;

    if (!contentId || !contentType || !question) {
      return res.status(400).json({ error: 'contentId, contentType and question are required' });
    }

    // Step 1: RETRIEVE — fetch content from MongoDB
    let contextText = '';
    let contextLabel = '';

    if (contentType === 'note') {
      const note = await Note.findOne({ _id: contentId, userId: req.userId });
      if (!note) return res.status(404).json({ error: 'Note not found' });
      contextText = `Title: ${note.title}\n\n${note.content}`;
      contextLabel = `note titled "${note.title}"`;

    } else if (contentType === 'file') {
      const file = await File.findOne({ _id: contentId, userId: req.userId });
      if (!file) return res.status(404).json({ error: 'File not found' });
      contextText = file.extractedText;
      contextLabel = `PDF file "${file.filename}"`;

    } else {
      return res.status(400).json({ error: 'contentType must be "note" or "file"' });
    }

    // Truncate context if it's very long
    // ~4 chars per token — we keep it reasonable for speed and cost
    const MAX_CHARS = 30000;
    if (contextText.length > MAX_CHARS) {
      contextText = contextText.slice(0, MAX_CHARS) + '\n\n[Content truncated for length]';
    }

    // Step 2: AUGMENT — build the prompt with the content as context
    const systemPrompt = `You are a helpful assistant for a note-taking app.
The user is asking about their ${contextLabel}.
Be concise and clear.
Answer primarily from the provided context.
If the answer is not available in the context, clearly state that and then provide a brief general answer from your own knowledge.
--- CONTENT START ---
${contextText}
--- CONTENT END ---`;

    // Step 3: GENERATE — call Gemini with the augmented prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\nUser question: ' + question);
    const answer = result.response.text();

    res.json({ answer });

  } catch (err) {
    console.error('AI route error:', err.message);
    res.status(500).json({ error: 'AI request failed: ' + err.message });
  }
});

module.exports = router;