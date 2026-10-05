/**
 * ClimateOS — Government Mode: Command Center Map Panel
 * File owner: Government Dashboard / Map team
 *
 * Full-screen command center map with all layers: risk zones, shelters, incidents.
 */

import { initMap, renderRiskZonesGeoJSON, addIncidentMarker, addShelterMarker, invalidateSize } from "../map.js";
import { getZonesRisk, getShelters, getIncidents } from "../api.js";

let _mapInstance = null;

export async function initCommandMap(containerId = "gov-map") {
  _mapInstance = initMap(containerId, { zoom: 13 });

  const [zones, shelters, incidents] = await Promise.all([
    getZonesRisk(),
    getShelters(),
    getIncidents(),
  ]);

  renderRiskZonesGeoJSON(zones || []);
  (shelters  || []).forEach(s   => addShelterMarker(s));
  (incidents || []).forEach(inc => addIncidentMarker(inc));
}

export function refreshMapSize() {
  invalidateSize();
}

document.addEventListener("DOMContentLoaded", () => {
  initCommandMap("gov-map");
});
