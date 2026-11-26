const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Note = require('../models/Note');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
const { searchChunks, ProcessorError } = require('../lib/processor');
const { buildPrompt, extractCitations } = require('../lib/rag');

const _apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(_apiKey);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MAX_CHARS = 30000; // V1 behaviour for notes and legacy PDFs
const TOP_K = 5;

const router = express.Router();

async function generate(prompt) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// V1 path: send the whole text (cut at MAX_CHARS) as context.
async function answerFromFullText(label, text, question) {
  const truncated = text.length > MAX_CHARS;
  const context = truncated ? text.slice(0, MAX_CHARS) + '\n\n[Content truncated for length]' : text;

  const prompt = `You are a helpful assistant for a note-taking app.
The user is asking about their ${label}.
Answer based ONLY on the content provided below.
If the answer isn't in the content, say so honestly.
Be concise and clear.

--- CONTENT START ---
${context}
--- CONTENT END ---

User question: ${question}`;

  return { answer: await generate(prompt), truncated, sources: [] };
}

// POST /api/ai/chat
// Body: { contentId, contentType: 'note' | 'file', question }
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { contentId, contentType, question } = req.body;

    if (!contentId || !contentType || !question) {
      return res.status(400).json({ error: 'contentId, contentType and question are required' });
    }
    if (typeof question !== 'string' || question.length > 2000) {
      return res.status(400).json({ error: 'question must be text of at most 2000 characters' });
    }

    if (contentType === 'note') {
      const note = await Note.findOne({ _id: contentId, userId: req.userId });
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.json(
        await answerFromFullText(`note titled "${note.title}"`, `Title: ${note.title}\n\n${note.content}`, question)
      );
    }

    if (contentType === 'file') {
      const file = await File.findOne({ _id: contentId, userId: req.userId });
      if (!file) return res.status(404).json({ error: 'File not found' });

      const status = file.status || 'legacy';

      if (status === 'completed') {
        // V2: retrieve the most relevant chunks, then answer with citations.
        const chunks = await searchChunks({
          userId: String(req.userId),
          docIds: [String(file._id)],
          question,
          topK: TOP_K,
        });

        if (chunks.length === 0) {
          return res.json({
            answer: "I couldn't find anything relevant in this document.",
            truncated: false,
            sources: [],
          });
        }

        const answer = await generate(buildPrompt(question, chunks, file.filename));
        const sources = extractCitations(answer, chunks).map((c) => ({
          n: c.n,
          page: c.page,
          snippet: c.text.slice(0, 160),
        }));
        return res.json({ answer, truncated: false, sources });
      }

      if (status === 'processing') {
        return res.status(409).json({ error: 'This document is still being processed.' });
      }
      if (status === 'failed') {
        return res.status(422).json({ error: 'This document could not be processed.' });
      }

      // legacy V1 document
      return res.json(await answerFromFullText(`PDF file "${file.filename}"`, file.extractedText, question));
    }

    return res.status(400).json({ error: 'contentType must be "note" or "file"' });
  } catch (err) {
    if (err instanceof ProcessorError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('AI route error:', err.message);
    res.status(500).json({ error: 'AI request failed: ' + err.message });
  }
});

module.exports = router;