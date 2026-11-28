from fastapi.testclient import TestClient

from main import app

client = TestClient(app)  # used without `with`, so the model is not loaded


def _body(key):
    return {"doc_id": "d1", "user_id": "u1", "file_key": key}


def test_ingest_rejects_path_traversal():
    assert client.post("/ingest", json=_body("../secret.pdf")).status_code == 400


def test_ingest_rejects_absolute_paths():
    assert client.post("/ingest", json=_body("/etc/passwd")).status_code == 400


def test_ingest_missing_file_is_404():
    assert client.post("/ingest", json=_body("u1/missing.pdf")).status_code == 404


def test_ingest_requires_fields():
    assert client.post("/ingest", json={"doc_id": "d1"}).status_code == 422