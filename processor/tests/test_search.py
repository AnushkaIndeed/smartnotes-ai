import pytest
from fastapi.testclient import TestClient

from main import app
from vectorstore import search_filter

client = TestClient(app)  # used without `with`, so the model is not loaded for these tests


def _keys(flt):
    return [c.key for c in flt.must]


def test_filter_always_scopes_to_user():
    assert _keys(search_filter("u1")) == ["user_id"]


def test_filter_adds_doc_condition():
    assert _keys(search_filter("u1", ["d1", "d2"])) == ["user_id", "doc_id"]


def test_empty_doc_list_does_not_widen_the_search():
    assert _keys(search_filter("u1", [])) == ["user_id", "doc_id"]


def test_missing_user_id_raises():
    with pytest.raises(ValueError):
        search_filter("")


def test_health():
    assert client.get("/health").status_code == 200


@pytest.mark.parametrize("body", [
    {"question": "hi"},                                    # no user_id
    {"user_id": "u1"},                                     # no question
    {"question": "", "user_id": "u1"},                     # empty question
    {"question": "hi", "user_id": ""},                     # empty user
    {"question": "hi", "user_id": "u1", "top_k": 500},     # too many results
    {"question": "hi", "user_id": "u1", "doc_ids": []},    # empty doc list
])
def test_invalid_requests_are_rejected(body):
    assert client.post("/search", json=body).status_code == 422


def test_internal_key_is_enforced_when_configured(monkeypatch):
    monkeypatch.setenv("PROCESSOR_API_KEY", "secret")
    body = {"question": "hi", "user_id": "u1"}
    assert client.post("/search", json=body).status_code == 401
    assert client.post("/search", json=body, headers={"x-internal-key": "wrong"}).status_code == 401