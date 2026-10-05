"""
Router: Citizen Reports & Incidents
Endpoints:
  POST /api/reports          — submit a citizen report; returns fake confidence score
  GET  /api/incidents        — return ranked incidents with confidence labels
"""

import json
import os
import random
import string
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ---------------------------------------------------------------------------
# Load initial mock incidents
# ---------------------------------------------------------------------------
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/incidents.json")

with open(_DATA_PATH, "r") as _f:
    _INCIDENTS: list = json.load(_f)

# In-memory store for submitted reports (resets on server restart)
_REPORTS: list = []


# ---------------------------------------------------------------------------
# Pydantic schema for incoming citizen reports
# ---------------------------------------------------------------------------
class CitizenReportIn(BaseModel):
    category: str          # flood | trapped | road | fire | medical | power_failure | water_shortage | infrastructure
    description: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    zone_id: Optional[str] = None
    trapped_count: Optional[int] = 0
    injured_count: Optional[int] = 0
    photo_attached: Optional[bool] = False
    reporter_id: Optional[str] = "anonymous"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_CATEGORY_WEIGHTS = {
    "trapped":          30,
    "medical":          25,
    "flood":            20,
    "fire":             22,
    "road":             15,
    "infrastructure":   12,
    "power_failure":    10,
    "water_shortage":    8,
}

def _fake_confidence_score(report: dict) -> dict:
    """
    TODO (AI Report Verification): Replace this stub with real AI verification.
    Real logic should cross-reference:
      - GPS coordinates vs. active flood zone polygons
      - Photo EXIF metadata and computer vision flood detection
      - Temporal clustering of nearby reports
      - Historical pattern matching
      - Sensor feed correlation (rainfall, water level)
    """
    base = 55
    if report.get("photo_attached"):
        base += 15
    if report.get("trapped_count", 0) > 0:
        base += 10
    if report.get("zone_id") == "zone-a":
        base += 10
    if report.get("lat") and report.get("lng"):
        base += 8
    # Add a small random delta to simulate model variance
    base += random.randint(-5, 5)
    score = min(98, max(20, base))

    if score >= 85:
        label = "High Confidence"
    elif score >= 55:
        label = "Needs Review"
    else:
        label = "Low Confidence"

    return {"confidence_score": score, "status": label}


def _fake_priority_score(report: dict, confidence: int) -> int:
    """
    TODO (Priority Engine): Replace with real Impact & Priority Engine.
    Should factor in: severity, trapped/injured count, zone risk level,
    resource availability, and escalation urgency.
    """
    weight = _CATEGORY_WEIGHTS.get(report.get("category", ""), 10)
    trapped_score = (report.get("trapped_count") or 0) * 12
    injured_score = (report.get("injured_count") or 0) * 18
    raw = weight + trapped_score + injured_score + (confidence * 0.2)
    return min(99, int(raw))


def _random_id(prefix: str) -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{prefix}-{suffix}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/reports")
def submit_report(body: CitizenReportIn):
    """
    Accept a citizen disaster report.
    Returns the stored report enriched with a fake AI confidence score.

    TODO (AI Report Verification): Trigger async verification pipeline here.
    TODO (Offline Cache): Add service-worker support to queue reports when offline.
    """
    report_dict = body.model_dump()
    report_dict["id"] = _random_id("REP")
    report_dict["submitted_at"] = datetime.now(timezone.utc).isoformat()

    verification = _fake_confidence_score(report_dict)
    priority = _fake_priority_score(report_dict, verification["confidence_score"])

    # Create a derived incident and prepend to in-memory list
    incident = {
        "id": _random_id("INC"),
        "category": body.category,
        "severity": "HIGH" if priority > 70 else "MODERATE",
        "location": body.location or "Unknown",
        "lat": body.lat,
        "lng": body.lng,
        "description": body.description,
        "status": "ACTIVE",
        "confidence_score": verification["confidence_score"],
        "confidence_label": verification["status"],
        "priority_score": priority,
        "trapped_count": body.trapped_count,
        "injured_count": body.injured_count,
        "zone_id": body.zone_id,
        "reported_by": "citizen-app",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verified": False,
    }
    _INCIDENTS.insert(0, incident)
    _REPORTS.append(report_dict)

    return {
        "report":       report_dict,
        "verification": verification,
        "incident":     incident,
    }


@router.get("/incidents")
def get_incidents():
    """
    Return all incidents ranked by priority_score (descending).
    Confidence labels: High Confidence | Needs Review | Low Confidence

    TODO (Priority Engine): Sort order should consider time-decay,
    resource availability, and zone criticality — not just raw priority score.
    """
    sorted_incidents = sorted(_INCIDENTS, key=lambda i: i.get("priority_score", 0), reverse=True)
    return sorted_incidents
