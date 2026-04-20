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

def test_surge_endpoint_success():
    """Validates the hardware simulator override endpoint."""
    response = client.post("/api/surge", json={"facility": "North Gate"})
    assert response.status_code == 200
    assert response.json()["facility"] == "North Gate"

def test_surge_endpoint_invalid_location():
    """Validates surge routing handles invalid maps."""
    response = client.post("/api/surge", json={"facility": "Fake Gateway"})
    assert response.status_code == 404

def test_security_headers_injected():
    """Validates that security middleware strictly applies HTTP headers."""
    response = client.get("/api/crowd_data")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
