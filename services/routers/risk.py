"""
Router: Risk Zones
Endpoint: GET /api/zones/risk
Returns zone risk data loaded from data/zones.geojson
"""

import json
import os
from fastapi import APIRouter

router = APIRouter()

# ---------------------------------------------------------------------------
# Load mock data once at startup
# ---------------------------------------------------------------------------
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/zones.geojson")

def _load_zones():
    with open(_DATA_PATH, "r") as f:
        geojson = json.load(f)
    # Flatten GeoJSON features into plain zone dicts for the API response
    zones = []
    for feature in geojson.get("features", []):
        props = feature["properties"]
        zones.append({
            "id":                 props["id"],
            "name":               props["name"],
            "risk_level":         props["risk_level"],   # low | moderate | high | severe
            "risk_score":         props["risk_score"],   # 0–100
            "status":             props["status"],
            "population_at_risk": props["population_at_risk"],
            "terrain":            props["terrain"],
            "rainfall_mm_hr":     props["rainfall_mm_hr"],
            "water_level_m":      props["water_level_m"],
            "color":              props["color"],
            "geometry":           feature["geometry"],
        })
    return zones


_ZONES_CACHE = _load_zones()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/zones/risk")
def get_zones_risk():
    """
    Return risk data for all city zones.

    TODO (Risk Engine): Replace mock data with real-time risk calculation
    from rainfall sensors, river gauges, terrain models, and citizen reports.
    Each zone's risk_score should be recalculated on every data refresh cycle.
    """
    return _ZONES_CACHE


@router.get("/zones/risk/{zone_id}")
def get_zone_risk(zone_id: str):
    """
    Return risk data for a single zone by ID.

    TODO (Risk Engine): Add spatial lookup — accept lat/lng and return
    the zone the coordinate falls within (PostGIS ST_Contains).
    """
    zone = next((z for z in _ZONES_CACHE if z["id"] == zone_id), None)
    if zone is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return zone
