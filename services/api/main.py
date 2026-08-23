import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from packages.schemas.models import (
    User, CitizenReport, Verification, Incident, RiskZone, 
    Shelter, Resource, Recommendation, SafeRouteRequest, SafeRouteResponse, SimulationEvent
)
from services.risk_engine.engine import risk_engine
from services.verification.verifier import report_verifier
from services.priority_engine.ranker import priority_ranker
from services.recommendation.advisor import recommendation_advisor
from services.routing.safe_route import safe_route_engine

app = FastAPI(
    title="ClimateOS API Service",
    description="AI-Powered Climate Disaster Intelligence & Response Platform Backend API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory State (PostgreSQL/PostGIS state fallback for local execution)
DATA_SEED_PATH = os.path.join(os.path.dirname(__file__), "../../data/seed/zone_a_seed.json")
SCENARIO_PATH = os.path.join(os.path.dirname(__file__), "../../data/scenarios/10_step_simulation.json")

db_zones: List[Dict[str, Any]] = []
db_shelters: List[Dict[str, Any]] = []
db_resources: List[Dict[str, Any]] = []
db_reports: List[Dict[str, Any]] = []
db_incidents: List[Dict[str, Any]] = []
db_recommendations: List[Dict[str, Any]] = []
db_blocked_roads: List[str] = []

sim_current_step: int = 2
sim_scenario: List[Dict[str, Any]] = []

def load_seed():
    global db_zones, db_shelters, db_resources, db_incidents, db_recommendations, sim_scenario
    if os.path.exists(DATA_SEED_PATH):
        with open(DATA_SEED_PATH, "r") as f:
            seed = json.load(f)
            db_zones = seed.get("zones", [])
            db_shelters = seed.get("shelters", [])
            db_resources = seed.get("resources", [])

    if os.path.exists(SCENARIO_PATH):
        with open(SCENARIO_PATH, "r") as f:
            sim_scenario = json.load(f)

    # Initial seed incident
    db_incidents = [
        {
            "id": "INC-101",
            "category": "flood",
            "severity": "HIGH",
            "location": "Riverside Drive Bridge",
            "lat": 12.975,
            "lng": 77.595,
            "description": "Water overflowing embankment by +35cm. Road partially submerged.",
            "status": "ACTIVE",
            "confidence_score": 94.0,
            "priority_score": 88.0,
            "trapped_count": 0,
            "injured_count": 0
        }
    ]
    db_recommendations = recommendation_advisor.generate(db_zones, db_incidents)

load_seed()

# WebSocket Manager for Live SSE / Streaming
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "platform": "ClimateOS — Disaster Intelligence & Response Platform",
        "version": "2.0.0"
    }

@app.post("/auth/login")
def login(payload: Dict[str, str]):
    return {
        "access_token": "token-climateos-demo-99",
        "token_type": "bearer",
        "user": {
            "id": "user-gov-1",
            "role": payload.get("role", "authority"),
            "name": "Command Center Operator"
        }
    }

@app.get("/risk/zones", response_model=List[RiskZone])
def get_risk_zones():
    return db_zones

@app.get("/risk/current")
def get_current_risk(lat: float = Query(...), lng: float = Query(...)):
    # Spatial proximity matching to Zone A / B / C / D
    return {
        "zone_id": "zone-a",
        "name": "Zone A — Riverside",
        "risk_score": db_zones[0]["score"] if db_zones else 88.0,
        "status": db_zones[0]["status"] if db_zones else "HIGH RISK",
        "advice": "Flash flood warning active in your zone. Move to high ground immediately."
    }

@app.post("/reports")
async def create_report(report: CitizenReport):
    report_dict = report.model_dump()
    if not report_dict.get("id"):
        report_dict["id"] = f"REP-{len(db_reports) + 8800}"

    db_reports.append(report_dict)

    # Perform AI Verification
    verification = report_verifier.verify(report_dict)
    
    # Create Incident
    p_score = priority_ranker.rank_incident({
        "trapped_count": report.trapped_count,
        "injured_count": report.injured_count,
        "category": report.category,
        "confidence_score": verification["confidence_score"]
    })

    incident = {
        "id": f"INC-{len(db_incidents) + 200}",
        "category": report.category,
        "severity": "HIGH" if p_score > 70 else "MODERATE",
        "location": report.location,
        "lat": report.lat,
        "lng": report.lng,
        "description": report.description,
        "status": "ACTIVE",
        "confidence_score": verification["confidence_score"],
        "priority_score": p_score,
        "trapped_count": report.trapped_count,
        "injured_count": report.injured_count
    }
    db_incidents.insert(0, incident)

    # Update Recommendations
    global db_recommendations
    db_recommendations = recommendation_advisor.generate(db_zones, db_incidents)

    # Broadcast Live Update via WebSocket
    await manager.broadcast({
        "type": "NEW_REPORT",
        "report": report_dict,
        "verification": verification,
        "incident": incident
    })

    return {
        "report": report_dict,
        "verification": verification,
        "incident": incident
    }

