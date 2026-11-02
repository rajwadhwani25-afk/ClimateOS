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
  const levelTitle = (zone.risk_level || "HIGH").toUpperCase();

  return `
    <div class="risk-card glass-card" style="border-left: 4px solid ${color};">
      <div class="risk-card__header">
        <div>
          <span class="risk-badge risk-badge--${zone.risk_level}">${zone.status || levelTitle + ' RISK'}</span>
          <h2 class="risk-card__zone-title">${zone.name}</h2>
        </div>
        <div class="risk-card__badge-live">
          <span class="status-beacon status-beacon--red"></span> Live Analysis
        </div>
      </div>

      <div class="risk-card__main">
        <div class="risk-card__score-dial">
          <span class="risk-card__score" style="color:${color}">${pct}</span>
          <span class="risk-card__score-sub">/ 100</span>
          <div class="risk-card__score-desc">Inundation Index</div>
        </div>

        <div class="risk-card__vitals">
          <div class="vital-item">
            <span class="vital-icon">🌧️</span>
            <div>
              <div class="vital-val">${zone.rainfall_mm_h || 110} mm/h</div>
              <div class="vital-lbl">Downpour Rate</div>
            </div>
          </div>
          <div class="vital-item">
            <span class="vital-icon">🌊</span>
            <div>
              <div class="vital-val">${zone.water_level_m || 4.2} m</div>
              <div class="vital-lbl">River Level</div>
            </div>
          </div>
          <div class="vital-item">
            <span class="vital-icon">👥</span>
            <div>
              <div class="vital-val">${(zone.population_at_risk || 14200).toLocaleString()}</div>
              <div class="vital-lbl">Pop. In Hazard Zone</div>
            </div>
          </div>
        </div>
      </div>

      <div class="risk-card__bar-wrap">
        <div class="risk-card__bar-track">
          <div class="risk-card__bar-fill" style="width:${pct}%;background:${color};box-shadow:0 0 10px ${color};"></div>
        </div>
      </div>

      <div class="risk-card__advice-box">
        <span class="advice-icon">💡</span>
        <p class="risk-card__advice">
          <strong>Recommended Action:</strong> ${zone.advice || "Flash flood warning active. Avoid low bridges and move to designated high ground immediately."}
        </p>
      </div>

      <div class="risk-card__cta-row">
        <a href="citizen-route.html" class="btn btn--primary btn-sm" style="flex:1;">
          🛡️ View Evacuation Route →
        </a>
        <a href="citizen-map.html" class="btn btn--cyan btn-sm">
          🗺️ Live GIS
        </a>
      </div>
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

  const available = shelters
    ? shelters.filter(s => s.status !== "FULL").slice(0, 3)
    : _fallbackShelters();

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);">
      <div class="card-title" style="margin-bottom:0;">🏥 Nearest Safe Shelters</div>
      <a href="citizen-shelters.html" class="view-all-link">View All (${shelters ? shelters.length : 4}) →</a>
    </div>
    <div class="shelter-list-compact">
      ${available.map(s => buildShelterRow(s)).join("")}
    </div>
  `;
}

function buildShelterRow(shelter) {
  const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
  const statusColor = { OPEN: "var(--risk-low)", NEAR_CAPACITY: "var(--risk-moderate)", STANDBY: "var(--text-muted)" };
  const color = statusColor[shelter.status] || "var(--risk-low)";

  return `
    <div class="shelter-row-rich">
      <div class="shelter-row-rich__top">
        <div>
          <span class="shelter-row-rich__name">${shelter.name}</span>
          <span class="shelter-dist-pill">${shelter.distance_km || 0.8} km away</span>
        </div>
        <span class="badge" style="color:${color};background:${color}22;border-color:${color};">
          ${shelter.status === 'OPEN' ? '● OPEN' : shelter.status}
        </span>
      </div>

      <div class="shelter-row-rich__bar-row">
        <div class="shelter-capacity-bar">
          <div class="shelter-capacity-bar__fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <span class="shelter-capacity-text">${shelter.occupancy}/${shelter.capacity} beds (${pct}%)</span>
      </div>

      <div class="shelter-row-rich__actions">
        <a href="tel:${shelter.contact || '108'}" class="btn-link">📞 ${shelter.contact || '+91 20 2550 1108'}</a>
        <a href="citizen-route.html" class="btn btn--cyan btn-xs">🧭 Navigate</a>
      </div>
    </div>
  `;
}

function _fallbackShelters() {
  return [
    { name: "Shelter B — Central School (High Ground)", status: "OPEN",          occupancy: 120, capacity: 400, distance_km: 0.8, contact: "+91 20 2550 1108" },
    { name: "Shelter A — Community Center",             status: "NEAR_CAPACITY",  occupancy: 410, capacity: 500, distance_km: 1.5, contact: "+91 20 2550 1109" },
    { name: "Shelter C — Sports Complex Stadium",       status: "OPEN",          occupancy: 85,  capacity: 800, distance_km: 2.1, contact: "+91 20 2550 1110" },
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
