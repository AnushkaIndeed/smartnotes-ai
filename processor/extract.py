"""Extract text from a PDF one page at a time and write it as JSONL.

Each output line is one page:
    {"page": 1, "text": "...", "chars": 1234}

Pages are streamed (generator), so memory stays flat however long the PDF is.
"""
import argparse
import json
import sys
import time
from pathlib import Path
from typing import Iterator

import pymupdf

# A page with fewer non-blank characters than this is probably scanned or blank.
# Part 3 (OCR) uses this to decide which pages need Tesseract.
MIN_CHARS = 20


def iter_pages(pdf_path: Path) -> Iterator[dict]:
    """Yield one record per page without keeping earlier pages in memory."""
    with pymupdf.open(str(pdf_path)) as doc:
        if doc.needs_pass:
            raise ValueError("PDF is encrypted")
        for index in range(doc.page_count):
            page = doc.load_page(index)
            text = page.get_text("text")
            yield {
                "page": index + 1,  # 1-based, matches what a reader sees
                "text": text,
                "chars": len(text.strip()),
            }


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF text page by page into JSONL.")
    parser.add_argument("pdf", type=Path, help="Path to the PDF file")
    parser.add_argument("--out", type=Path, default=None,
                        help="Output file (default: output/<name>.jsonl)")
    args = parser.parse_args()

    out_path = args.out or Path("output") / f"{args.pdf.stem}.jsonl"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    started = time.perf_counter()
    pages = 0
    weak_pages = 0
    total_chars = 0

    try:
        with out_path.open("w", encoding="utf-8") as out:
            for record in iter_pages(args.pdf):
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                pages += 1
                total_chars += record["chars"]
                if record["chars"] < MIN_CHARS:
                    weak_pages += 1
    except Exception as exc:
        out_path.unlink(missing_ok=True)  # don't leave a half-written file behind
        print(f"Extraction failed: {exc}", file=sys.stderr)
        return 1

    elapsed = time.perf_counter() - started
    print(json.dumps({
        "pdf": str(args.pdf),
        "pages": pages,
        "weak_pages": weak_pages,
        "total_chars": total_chars,
        "seconds": round(elapsed, 2),
        "pages_per_second": round(pages / elapsed, 1) if elapsed else None,
        "output": str(out_path),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())