const PROCESSOR_URL = process.env.PROCESSOR_URL || 'http://localhost:8001';

class ProcessorError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function callProcessor(path, body, timeoutMs) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.PROCESSOR_API_KEY) headers['X-Internal-Key'] = process.env.PROCESSOR_API_KEY;

  let res;
  try {
    res = await fetch(`${PROCESSOR_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new ProcessorError(504, 'The document service took too long to respond.');
    }
    throw new ProcessorError(503, 'The document service is not reachable right now.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'The document service rejected the request.';
    throw new ProcessorError(res.status === 422 ? 422 : 502, detail);
  }
  return data;
}

const ingestDocument = ({ docId, userId, fileKey }) =>
  callProcessor('/ingest', { doc_id: docId, user_id: userId, file_key: fileKey }, 10 * 60 * 1000);

async function searchChunks({ userId, docIds, question, topK = 5 }) {
  const data = await callProcessor(
    '/search',
    { question, user_id: userId, doc_ids: docIds, top_k: topK },
    30 * 1000
  );
  return data.results;
}

module.exports = { ProcessorError, ingestDocument, searchChunks };