@app.get("/incidents", response_model=List[Incident])
def get_incidents():
    return db_incidents

@app.post("/incidents/{incident_id}/verify")
def verify_incident(incident_id: str):
    inc = next((i for i in db_incidents if i["id"] == incident_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    verification = report_verifier.verify(inc)
    return verification

@app.get("/shelters/nearby", response_model=List[Shelter])
def get_shelters():
    return db_shelters

@app.post("/routes/safe", response_model=SafeRouteResponse)
def get_safe_route(req: SafeRouteRequest):
    return safe_route_engine.calculate_safe_route(
        req.origin_lat, req.origin_lng, req.destination_id, req.blocked_roads or db_blocked_roads
    )

@app.get("/resources", response_model=List[Resource])
def get_resources():
    return db_resources

@app.get("/priorities")
def get_priorities():
    sorted_incidents = sorted(db_incidents, key=lambda x: x.get("priority_score", 0), reverse=True)
    return {
        "prioritized_incidents": sorted_incidents,
        "top_action": sorted_incidents[0] if sorted_incidents else None
    }

@app.get("/recommendations", response_model=List[Recommendation])
def get_recommendations():
    return db_recommendations

@app.post("/recommendations/{rec_id}/decision")
async def update_recommendation_decision(rec_id: str, payload: Dict[str, str]):
    decision = payload.get("decision", "ACCEPTED")
    for r in db_recommendations:
        if r["id"] == rec_id:
            r["decision_status"] = decision
            break
    
    await manager.broadcast({
        "type": "RECOMMENDATION_DECISION",
        "rec_id": rec_id,
        "decision": decision
    })
    return {"rec_id": rec_id, "status": decision}

@app.post("/simulation/step")
async def advance_simulation(payload: Dict[str, int]):
    global sim_current_step, db_blocked_roads, db_zones
    step_idx = payload.get("step", sim_current_step + 1)
    
    matching_step = next((s for s in sim_scenario if s["step"] == step_idx), None)
    if matching_step:
        sim_current_step = step_idx
        
        # Update risk score in zone-a
        if db_zones:
            new_risk = risk_engine.calculate_zone_risk(
                "zone-a", 
                matching_step.get("rainfall_mm_hr", 110), 
                matching_step.get("water_level_m", 4.2), 
                len(db_reports), 
                "Low-lying basin"
            )
            db_zones[0]["score"] = new_risk["risk_score"]
            db_zones[0]["status"] = new_risk["status"]

        if matching_step.get("blocked_road"):
            if matching_step["blocked_road"] not in db_blocked_roads:
                db_blocked_roads.append(matching_step["blocked_road"])

        if matching_step.get("new_report"):
            rep = matching_step["new_report"]
            if not any(r["id"] == rep["id"] for r in db_reports):
                db_reports.append(rep)
                db_incidents.insert(0, {
                    "id": f"INC-{rep['id']}",
                    "category": rep["category"],
                    "severity": "HIGH",
                    "location": rep["location"],
                    "lat": rep["lat"],
                    "lng": rep["lng"],
                    "description": rep["description"],
                    "status": "ACTIVE",
                    "confidence_score": 94.0,
                    "priority_score": 92.0,
                    "trapped_count": rep.get("trapped_count", 0),
                    "injured_count": rep.get("injured_count", 0)
                })

        await manager.broadcast({
            "type": "SIMULATION_STEP",
            "step": matching_step,
            "zones": db_zones,
            "blocked_roads": db_blocked_roads
        })

        return {"status": "success", "step": matching_step}

    return {"status": "end_of_simulation"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
