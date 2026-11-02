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
let _mapInstance = null;

async function init() {
  _mapInstance = initMap("citizen-map");

  const [zones, shelters, incidents] = await Promise.all([
    getZonesRisk(),
    getShelters(),
    getIncidents(),
  ]);

  renderRiskZonesGeoJSON(zones || _FALLBACK_ZONES);

  (shelters || []).forEach(s => addShelterMarker(s));
  (incidents || []).forEach(inc => addIncidentMarker(inc));

  setupLocateButton();
}

function setupLocateButton() {
  const btn = document.getElementById("btn-locate-citizen");
  if (!btn || !_mapInstance) return;

  btn.addEventListener("click", () => {
    btn.textContent = "📍 Locating…";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          _mapInstance.setView([lat, lng], 15);
          L.circle([lat, lng], {
            radius: 120,
            color: "var(--accent-cyan)",
            fillColor: "var(--accent-cyan)",
            fillOpacity: 0.3,
          }).addTo(_mapInstance).bindPopup("<b>📍 Your Current Location</b>").openPopup();
          btn.textContent = "✓ Located";
        },
        () => {
          // Default to Pune Riverside
          _mapInstance.setView([18.525, 73.850], 15);
          btn.textContent = "📍 Pune Riverside";
        }
      );
    } else {
      _mapInstance.setView([18.525, 73.850], 15);
      btn.textContent = "📍 Pune Riverside";
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

