# ✦ SmartNotes AI

> Write notes. Upload PDFs. Chat with your own content using AI.

**[Live Demo](https://smartnotes-ai-alpha.vercel.app)** · **[Backend API](https://smartnotes-ai-production-089d.up.railway.app)**

A full-stack note-taking app with an AI chat layer. Write notes, organize them into folders, upload PDFs, and ask an LLM questions about your own content — the AI answers based only on what you've written, not generic training data. This is a RAG (Retrieval Augmented Generation) pipeline, built from scratch.

---

## Features

- **JWT authentication** — register, login, protected routes, password hashing with bcrypt
- **Notes** — create, edit, delete, with debounced auto-save (no save button needed)
- **Folder organization** — group notes into folders, move notes between them, collapsible sidebar
- **PDF upload** — text is extracted on upload and stored for AI context
- **AI chat (RAG)** — ask questions about any note or PDF; the LLM answers using only that content as context
- **Light / dark mode** — Notion-inspired UI with a persistent theme toggle
- **Fully deployed** — backend on Railway, frontend on Vercel, MongoDB Atlas for data

## Tech stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Frontend   | React.js, Tailwind CSS, Vite                  |
| Backend    | Node.js, Express.js                           |
| Database   | MongoDB + Mongoose                            |
| Auth       | JWT (JSON Web Tokens), bcrypt                 |
| AI         | Google Gemini 2.5 Flash (RAG pipeline)        |
| Files      | Multer (upload) + pdf-parse (text extraction) |
| Deploy     | Railway (API) + Vercel (frontend)             |

## How the AI chat works

1. User selects a note or PDF and asks a question
2. Backend fetches that specific content from MongoDB — scoped to the logged-in user only
3. Content is injected into the LLM prompt as context (with a length guard to stay within token limits)
4. Gemini answers based only on the provided content, not its general training data

```
React frontend
      ↕ REST API (JSON)
Node/Express backend ──→ MongoDB (notes, users, files)
      ↕
  Gemini API (LLM)
```

## Run locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Google Gemini API key (free at aistudio.google.com)

### Backend
```bash
cd server
npm install
```
Create a `.env` file:
```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_string
GEMINI_API_KEY=your_gemini_key
```
```bash
npm run dev
```

### Frontend
```bash
cd client
npm install
```
Create a `.env.development` file:
```
VITE_API_URL=http://localhost:5001/api
```
```bash
npm run dev
```

Open `http://localhost:5173`

## Project structure

```
smartnotes-ai/
├── server/
│   ├── models/       User, Note, File schemas
│   ├── routes/       auth, notes, files, ai
│   ├── middleware/   JWT auth middleware
│   └── index.js      Express server entry point
└── client/
    └── src/
        ├── api/          axios instance + interceptors (auth headers, 401 handling)
        ├── context/      AuthContext, ThemeContext
        ├── hooks/        useNotes, useFiles, useAI, useDebounce
        ├── components/   ChatPanel
        └── pages/        Login, Register, NotesApp
```

## Security notes

Every database query that touches user data filters by `userId`, so one user can never read, edit, or delete another user's notes or files — even if they guess a valid document ID. Passwords are hashed with bcrypt before storage; raw passwords are never persisted. JWT tokens expire after 7 days, and an axios response interceptor auto-logs-out the client on a 401.

## What I'd build next

- Vector embeddings (e.g. Pinecone) for semantic search across many notes, instead of sending one full document as context
- Streaming AI responses via Server-Sent Events instead of waiting for the full reply
- Markdown rendering in the editor

---

Built by [Anushka Kohli](https://github.com/AnushkaIndeed)
