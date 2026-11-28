# V1 audit

## Upload

- Route: `POST /api/files/upload` (`server/routes/files.js`), 10 MB, memory storage
- Extraction: `pdf-parse`, whole file at once
- Stored in: `File` model (`filename`, `extractedText`, `userId`)

## Chat

- Route: `POST /api/ai/chat` (`server/routes/ai.js`)
- Context: whole text, cut at 30,000 chars
- Returns: `{ answer, truncated }`

## Regression checklist (run before every merge)

- [x] Register, log in, log out
- [x] Create, edit, delete a note
- [ ] Move a note between folders
- [x] Upload and delete a PDF
- [x] Chat about a note
- [x] Chat about a PDF
- [x] A second account can't see the first account's data
