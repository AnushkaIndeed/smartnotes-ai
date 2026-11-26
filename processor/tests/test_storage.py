import pytest

from storage import resolve_storage_path


def _make(tmp_path, name="u1/d1.pdf"):
    f = tmp_path / name
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_bytes(b"%PDF-1.4")
    return f


def test_valid_key_resolves(tmp_path):
    f = _make(tmp_path)
    assert resolve_storage_path("u1/d1.pdf", tmp_path) == f.resolve()


def test_path_traversal_is_rejected(tmp_path):
    with pytest.raises(ValueError):
        resolve_storage_path("../secret.pdf", tmp_path)


def test_absolute_paths_are_rejected(tmp_path):
    with pytest.raises(ValueError):
        resolve_storage_path("/etc/passwd", tmp_path)


def test_non_pdf_is_rejected(tmp_path):
    _make(tmp_path, "u1/notes.txt")
    with pytest.raises(ValueError):
        resolve_storage_path("u1/notes.txt", tmp_path)


def test_missing_file_raises_not_found(tmp_path):
    with pytest.raises(FileNotFoundError):
        resolve_storage_path("u1/missing.pdf", tmp_path)