import os
from pathlib import Path

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage")).resolve()


def resolve_storage_path(file_key: str, base: Path = STORAGE_DIR) -> Path:
    """Turn a storage key like 'userId/fileId.pdf' into a real path, refusing anything outside base."""
    base = Path(base).resolve()
    path = (base / file_key).resolve()  # an absolute file_key replaces base here; the check below catches it
    if not path.is_relative_to(base):
        raise ValueError("Invalid file key")
    if path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported")
    if not path.is_file():
        raise FileNotFoundError(file_key)
    return path