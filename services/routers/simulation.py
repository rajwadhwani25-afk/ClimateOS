"""
Router: Disaster Simulation
Endpoint: POST /api/simulation
Accepts rainfall (mm/hr) and water level (m); returns updated mock zone risk.
"""

import os
import json
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
class SimulationInput(BaseModel):
    rainfall_mm_hr: float = 110.0    # Simulated rainfall intensity
    water_level_m: float  = 4.2      # Simulated river/gauge water level
    zone_id: str          = "zone-a" # Zone to simulate (default: Zone A)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_ZONE_MULTIPLIERS = {
    "zone-a": 1.35,   # Low-lying basin amplifier
    "zone-b": 1.10,
    "zone-c": 0.90,
    "zone-d": 0.65,
    "zone-e": 1.05,
}

def _calculate_mock_risk(rainfall: float, water_level: float, zone_id: str) -> dict:
    """
    TODO (Simulation Engine): Replace this linear formula with the real
    Risk Prediction Engine — should integrate:
      - Hydrological terrain model (DEM data)
      - Drainage network capacity
      - Soil saturation index
      - Upstream river inflow rates
      - Historical flood event curves
    """
    multiplier = _ZONE_MULTIPLIERS.get(zone_id, 1.0)
    raw_score = (rainfall * 0.5) + (water_level * 10)
    score = min(99, max(5, round(raw_score * multiplier * 0.6)))

    if score >= 80:
        risk_level, status = "severe", "CRITICAL RISK"
    elif score >= 60:
        risk_level, status = "high", "HIGH RISK"
    elif score >= 35:
        risk_level, status = "moderate", "MODERATE RISK"
    else:
        risk_level, status = "low", "LOW RISK"

    return {
        "zone_id":         zone_id,
        "risk_score":      score,
        "risk_level":      risk_level,
        "status":          status,
        "rainfall_mm_hr":  rainfall,
        "water_level_m":   water_level,
        "advice":          _get_advice(risk_level),
    }


def _get_advice(risk_level: str) -> str:
    return {
        "severe":   "IMMEDIATE EVACUATION required. All zones critical. Deploy all emergency resources.",
        "high":     "Evacuation recommended for low-lying zones. Monitor closely, prepare resources.",
        "moderate": "Stay alert. Avoid flood-prone areas. Check shelter availability.",
        "low":      "Situation manageable. Continue monitoring rainfall and river gauge levels.",
    }.get(risk_level, "Monitor conditions.")

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

# Propagation dampening — neighboring zones are affected by a fraction of the risk
_PROPAGATION_FACTOR = {
    "zone-a": {"zone-b": 0.75, "zone-c": 0.65, "zone-d": 0.30, "zone-e": 0.55},
    "zone-b": {"zone-a": 0.80, "zone-c": 0.70, "zone-d": 0.35, "zone-e": 0.60},
    "zone-c": {"zone-a": 0.70, "zone-b": 0.65, "zone-d": 0.40, "zone-e": 0.50},
    "zone-d": {"zone-a": 0.40, "zone-b": 0.45, "zone-c": 0.50, "zone-e": 0.35},
    "zone-e": {"zone-a": 0.60, "zone-b": 0.65, "zone-c": 0.55, "zone-d": 0.30},
}

@router.post("/simulation")
def run_simulation(body: SimulationInput):
    """
    Run a simulation scenario with the given rainfall and water level.
    Returns:
      - updated_zone_risk : full risk object for the selected zone
      - all_zones_risk    : propagated risk for all 5 zones (for full map re-render)

    UI: Powers the Simulation Panel sliders in Government Mode.
    The frontend uses all_zones_risk to re-color every polygon simultaneously.
    """
    # Primary zone
    primary = _calculate_mock_risk(body.rainfall_mm_hr, body.water_level_m, body.zone_id)

    # Propagated risk to neighboring zones
    all_zones: dict = {body.zone_id: primary}
    for other_id, factor in _PROPAGATION_FACTOR.get(body.zone_id, {}).items():
        all_zones[other_id] = _calculate_mock_risk(
            body.rainfall_mm_hr * factor,
            body.water_level_m  * factor,
            other_id,
        )

    return {
        "simulation_input": {
            "rainfall_mm_hr": body.rainfall_mm_hr,
            "water_level_m":  body.water_level_m,
            "zone_id":        body.zone_id,
        },
        "updated_zone_risk": primary,
        "all_zones_risk":    list(all_zones.values()),
        "note": "Mock calculation with propagation model. Real risk engine not yet connected.",
    }
