import os
import re

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.split("/")[-1].lower()).strip("_")


# One collection per embedding model: vectors from different models are not comparable.
COLLECTION = f"chunks_{_slug(EMBEDDING_MODEL)}"