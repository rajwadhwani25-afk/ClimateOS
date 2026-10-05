/**
 * ClimateOS — Citizen Mode: Map View Controller
 * File owner: Map / GIS team
 *
 * Renders Leaflet map with risk zones, shelters, and incident markers.
 */

import { initMap, renderRiskZonesGeoJSON, addIncidentMarker, addShelterMarker } from "../map.js";
import { getZonesRisk, getShelters, getIncidents } from "../api.js";

// ---------------------------------------------------------------------------
// Fallback mock data (used when backend is offline)
// ---------------------------------------------------------------------------
const _FALLBACK_ZONES = [
  {
    id: "zone-a", name: "Zone A — Riverside", risk_level: "severe", risk_score: 88, status: "HIGH RISK",
    geometry: { type: "Polygon", coordinates: [[[73.845,18.528],[73.860,18.535],[73.875,18.525],[73.855,18.515],[73.845,18.528]]] },
  },
  {
    id: "zone-b", name: "Zone B — Downtown", risk_level: "high", risk_score: 64, status: "MODERATE RISK",
    geometry: { type: "Polygon", coordinates: [[[73.855,18.515],[73.875,18.525],[73.885,18.505],[73.860,18.498],[73.855,18.515]]] },
  },
  {
    id: "zone-d", name: "Zone D — North Hills", risk_level: "low", risk_score: 15, status: "LOW RISK",
    geometry: { type: "Polygon", coordinates: [[[73.860,18.535],[73.870,18.550],[73.890,18.540],[73.875,18.525],[73.860,18.535]]] },
  },
];

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
async function init() {
  initMap("citizen-map");

  const [zones, shelters, incidents] = await Promise.all([
    getZonesRisk(),
    getShelters(),
    getIncidents(),
  ]);

  renderRiskZonesGeoJSON(zones || _FALLBACK_ZONES);

  (shelters || []).forEach(s => addShelterMarker(s));
  (incidents || []).forEach(inc => addIncidentMarker(inc));

  // TODO (Safe Route): Render the recommended safe route polyline on this map.
  // Call GET /api/safe-route once the routing engine is implemented.
}

document.addEventListener("DOMContentLoaded", init);
