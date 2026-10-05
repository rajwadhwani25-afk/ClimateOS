"""
ClimateOS — API Skeleton Tests
Run: pytest tests/test_api.py -v

Tests cover the 7 stub API endpoints:
  GET  /api/zones/risk
  GET  /api/shelters
  GET  /api/incidents
  POST /api/reports
  GET  /api/recommendations
  POST /api/recommendations/{id}/decision
  POST /api/simulation
"""

import pytest
from fastapi.testclient import TestClient

from services.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
def test_root_health():
    """Health check endpoint should return 200 and correct platform name."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "ClimateOS" in data["platform"]
    assert data["status"] == "online"


# ---------------------------------------------------------------------------
# GET /api/zones/risk
# ---------------------------------------------------------------------------
def test_get_zones_risk_returns_list():
    """Should return a non-empty list of zone objects."""
    response = client.get("/api/zones/risk")
    assert response.status_code == 200
    zones = response.json()
    assert isinstance(zones, list)
    assert len(zones) >= 1


def test_get_zones_risk_structure():
    """Each zone should have required fields including risk_score."""
    response = client.get("/api/zones/risk")
    zone = response.json()[0]
    assert "id"           in zone
    assert "name"         in zone
    assert "risk_score"   in zone
    assert "risk_level"   in zone
    assert "status"       in zone
    assert 0 <= zone["risk_score"] <= 100


def test_get_single_zone_risk():
    """GET /api/zones/risk/{zone_id} should return the specific zone."""
    response = client.get("/api/zones/risk/zone-a")
    assert response.status_code == 200
    zone = response.json()
    assert zone["id"] == "zone-a"


def test_get_unknown_zone_returns_404():
    """Requesting a non-existent zone should return 404."""
    response = client.get("/api/zones/risk/zone-xyz")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/shelters
# ---------------------------------------------------------------------------
def test_get_shelters_returns_list():
    """Should return a non-empty list of shelter objects."""
    response = client.get("/api/shelters")
    assert response.status_code == 200
    shelters = response.json()
    assert isinstance(shelters, list)
    assert len(shelters) >= 1


def test_get_shelters_structure():
    """Each shelter should include capacity, occupancy, and status."""
    response = client.get("/api/shelters")
    shelter = response.json()[0]
    assert "id"        in shelter
    assert "name"      in shelter
    assert "capacity"  in shelter
    assert "occupancy" in shelter
    assert "status"    in shelter
    assert shelter["status"] in ("OPEN", "NEAR_CAPACITY", "FULL", "STANDBY")


# ---------------------------------------------------------------------------
# GET /api/incidents
# ---------------------------------------------------------------------------
def test_get_incidents_returns_list():
    """Should return a list of incidents (may be empty before any reports)."""
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)


def test_get_incidents_sorted_by_priority():
    """Incidents should be sorted by priority_score descending."""
    response = client.get("/api/incidents")
    incidents = response.json()
    if len(incidents) >= 2:
        assert incidents[0]["priority_score"] >= incidents[1]["priority_score"]


def test_incidents_have_confidence_label():
    """Each incident should have a confidence_label field."""
    response = client.get("/api/incidents")
    incidents = response.json()
    if incidents:
        label = incidents[0].get("confidence_label")
        assert label in ("High Confidence", "Needs Review", "Low Confidence")


# ---------------------------------------------------------------------------
# POST /api/reports
# ---------------------------------------------------------------------------
SAMPLE_REPORT = {
    "category":      "trapped",
    "description":   "Water rising up to 1.2m. 4 people trapped on 1st floor.",
    "location":      "142 Riverside Avenue",
    "lat":           18.526,
    "lng":           73.858,
    "zone_id":       "zone-a",
    "trapped_count": 4,
    "injured_count": 1,
    "photo_attached": True,
}

def test_submit_report_returns_200():
    """Submitting a valid report should return 200."""
    response = client.post("/api/reports", json=SAMPLE_REPORT)
    assert response.status_code == 200


def test_submit_report_returns_verification():
    """Response should include a verification object with confidence_score and status."""
    response = client.post("/api/reports", json=SAMPLE_REPORT)
    data = response.json()
    assert "verification" in data
    v = data["verification"]
    assert "confidence_score" in v
    assert "status"           in v
    assert v["status"] in ("High Confidence", "Needs Review", "Low Confidence")
    assert 0 <= v["confidence_score"] <= 100


def test_submit_report_creates_incident():
    """Response should include a derived incident with the same trapped_count."""
    response = client.post("/api/reports", json=SAMPLE_REPORT)
    data = response.json()
    assert "incident" in data
    assert data["incident"]["trapped_count"] == SAMPLE_REPORT["trapped_count"]


# ---------------------------------------------------------------------------
# GET /api/recommendations
# ---------------------------------------------------------------------------
def test_get_recommendations_returns_list():
    """Should return a non-empty list of recommendations."""
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    recs = response.json()
    assert isinstance(recs, list)
    assert len(recs) >= 1


def test_recommendations_have_decision_status():
    """Each recommendation should have a decision_status field."""
    response = client.get("/api/recommendations")
    rec = response.json()[0]
    assert "decision_status" in rec
    assert rec["decision_status"] in ("PENDING", "APPROVED", "REJECTED")


# ---------------------------------------------------------------------------
# POST /api/recommendations/{id}/decision
# ---------------------------------------------------------------------------
def test_approve_recommendation():
    """Approving a recommendation should succeed and return the decision."""
    recs = client.get("/api/recommendations").json()
    rec_id = recs[0]["id"]
    response = client.post(
        f"/api/recommendations/{rec_id}/decision",
        json={"decision": "APPROVED", "notes": "Authorized by operator."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "APPROVED"
    assert data["rec_id"]   == rec_id


def test_reject_recommendation():
    """Rejecting a recommendation should succeed."""
    recs = client.get("/api/recommendations").json()
    rec_id = recs[0]["id"]
    response = client.post(
        f"/api/recommendations/{rec_id}/decision",
        json={"decision": "REJECTED"}
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "REJECTED"


def test_invalid_decision_returns_400():
    """Submitting an unknown decision value should return 400."""
    recs = client.get("/api/recommendations").json()
    rec_id = recs[0]["id"]
    response = client.post(
        f"/api/recommendations/{rec_id}/decision",
        json={"decision": "MAYBE"}
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# POST /api/simulation
# ---------------------------------------------------------------------------
def test_simulation_returns_updated_zone_risk():
    """Simulation with rainfall and water level should return an updated zone risk."""
    response = client.post("/api/simulation", json={
        "rainfall_mm_hr": 120.0,
        "water_level_m":  5.0,
        "zone_id":        "zone-a"
    })
    assert response.status_code == 200
    data = response.json()
    assert "updated_zone_risk" in data
    risk = data["updated_zone_risk"]
    assert "risk_score"  in risk
    assert "risk_level"  in risk
    assert "status"      in risk
    assert 0 <= risk["risk_score"] <= 100


def test_simulation_low_values_return_lower_risk():
    """Simulation with very low rainfall should produce a lower risk than high rainfall."""
    low_response  = client.post("/api/simulation", json={"rainfall_mm_hr": 5.0,  "water_level_m": 0.2, "zone_id": "zone-a"})
    high_response = client.post("/api/simulation", json={"rainfall_mm_hr": 180.0, "water_level_m": 7.0, "zone_id": "zone-a"})

    low_risk  = low_response.json()["updated_zone_risk"]["risk_score"]
    high_risk = high_response.json()["updated_zone_risk"]["risk_score"]
    assert low_risk < high_risk
