const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Note = require('../models/Note');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
// Accept either GEMINI_API_KEY or GOOGLE_API_KEY to avoid mismatch
const _apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(_apiKey);

const router = express.Router();
// SDK automatically reads GEMINI_API_KEY from process.env

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

    // Step 2: AUGMENT — build the prompt with the content as context
    const systemPrompt = `You are a helpful assistant for a note-taking app.
The user is asking about their ${contextLabel}.
Answer based ONLY on the content provided below.
If the answer isn't in the content, say so honestly.
Be concise and clear.

--- CONTENT START ---
${contextText}
--- CONTENT END ---`;

    // Step 3: GENERATE — call Gemini with the augmented prompt
    // Log whether an API key is present (don't log the key value)
    const keySource = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'none';
    console.log('Gemini key present:', !!_apiKey, 'source:', keySource);
    // Log auth presence and user id (don't log token itself)
    console.log('Auth header present:', !!req.headers.authorization);
    console.log('Request userId:', req.userId || 'none');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\nUser question: ' + question);

    // SDK response shapes vary — try to extract text safely
    let answer = '';
    try {
      if (result?.response && typeof result.response.text === 'function') {
        answer = result.response.text();
      } else if (result?.output?.[0]?.content?.[0]?.text) {
        answer = result.output[0].content[0].text;
      } else if (typeof result === 'string') {
        answer = result;
      } else {
        // fallback: stringify the result for debugging
        answer = JSON.stringify(result);
      }
    } catch (e) {
      console.error('Error extracting text from Gemini result:', e);
      answer = JSON.stringify(result);
    }

    // Send the extracted answer back to the client
    res.json({ answer });

  } catch (err) {
    // Log full error for debugging (avoid logging secrets)
    console.error('AI route error full:', err);

    // Log common error fields that might indicate a 403 from upstream
    try {
      console.error('err.code:', err.code ?? 'n/a');
      console.error('err.status:', err.status ?? 'n/a');
      console.error('err.message:', err.message ?? 'n/a');
      if (err?.response) {
        console.error('err.response.status:', err.response.status ?? 'n/a');
        console.error('err.response.statusText:', err.response.statusText ?? 'n/a');
        console.error('err.response.data:', err.response.data ?? 'n/a');
      }
      if (err?.response?.data?.error) {
        console.error('err.response.data.error:', err.response.data.error);
      }
    } catch (logErr) {
      console.error('Error while logging SDK response details:', logErr);
    }

    const message = err?.message || 'Unknown AI error';
    // If upstream returned 403, forward that status; otherwise respond 500
    const upstreamStatus = err?.response?.status || err?.status;
    if (upstreamStatus === 403) {
      return res.status(403).json({ error: 'Upstream API returned 403 Forbidden' });
    }

    res.status(500).json({ error: 'AI request failed: ' + message });
  }
});

module.exports = router;