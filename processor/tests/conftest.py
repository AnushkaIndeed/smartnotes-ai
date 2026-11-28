import pytest


@pytest.fixture(autouse=True)
def _no_internal_key(monkeypatch):
    monkeypatch.delenv("PROCESSOR_API_KEY", raising=False)