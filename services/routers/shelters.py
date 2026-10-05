"""
Router: Shelters
Endpoint: GET /api/shelters
Returns shelter list loaded from data/shelters.json
"""

import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

# ---------------------------------------------------------------------------
# Load mock data
# ---------------------------------------------------------------------------
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/shelters.json")

with open(_DATA_PATH, "r") as _f:
    _SHELTERS: list = json.load(_f)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/shelters")
def get_shelters():
    """
    Return all shelters with capacity, occupancy, and status.

    TODO (Shelter Intelligence): Connect to live shelter management system.
    Occupancy should update in real-time as evacuees check in/out.
    Add route_safe flag per shelter based on current road blockage data.
    """
    return _SHELTERS


@router.get("/shelters/{shelter_id}")
def get_shelter(shelter_id: str):
    """
    Return a single shelter by ID.
    """
    shelter = next((s for s in _SHELTERS if s["id"] == shelter_id), None)
    if shelter is None:
        raise HTTPException(status_code=404, detail=f"Shelter '{shelter_id}' not found")
    return shelter
