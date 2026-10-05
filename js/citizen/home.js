/**
 * ClimateOS — Citizen Mode: Home Page Controller
 * File owner: Citizen Mode feature team
 *
 * Handles: Risk status card, nearest shelter card, geolocation
 */

import { getZoneRisk, getShelters } from "../api.js";

// ---------------------------------------------------------------------------
// Risk Status Card
// ---------------------------------------------------------------------------
async function loadRiskStatus() {
  const card = document.getElementById("citizen-risk-card");
  if (!card) return;

  // TODO (Personalization Engine): Use navigator.geolocation to get user's
  // real position, then call GET /api/zones/risk?lat=X&lng=Y for zone lookup.
  // For now, default to Zone A as demo.
  const zone = await getZoneRisk("zone-a");

  if (!zone) {
    // Fallback: display hardcoded demo values when backend is offline
    card.innerHTML = buildRiskCard({
      name: "Zone A — Riverside",
      status: "HIGH RISK",
      risk_score: 88,
      risk_level: "severe",
      advice: "Flash flood warning active. Move to high ground immediately.",
    });
    return;
  }

  card.innerHTML = buildRiskCard(zone);
}

function buildRiskCard(zone) {
  const colorMap = { severe: "#ef4444", high: "#f97316", moderate: "#f59e0b", low: "#22c55e" };
  const color = colorMap[zone.risk_level] || "#f59e0b";
  const pct = zone.risk_score;
  return `
    <div class="risk-card" style="border-left: 4px solid ${color};">
      <div class="risk-card__header">
        <span class="risk-badge risk-badge--${zone.risk_level}">${zone.status}</span>
        <span class="risk-card__zone">${zone.name}</span>
      </div>
      <div class="risk-card__score-row">
        <span class="risk-card__score" style="color:${color}">${pct}</span>
        <span class="risk-card__score-label">/ 100 Risk Score</span>
      </div>
      <div class="risk-card__bar">
        <div class="risk-card__bar-fill" style="width:${pct}%;background:${color};"></div>
      </div>
      <p class="risk-card__advice">${zone.advice || "Stay alert and monitor official updates."}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Nearest Shelter Card
// ---------------------------------------------------------------------------
async function loadNearestShelters() {
  const card = document.getElementById("citizen-shelter-card");
  if (!card) return;

  const shelters = await getShelters();

  // TODO (Shelter Intelligence): Sort by distance from user's geolocation.
  // For now, show first 2 available (not FULL) shelters from the list.
  const available = shelters
    ? shelters.filter(s => s.status !== "FULL").slice(0, 2)
    : _fallbackShelters();

  card.innerHTML = `
    <div class="card-title">🏥 Nearest Safe Shelters</div>
    ${available.map(s => buildShelterRow(s)).join("")}
    <a href="shelters.html" class="view-all-link">View all shelters →</a>
  `;
}

function buildShelterRow(shelter) {
  const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
  const statusColor = { OPEN: "var(--risk-low)", NEAR_CAPACITY: "var(--risk-moderate)", STANDBY: "var(--text-muted)" };
  return `
    <div class="shelter-row">
      <div class="shelter-row__name">${shelter.name}</div>
      <div class="shelter-row__meta">
        ${shelter.distance_km} km away &bull;
        <span style="color:${statusColor[shelter.status] || 'var(--risk-moderate)'};">${shelter.status}</span> &bull;
        ${shelter.occupancy}/${shelter.capacity} occupied (${pct}%)
      </div>
    </div>
  `;
}

function _fallbackShelters() {
  return [
    { name: "Shelter B — Central School", status: "OPEN",         occupancy: 45,  capacity: 400, distance_km: 0.8 },
    { name: "Shelter A — Community Hall", status: "NEAR_CAPACITY", occupancy: 410, capacity: 500, distance_km: 1.5 },
  ];
}

// ---------------------------------------------------------------------------
// Use My Location button
// ---------------------------------------------------------------------------
function setupLocationButton() {
  const btn = document.getElementById("btn-use-location");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    btn.textContent = "📍 Getting location…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.textContent = `📍 Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        // TODO (Personalization Engine): Send coords to GET /api/zones/risk?lat=X&lng=Y
        // and update the risk card with the user's actual zone.
      },
      () => {
        btn.textContent = "📍 Use My Location";
        alert("Unable to access location. Please enable location permissions.");
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadRiskStatus();
  loadNearestShelters();
  setupLocationButton();
});
