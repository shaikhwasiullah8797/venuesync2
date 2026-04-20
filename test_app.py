# Forced language server re-parse
import pytest
from fastapi.testclient import TestClient
from app import app, crowd_metrics
import json

client = TestClient(app)

def test_get_crowd_data():
    response = client.get("/api/crowd_data")
    assert response.status_code == 200
    data = response.json()
    assert "North Gate" in data
    assert "East Gate" in data

def test_sos_triage_no_api_key(monkeypatch):
    # Temporarily remove GOOGLE_API_KEY to test the 401 response
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    response = client.post("/api/sos_triage", json={"message": "Medical emergency here!"})
    assert response.status_code == 401
    assert "error" in response.json()

def test_chat_no_api_key(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    response = client.post("/api/chat", json={"query": "Where is the popcorn?"})
    assert response.status_code == 401
    assert "error" in response.json()

def test_crowd_metrics_schema():
    assert isinstance(crowd_metrics, dict)
    assert crowd_metrics["North Gate"] >= 0
