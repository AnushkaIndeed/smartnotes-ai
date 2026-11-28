"""Full PDF ingestion: extract -> chunk -> embed -> upsert, streaming page by page."""
import time
from pathlib import Path

import embedder
from chunker import chunk_page
from extract import MIN_CHARS, iter_pages
from ingest import batched
from vectorstore import delete_document, ensure_collection, upsert_chunks


def ingest_pdf(client, pdf_path: Path, doc_id: str, user_id: str,
               batch_size: int = 64, replace: bool = True) -> dict:
    started = time.perf_counter()
    ensure_collection(client, embedder.dimension())
    if replace:
        # Remove old points first so re-indexing with different settings leaves no stale chunks.
        delete_document(client, doc_id, user_id)

    stats = {"pages": 0, "weak_pages": 0}

    def chunk_stream():
        for record in iter_pages(pdf_path):
            stats["pages"] += 1
            if record["chars"] < MIN_CHARS:
                stats["weak_pages"] += 1
            yield from chunk_page(record["page"], record["text"])

    total = 0
    for batch in batched(chunk_stream(), batch_size):
        vectors = embedder.embed_texts([c["text"] for c in batch], batch_size)
        upsert_chunks(client, batch, vectors, doc_id, user_id)
        total += len(batch)

    return {
        "doc_id": doc_id,
        "pages": stats["pages"],
        "chunks": total,
        "weak_pages": stats["weak_pages"],
        "seconds": round(time.perf_counter() - started, 2),
    }