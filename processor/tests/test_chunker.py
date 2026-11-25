import json

import pytest

from chunker import chunk_page, iter_chunks, normalize, split_text


def test_normalize_joins_words_hyphenated_across_lines():
    assert normalize("exam-\nple text") == "example text"


def test_normalize_collapses_whitespace_and_keeps_paragraphs():
    assert normalize("a  b\nc\n\n\n\nd") == "a b c\n\nd"


def test_empty_and_whitespace_pages_give_no_chunks():
    assert split_text("") == []
    assert split_text("   \n\n  ") == []
    assert chunk_page(1, "") == []


def test_tiny_page_like_a_page_number_is_dropped():
    assert chunk_page(7, "12") == []


def test_short_page_is_one_chunk():
    text = "A short page with just enough words to be kept as a single chunk."
    chunks = chunk_page(3, text)
    assert len(chunks) == 1
    assert chunks[0]["page"] == 3
    assert chunks[0]["chunk_index"] == 0


def test_chunks_respect_size_limit():
    text = " ".join(f"word{i}" for i in range(2000))
    for c in split_text(text, size=500, overlap=80):
        assert len(c) <= 500


def test_consecutive_chunks_overlap():
    text = " ".join(f"word{i}" for i in range(500))
    chunks = split_text(text, size=300, overlap=60)
    assert len(chunks) > 2
    for a, b in zip(chunks, chunks[1:]):
        assert b[:20] in a  # the next chunk starts inside the end of the previous one


def test_no_text_is_lost():
    words = [f"word{i}" for i in range(1500)]
    chunks = split_text(" ".join(words), size=400, overlap=70)
    assert set(" ".join(chunks).split()) == set(words)


def test_prefers_sentence_boundaries():
    text = "This is a complete sentence about retrieval. " * 40
    for c in split_text(text, size=300, overlap=60)[:-1]:
        assert c.endswith(".")


def test_prefers_paragraph_boundaries():
    para = ("Alpha beta gamma delta. " * 8).strip()
    text = (para + "\n\n") * 6
    first = split_text(text, size=500, overlap=60)[0]
    assert first.count("\n\n") == 1
    assert first.endswith("delta.")


def test_long_unbroken_string_terminates_and_loses_nothing():
    chunks = split_text("x" * 5000, size=800, overlap=100)
    assert all(len(c) <= 800 for c in chunks)
    assert sum(len(c) for c in chunks) >= 5000


def test_chunk_indexes_are_sequential():
    chunks = chunk_page(5, "word " * 1000, size=300, overlap=50)
    assert [c["chunk_index"] for c in chunks] == list(range(len(chunks)))


def test_chunking_is_deterministic():
    text = "Deterministic output matters for idempotent retries. " * 50
    assert chunk_page(1, text) == chunk_page(1, text)


def test_invalid_settings_raise():
    with pytest.raises(ValueError):
        split_text("hello", size=100, overlap=80)


def test_chunks_never_cross_pages(tmp_path):
    pages = [
        {"page": 1, "text": "alpha " * 300, "chars": 1800},
        {"page": 2, "text": "beta " * 300, "chars": 1500},
    ]
    src = tmp_path / "doc.jsonl"
    src.write_text("\n".join(json.dumps(p) for p in pages), encoding="utf-8")

    records = list(iter_chunks(src, size=400, overlap=60))

    assert {r["page"] for r in records} == {1, 2}
    for r in records:
        assert ("beta" not in r["text"]) if r["page"] == 1 else ("alpha" not in r["text"])
    assert [r["chunk_index"] for r in records if r["page"] == 2][0] == 0