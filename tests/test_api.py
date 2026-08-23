import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.api.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["platform"] == "ClimateOS — Disaster Intelligence & Response Platform"

def test_get_risk_zones():
    response = client.get("/risk/zones")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 1
    assert zones[0]["id"] == "zone-a"

def test_create_report():
    report_data = {
        "reporter_id": "test-user-1",
        "category": "trapped",
        "location": "142 Riverside Avenue",
        "lat": 12.973,
        "lng": 77.595,
        "description": "Water entering home quickly, 4 people trapped.",
        "trapped_count": 4,
        "injured_count": 0
    }
    response = client.post("/reports", json=report_data)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["verification"]["status"] in ["HIGH_CONFIDENCE", "NEEDS_REVIEW"]
    assert res_json["incident"]["trapped_count"] == 4

def test_safe_route():
    req_data = {
        "origin_lat": 12.973,
        "origin_lng": 77.595,
        "destination_id": "shelter-b",
        "blocked_roads": ["Riverside Drive Bridge"]
    }
    response = client.post("/routes/safe", json=req_data)
    assert response.status_code == 200
    res_json = response.json()
    assert "Route C" in res_json["route_name"]
