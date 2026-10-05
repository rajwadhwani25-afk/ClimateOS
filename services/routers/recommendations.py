"""
Router: AI Recommendations (Human-in-the-loop)
Endpoints:
  GET  /api/recommendations
  POST /api/recommendations/{id}/decision   — approve or reject
"""

import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# ---------------------------------------------------------------------------
# Load mock recommendations
# ---------------------------------------------------------------------------
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/recommendations.json")

with open(_DATA_PATH, "r") as _f:
    _RECS: list = json.load(_f)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
class DecisionPayload(BaseModel):
    decision: str          # "APPROVED" | "REJECTED"
    operator_id: str = "gov-operator-1"
    notes: str = ""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/recommendations")
def get_recommendations():
    """
    Return all AI-generated recommendations sorted by priority.

    TODO (Recommendation Engine): Replace with dynamic generation from:
      - Current zone risk scores
      - Active incident priority feed
      - Available resource inventory
      - Historical effectiveness of similar actions
    """
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MODERATE": 2, "LOW": 3}
    sorted_recs = sorted(_RECS, key=lambda r: priority_order.get(r.get("priority", "LOW"), 4))
    return sorted_recs


@router.post("/recommendations/{rec_id}/decision")
def update_decision(rec_id: str, body: DecisionPayload):
    """
    Record a human authority's approve / reject decision on a recommendation.
    This is the human-in-the-loop gate — AI recommends, humans decide.

    TODO (Feedback Loop): Approved decisions should trigger:
      - Resource dispatch notifications
      - Map overlay updates
      - AI re-calculation cycle (FR-14)
    TODO (Audit Trail): Persist decisions with operator ID and timestamp to DB.
    """
    rec = next((r for r in _RECS if r["id"] == rec_id), None)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found")

    if body.decision not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="decision must be 'APPROVED' or 'REJECTED'")

    rec["decision_status"] = body.decision
    rec["decided_by"] = body.operator_id
    rec["decision_notes"] = body.notes

    return {
        "rec_id":    rec_id,
        "decision":  body.decision,
        "status":    "recorded",
        "message":   f"Recommendation {rec_id} has been {body.decision.lower()} by {body.operator_id}.",
    }
