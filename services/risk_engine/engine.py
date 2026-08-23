import math

class RiskEngine:
    """
    Python Risk Prediction Engine
    Calculates multi-factor risk scores from rainfall intensity (mm/hr), 
    water level (m), historical risk factor, and report density.
    """
    def calculate_zone_risk(self, zone_id: str, rainfall_mm_hr: float, water_level_m: float, report_count: int, terrain: str) -> dict:
        base_risk = (rainfall_mm_hr * 0.75) + (water_level_m * 18.0) + (report_count * 4.5)
        
        # Terrain multiplier
        if "basin" in terrain.lower() or zone_id == "zone-a":
            base_risk *= 1.35
        elif "hills" in terrain.lower():
            base_risk *= 0.65

        final_score = min(99.0, max(5.0, round(base_risk, 1)))
        
        if final_score >= 75.0:
            status = "HIGH RISK"
            severity = "CRITICAL"
        elif final_score >= 45.0:
            status = "MEDIUM RISK"
            severity = "ELEVATED"
        elif final_score >= 25.0:
            status = "MODERATE RISK"
            severity = "MODERATE"
        else:
            status = "LOW RISK"
            severity = "NORMAL"

        return {
            "zone_id": zone_id,
            "risk_score": final_score,
            "status": status,
            "severity": severity,
            "confidence": min(98.0, 80.0 + (report_count * 2.0))
        }

risk_engine = RiskEngine()
