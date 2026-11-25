import uuid

from qdrant_client import QdrantClient, models

from settings import COLLECTION, QDRANT_API_KEY, QDRANT_URL

# Fixed namespace so the same (doc, page, chunk) always maps to the same point ID.
_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "smartnotes-ai/chunks")


def get_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


def point_id(doc_id: str, page: int, chunk_index: int) -> str:
    """Deterministic ID: re-ingesting a document overwrites its points instead of duplicating."""
    return str(uuid.uuid5(_NAMESPACE, f"{doc_id}:{page}:{chunk_index}"))


def ensure_collection(client: QdrantClient, dim: int) -> bool:
    """Create the collection and payload indexes if missing. Returns True if newly created."""
    if client.collection_exists(COLLECTION):
        existing = client.get_collection(COLLECTION).config.params.vectors.size
        if existing != dim:
            raise RuntimeError(
                f"Collection {COLLECTION} has vector size {existing}, but the model produces {dim}."
            )
        return False

    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
    )
    for field in ("user_id", "doc_id"):
        client.create_payload_index(
            collection_name=COLLECTION,
            field_name=field,
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
    return True


def _filter(doc_id: str | None = None, user_id: str | None = None) -> models.Filter | None:
    must = []
    if doc_id is not None:
        must.append(models.FieldCondition(key="doc_id", match=models.MatchValue(value=doc_id)))
    if user_id is not None:
        must.append(models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)))
    return models.Filter(must=must) if must else None


def upsert_chunks(client: QdrantClient, chunks: list[dict], vectors: list[list[float]],
                  doc_id: str, user_id: str) -> None:
    points = [
        models.PointStruct(
            id=point_id(doc_id, c["page"], c["chunk_index"]),
            vector=vec,
            payload={
                "user_id": user_id,
                "doc_id": doc_id,
                "page": c["page"],
                "chunk_index": c["chunk_index"],
                "chunk_id": f'{doc_id}:{c["page"]}:{c["chunk_index"]}',
                "text": c["text"],
                "extraction_method": "text",
            },
        )
        for c, vec in zip(chunks, vectors)
    ]
    client.upsert(collection_name=COLLECTION, points=points, wait=True)


def count_points(client: QdrantClient, doc_id: str | None = None, user_id: str | None = None) -> int:
    return client.count(
        collection_name=COLLECTION, count_filter=_filter(doc_id, user_id), exact=True
    ).count


def delete_document(client: QdrantClient, doc_id: str, user_id: str) -> None:
    """Delete a document's points. Requires BOTH ids so one user can't delete another's data."""
    client.delete(
        collection_name=COLLECTION,
        points_selector=models.FilterSelector(filter=_filter(doc_id, user_id)),
        wait=True,
    )