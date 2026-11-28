from functools import lru_cache

from sentence_transformers import SentenceTransformer

from settings import EMBEDDING_MODEL


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    # First call downloads the model (cached afterwards) and loads it into memory.
    return SentenceTransformer(EMBEDDING_MODEL)


def dimension() -> int:
    return get_model().get_sentence_embedding_dimension()


def embed_texts(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """Return one normalised vector per text (length 1, so dot product == cosine)."""
    vectors = get_model().encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return vectors.tolist()


def count_truncated(texts: list[str]) -> int:
    """How many texts are longer than the model can read (the extra tokens are ignored)."""
    model = get_model()
    limit = model.max_seq_length
    return sum(1 for t in texts if len(model.tokenizer.encode(t, add_special_tokens=True)) > limit)