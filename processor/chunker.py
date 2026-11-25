"""Split page text into overlapping, page-bound chunks.

Input:  JSONL from extract.py   {"page": 1, "text": "...", "chars": 1234}
Output: JSONL, one chunk per line {"page": 1, "chunk_index": 0, "text": "...", "chars": 812}

Rules:
- A chunk never crosses a page boundary, so every chunk has exactly one page to cite.
- Cut at a paragraph break if possible, else a sentence end, else a space.
- No chunk is longer than `size` characters.
- Output is deterministic: the same input always gives the same chunks.
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Iterator

DEFAULT_SIZE = 500
DEFAULT_OVERLAP = 80
MIN_PAGE_CHARS = 30  # pages with less text than this (e.g. just a page number) produce no chunks

_SENTENCE_END = re.compile(r"[.!?][\"')\]]?\s")


def normalize(text: str) -> str:
    """Clean raw PDF text while keeping paragraph breaks."""
    text = text.replace("\x00", "").replace("\x0c", "\n")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)   # re-join words hyphenated across lines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)   # single newline inside a paragraph -> space
    return text.strip()


def _check(size: int, overlap: int) -> None:
    if size <= 0 or overlap < 0 or overlap >= size // 2:
        raise ValueError("need size > 0 and 0 <= overlap < size // 2")


def _best_cut(text: str, start: int, end: int) -> int:
    """Pick where to end the chunk, searching the second half of the window."""
    lo = start + (end - start) // 2
    window = text[lo:end]
    i = window.rfind("\n\n")
    if i != -1:
        return lo + i
    last = None
    for m in _SENTENCE_END.finditer(window):
        last = m
    if last is not None:
        return lo + last.end()
    i = window.rfind(" ")
    if i != -1:
        return lo + i
    return end  # no break at all (one huge unbroken token): hard cut


def _snap_to_word_start(text: str, pos: int, limit: int) -> int:
    """Move pos forward so the next chunk starts at the beginning of a word."""
    while 0 < pos < limit and not text[pos].isspace() and not text[pos - 1].isspace():
        pos += 1
    while pos < limit and text[pos].isspace():
        pos += 1
    return pos


def _split_clean(text: str, size: int, overlap: int) -> list[str]:
    n = len(text)
    chunks: list[str] = []
    start = 0
    while start < n:
        end = min(start + size, n)
        if end < n:
            end = _best_cut(text, start, end)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        nxt = _snap_to_word_start(text, end - overlap, end)
        if not (start < nxt < end):  # no usable overlap point: continue from the cut
            nxt = end
        start = nxt
    return chunks


def split_text(text: str, size: int = DEFAULT_SIZE, overlap: int = DEFAULT_OVERLAP) -> list[str]:
    _check(size, overlap)
    return _split_clean(normalize(text), size, overlap)


def chunk_page(page: int, text: str, size: int = DEFAULT_SIZE,
               overlap: int = DEFAULT_OVERLAP) -> list[dict]:
    _check(size, overlap)
    clean = normalize(text)
    if len(clean) < MIN_PAGE_CHARS:
        return []
    return [
        {"page": page, "chunk_index": i, "text": piece, "chars": len(piece)}
        for i, piece in enumerate(_split_clean(clean, size, overlap))
    ]


def iter_chunks(jsonl_path, size: int = DEFAULT_SIZE,
                overlap: int = DEFAULT_OVERLAP) -> Iterator[dict]:
    """Stream chunks from an extract.py JSONL file, one page at a time."""
    with Path(jsonl_path).open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            yield from chunk_page(record["page"], record["text"], size, overlap)


def main() -> int:
    parser = argparse.ArgumentParser(description="Chunk extracted pages into JSONL.")
    parser.add_argument("jsonl", type=Path, help="JSONL produced by extract.py")
    parser.add_argument("--size", type=int, default=DEFAULT_SIZE)
    parser.add_argument("--overlap", type=int, default=DEFAULT_OVERLAP)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    out_path = args.out or args.jsonl.with_name(args.jsonl.stem + ".chunks.jsonl")
    started = time.perf_counter()
    count = 0
    total_chars = 0
    longest = 0
    pages_with_chunks: set[int] = set()

    try:
        with out_path.open("w", encoding="utf-8") as out:
            for chunk in iter_chunks(args.jsonl, args.size, args.overlap):
                out.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                count += 1
                total_chars += chunk["chars"]
                longest = max(longest, chunk["chars"])
                pages_with_chunks.add(chunk["page"])
    except Exception as exc:
        out_path.unlink(missing_ok=True)
        print(f"Chunking failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps({
        "chunks": count,
        "pages_with_chunks": len(pages_with_chunks),
        "avg_chars": round(total_chars / count) if count else 0,
        "max_chars": longest,
        "seconds": round(time.perf_counter() - started, 2),
        "output": str(out_path),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
