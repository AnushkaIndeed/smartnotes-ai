# SmartNotes AI V2: Document Intelligence

**Version:** 2.1
**Branch:** `v2-document-intelligence`
**Status:** In progress
**Baseline:** tag `v1-stable`

## 1. Summary

SmartNotes AI V1 is a deployed note-taking app with PDF chat. It extracts a PDF's text on upload and sends the first 30,000 characters to an LLM.

V2 replaces that with a retrieval pipeline: page-wise extraction, chunking, embeddings, Qdrant vector search, and answers cited by page number. Large documents are processed in the background so uploads never block.

One codebase ships in two modes:

- **Self-hosted:** `docker compose up` runs the full stack, including local embeddings, a local LLM option and OCR.
- **Hosted demo:** a public web app on free tiers, using API-based embeddings and LLM, with usage limits.

## 2. Problem (V1 limits)

- Only the first ~30,000 characters (roughly 12 pages) reach the LLM, so later content is invisible to chat.
- Scanned PDFs produce no text.
- Extraction runs inside the upload request.
- Answers have no source citations.
- Upload size is capped at 10 MB.

## 3. Goals and non-goals

**Goals**

1. Answer questions over long PDFs using semantic retrieval, with page citations.
2. Process documents in the background with visible progress, retries and no duplicate data.
3. Keep V1 features working: auth, notes, folders, PDF upload and delete, theme toggle.
4. Run fully self-hosted from a clean clone with one command.
5. Offer a limited public hosted demo.
6. Publish measured results: largest tested document, processing time, memory, retrieval accuracy.

**Non-goals**

- Multi-machine or distributed processing.
- Guaranteed support for any page count. Capacity is whatever the benchmarks show.
- Real-time collaboration, mobile apps, multi-agent workflows.
- Paid infrastructure in self-hosted mode.

## 4. Deployment modes

| | Self-hosted | Hosted demo |
|---|---|---|
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`, 384 dims) | Gemini embedding model (set by env) |
| LLM | Ollama (Qwen3) or Gemini | Gemini (`GEMINI_MODEL`, currently `gemini-2.5-flash`) |
| Vector DB | Qdrant in Docker | Qdrant Cloud free cluster |
| Queue | Redis in Docker | Hosted Redis (check free limits) |
| OCR | Tesseract (Part 3) | Off |
| Limits | Disk and RAM | Page cap, file size cap, rate limits, documents per user |
| Hosting | Docker Compose | Vercel (client), Render (API and processor), MongoDB Atlas |

The hosted demo is a limited tier. The full feature set lives in self-hosted mode.

## 5. Architecture

**Upload (background):** Express validates and stores the file, creates a `Document` record, and enqueues a BullMQ job. A Node worker calls the Python service page batch by page batch. The Python service extracts text, chunks it, embeds it and upserts to Qdrant. Progress is saved in MongoDB after each batch.

**Chat (per question):** Express authenticates the user, asks the Python service to embed the question and search Qdrant with a `userId` and `docId` filter, builds a prompt from the top chunks, calls the LLM, and returns the answer with page citations.

**Key decisions**

- A long-running **FastAPI service** owns extraction, chunking, embedding and Qdrant access. Question embeddings need the same loaded model, so a per-job subprocess does not work at chat time.
- **Express** owns auth, ownership checks, uploads, the queue, status and LLM calls.
- **Idempotent ingestion:** every chunk gets a deterministic ID (uuid5 of `docId + page + chunkIndex`), so retries overwrite instead of duplicating.
- **Page-bound chunks:** about 800-1,000 characters with about 150 overlap, never crossing a page, so each chunk has one citable page.
- **Provider switches:** `LLM_PROVIDER` and `EMBEDDING_PROVIDER`. Vectors from different models cannot be mixed, so each embedding model gets its own Qdrant collection.
- **Isolation:** every Qdrant query filters by `userId`. The Python service is never exposed publicly.

## 6. Functional requirements

- **FR-1 Upload and validation:** PDF only, file signature check, size and page caps, handle encrypted and corrupt files, private storage, owner recorded.
- **FR-2 Extraction:** page-wise text with PyMuPDF. OCR for pages without text is added in Part 3.
- **FR-3 Background processing:** states `uploaded`, `queued`, `processing`, `indexing`, `completed`, `failed`. Track `pagesDone` and `totalPages`. Retries with backoff. Resume from the last completed batch.
- **FR-4 Chunking:** normalised text, configurable size and overlap, metadata preserved.
- **FR-5 Embeddings and storage:** batched embedding, Qdrant payload `{userId, docId, page, chunkId, extractionMethod}`, payload indexes on `userId` and `docId`.
- **FR-6 Retrieval and answers:** filtered top-k search, numbered sources in the prompt, answer cites sources, says so when the documents do not contain the answer.
- **FR-7 Document management:** delete removes the file, MongoDB record and all Qdrant points. Retry for failed documents.
- **FR-8 Frontend:** upload with status and progress, citation chips on answers, error messages, responsive layout, and a document viewer in the middle pane (selecting a PDF shows it, and a citation chip jumps to its page).
- **FR-9 Account recovery:** forgot-password flow with single-use, expiring reset links. Email is sent over an HTTPS email API in the hosted demo, because free Render services block SMTP.

## 7. Non-functional requirements

- **Reliability:** retries never create duplicate data.
- **Security:** ownership enforced on every document and vector operation. No secrets in Git.
- **Performance:** bounded batches, flat memory during large PDFs.
- **Maintainability:** PDF and ML work stays out of the Express app.
- **Compatibility:** the V1 regression checklist passes before every merge.

## 8. Delivery plan

| Part | Days | Deliverable |
|---|---|---|
| 1. Thin slice | 1-7 | Digital PDF to chunks, embeddings, Qdrant, page-cited answers, PDF viewer with citation jump |
| 1b. Account recovery | after 7 | Forgot-password flow with emailed reset link |
| 2. Async and reliability | 8-14 | Queue, progress, idempotent retries, delete, LLM switch, benchmarks, release |
| 3. OCR (optional) | 15-17 | Tesseract on pages without text, mixed PDFs, OCR benchmarks |
| 4. Hosted mode | after 14 | Provider switches, hosted deploy, guardrails, responsive UI |

Stop points: after Day 7 and after Day 14, the app is in a releasable state.

## 9. Acceptance criteria

1. Digital PDFs are extracted page by page with flat memory use.
2. A 10-20 question evaluation set returns the correct page in the top 5 results at a published rate.
3. Answers include accurate page citations and say so when the answer is not in the document.
4. Uploads return immediately and progress is visible.
5. Killing the worker mid-job and restarting leaves no duplicate vectors and resumes from the last batch.
6. Deleting a document removes its file, record and vectors.
7. A second account cannot retrieve another account's content.
8. `docker compose up` works from a clean clone.
9. The README publishes the largest tested document with time, peak RAM and Qdrant disk usage.
10. Selecting a PDF shows it in the middle pane, and a citation chip opens the cited page.
11. Password reset works end to end, including in the hosted demo.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Scope creep | Stop points after Day 7 and Day 14. OCR is optional. |
| Gemini model names change | Model comes from `GEMINI_MODEL`. |
| Free-tier limits on the hosted demo | Page, file and rate caps. Clear demo notice. |
| Limited disk space locally | Small embedding model, batch limits, temp file cleanup. |
| Abuse of a public upload endpoint | Auth required, rate limiting, per-user caps. |

