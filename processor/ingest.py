"""Embed a document's chunks and store them in Qdrant.

    python ingest.py add    output/doc.jsonl --doc-id d1 --user-id u1
    python ingest.py count  --doc-id d1 [--user-id u1]
    python ingest.py delete --doc-id d1 --user-id u1

`add` reads the page JSONL written by extract.py and chunks it in-process.
"""
import argparse
import json
import sys
import time
from itertools import islice

from chunker import DEFAULT_OVERLAP, DEFAULT_SIZE, iter_chunks
from vectorstore import count_points, delete_document, ensure_collection, get_client, upsert_chunks


def batched(iterable, n):
    it = iter(iterable)
    while True:
        batch = list(islice(it, n))
        if not batch:
            return
        yield batch


def ingest(jsonl_path, doc_id: str, user_id: str, batch_size: int = 64,
           size: int = DEFAULT_SIZE, overlap: int = DEFAULT_OVERLAP) -> dict:
    import embedder  # imported here so tests of the pure helpers don't load PyTorch

    started = time.perf_counter()
    client = get_client()
    ensure_collection(client, embedder.dimension())

    total = truncated = 0
    embed_seconds = 0.0
    for batch in batched(iter_chunks(jsonl_path, size, overlap), batch_size):
        texts = [c["text"] for c in batch]
        truncated += embedder.count_truncated(texts)

        t0 = time.perf_counter()
        vectors = embedder.embed_texts(texts, batch_size)
        embed_seconds += time.perf_counter() - t0

        upsert_chunks(client, batch, vectors, doc_id, user_id)
        total += len(batch)
        print(f"  {total} chunks stored...", file=sys.stderr)

    elapsed = time.perf_counter() - started
    return {
        "doc_id": doc_id,
        "chunks": total,
        "truncated_by_model": truncated,
        "embed_seconds": round(embed_seconds, 2),
        "chunks_per_second_embedding": round(total / embed_seconds, 1) if embed_seconds else None,
        "total_seconds": round(elapsed, 2),
        "points_in_qdrant": count_points(client, doc_id=doc_id),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    add = sub.add_parser("add")
    add.add_argument("jsonl")
    add.add_argument("--doc-id", required=True)
    add.add_argument("--user-id", required=True)
    add.add_argument("--batch-size", type=int, default=64)
    add.add_argument("--size", type=int, default=DEFAULT_SIZE)
    add.add_argument("--overlap", type=int, default=DEFAULT_OVERLAP)

    cnt = sub.add_parser("count")
    cnt.add_argument("--doc-id")
    cnt.add_argument("--user-id")

    dele = sub.add_parser("delete")
    dele.add_argument("--doc-id", required=True)
    dele.add_argument("--user-id", required=True)

    args = parser.parse_args()
    try:
        if args.cmd == "add":
            print(json.dumps(
                ingest(args.jsonl, args.doc_id, args.user_id, args.batch_size, args.size, args.overlap),
                indent=2))
        elif args.cmd == "count":
            print(count_points(get_client(), args.doc_id, args.user_id))
        elif args.cmd == "delete":
            delete_document(get_client(), args.doc_id, args.user_id)
            print("deleted (if it existed)")
    except Exception as exc:
        print(f"Failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())