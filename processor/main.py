import hmac
import os
import time
from contextlib import asynccontextmanager
import pipeline
from storage import resolve_storage_path

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

import embedder
import vectorstore
from settings import COLLECTION


@asynccontextmanager
async def lifespan(app: FastAPI):
    embedder.get_model()  # load the model once at startup, not on the first question
    app.state.qdrant = vectorstore.get_client()
    vectorstore.ensure_collection(app.state.qdrant, embedder.dimension())
    yield
    app.state.qdrant.close()


app = FastAPI(title="SmartNotes processor", lifespan=lifespan)


def require_internal_key(x_internal_key: str | None = Header(default=None)):
    """If PROCESSOR_API_KEY is set, callers must send it in the X-Internal-Key header."""
    expected = os.getenv("PROCESSOR_API_KEY")
    if expected and not hmac.compare_digest((x_internal_key or "").encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid internal key")


class SearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    user_id: str = Field(min_length=1)
    doc_ids: list[str] | None = Field(default=None, min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class Hit(BaseModel):
    doc_id: str
    page: int
    chunk_id: str
    score: float
    text: str


class SearchResponse(BaseModel):
    results: list[Hit]
    took_ms: int


@app.get("/health")
def health():
    return {"status": "ok", "collection": COLLECTION}


# Plain `def`, not `async def`: embedding is CPU-bound, so FastAPI runs it in a worker thread
# instead of blocking the event loop.
@app.post("/search", response_model=SearchResponse, dependencies=[Depends(require_internal_key)])
def search_endpoint(req: SearchRequest, request: Request):
    started = time.perf_counter()
    vector = embedder.embed_texts([req.question])[0]
    results = vectorstore.search(request.app.state.qdrant, vector, req.user_id, req.doc_ids, req.top_k)
    return {"results": results, "took_ms": round((time.perf_counter() - started) * 1000)}   

class IngestRequest(BaseModel):
    doc_id: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    file_key: str = Field(min_length=1)  # path relative to STORAGE_DIR


class IngestResponse(BaseModel):
    doc_id: str
    pages: int
    chunks: int
    weak_pages: int
    seconds: float


@app.post("/ingest", response_model=IngestResponse, dependencies=[Depends(require_internal_key)])
def ingest_endpoint(req: IngestRequest, request: Request):
    try:
        path = resolve_storage_path(req.file_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found in storage")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        return pipeline.ingest_pdf(request.app.state.qdrant, path, req.doc_id, req.user_id)
    except ValueError as exc:  # e.g. "PDF is encrypted"
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError:  # PyMuPDF raises these for corrupt files
        raise HTTPException(status_code=422, detail="Could not read this PDF")