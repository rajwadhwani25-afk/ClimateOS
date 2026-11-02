/**
 * ClimateOS — Citizen Mode: Safe Route Navigator
 * Real-time dynamic safe evacuation routing avoiding flood hazard zones.
 */

const ROUTE_DATA = {
  vehicle: {
    name: "Route C — Elevated Highway Bypass",
    distance: "2.4 km",
    duration: "11 mins",
    safetyScore: 98,
    hazardsAvoided: 2,
    mode: "🚗 Vehicle",
    steps: [
      {
        icon: "📍",
        instruction: "Depart Riverside Ave heading East away from riverbank",
        subtext: "Safe ground • Low water runoff (0.1m)",
        distance: "350 m",
        type: "safe",
      },
      {
        icon: "⚠️",
        instruction: "DO NOT cross Z-Bridge (Submerged 1.4m)",
        subtext: "AI Reroute: Veer right onto Elevated Bypass Flyover",
        distance: "200 m",
        type: "warning",
      },
      {
        icon: "🛡️",
        instruction: "Continue along High Ridge Expressway (Elevated 12m)",
        subtext: "Cleared of debris • Dedicated emergency vehicle corridor",
        distance: "1.4 km",
        type: "safe",
      },
      {
        icon: "🏥",
        instruction: "Arrive at Shelter B — Central High School Relief Center",
        subtext: "Entrance via Gate 2 (High Ground Parking Available)",
        distance: "450 m",
        type: "dest",
      },
    ],
  },
  foot: {
    name: "Route F — Hillside Pedestrian Walkway",
    distance: "1.9 km",
    duration: "26 mins",
    safetyScore: 95,
    hazardsAvoided: 3,
    mode: "🚶 On Foot",
    steps: [
      {
        icon: "📍",
        instruction: "Head uphill towards Model Colony stairs",
        subtext: "Stay on raised concrete sidewalk",
        distance: "200 m",
        type: "safe",
      },
      {
        icon: "⚠️",
        instruction: "Avoid lower underpass due to flash surge",
        subtext: "Use pedestrian footbridge over railway tracks",
        distance: "300 m",
        type: "warning",
      },
      {
        icon: "🛡️",
        instruction: "Follow Ridge Trail path along upper embankment",
        subtext: "Well-lit path with emergency volunteer stations",
        distance: "1.1 km",
        type: "safe",
      },
      {
        icon: "🏥",
        instruction: "Arrive at Shelter B — Central High School (Pedestrian Gate)",
        subtext: "Check-in at Gymnasium triage counter",
        distance: "300 m",
        type: "dest",
      },
    ],
  },
};

let _currentMode = "vehicle";
let _map = null;
let _routeLayer = null;
let _hazardLayer = null;
let _markersLayer = null;
let _navInterval = null;
let _activeStepIdx = 0;

function renderLayout() {
  const container = document.getElementById("safe-route-content");
  if (!container) return;

  const data = ROUTE_DATA[_currentMode];

  container.innerHTML = `
    <!-- Route Header Card -->
    <div class="glass-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <span class="badge badge--high">🛡️ Safest AI Route</span>
          <h1 style="font-family:var(--font-display);font-size:20px;font-weight:700;margin-top:4px;">
            ${data.name}
          </h1>
          <div style="font-size:12px;color:var(--text-secondary);">
            Origin: <strong>Riverside Ave (Zone A)</strong> → Destination: <strong>Shelter B</strong>
          </div>
        </div>

        <div class="route-mode-toggle" id="route-mode-toggle" role="radiogroup" aria-label="Travel Mode">
          <button type="button" class="mode-chip ${_currentMode === 'vehicle' ? 'active' : ''}" data-mode="vehicle">🚗 Drive</button>
          <button type="button" class="mode-chip ${_currentMode === 'foot' ? 'active' : ''}" data-mode="foot">🚶 Walk</button>
        </div>
      </div>

      <!-- Route Metrics Bar -->
      <div class="route-metrics-bar">
        <div class="route-metric">
          <span class="metric-val text-green">${data.safetyScore}%</span>
          <span class="metric-lbl">Safety Index</span>
        </div>
        <div class="route-metric">
          <span class="metric-val text-cyan">${data.duration}</span>
          <span class="metric-lbl">Est. Travel</span>
        </div>
        <div class="route-metric">
          <span class="metric-val">${data.distance}</span>
          <span class="metric-lbl">Distance</span>
        </div>
        <div class="route-metric">
          <span class="metric-val text-orange">${data.hazardsAvoided}</span>
          <span class="metric-lbl">Hazards Avoided</span>
        </div>
      </div>
    </div>

    <!-- Interactive Leaflet Map Container -->
    <div class="glass-card" style="padding:0;overflow:hidden;position:relative;">
      <div id="route-map" style="height:320px;width:100%;background:#090d16;" role="application" aria-label="Safe Route Evacuation Map"></div>
      
      <!-- Floating Map Legend Pill -->
      <div class="route-map-hud">
        <span class="hud-pill hud-pill--safe"><span class="hud-dot" style="background:var(--accent-cyan);"></span> Safe Route</span>
        <span class="hud-pill hud-pill--danger"><span class="hud-dot" style="background:var(--risk-severe);"></span> Flooded Hazard</span>
      </div>
    </div>

    <!-- Navigation Control Banner -->
    <div class="glass-card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-primary);" id="nav-status-text">
          Ready to Start Navigation
        </div>
        <div style="font-size:11px;color:var(--text-muted);" id="nav-sub-text">
          GPS positioning tracking live road conditions
        </div>
      </div>
      <button id="btn-start-nav" class="btn btn--primary" style="flex-shrink:0;">
        🧭 Start Guidance
      </button>
    </div>

    <!-- Turn-by-Turn Steps -->
    <div class="glass-card">
      <div class="card-title">🗺️ Step-by-Step AI Guidance</div>
      <div class="route-steps-list" id="route-steps-list">
        ${data.steps.map((st, i) => buildStepRow(st, i)).join("")}
      </div>
    </div>
  `;

  setupModeToggle();
  setupNavSimulation();
  initRouteMap();
}

function buildStepRow(st, idx) {
  const isWarn = st.type === "warning";
  const border = isWarn ? "border-left: 3px solid var(--risk-severe);" : "border-left: 3px solid var(--accent-cyan);";
  const bg = isWarn ? "background: rgba(239, 68, 68, 0.08);" : "background: rgba(0, 0, 0, 0.25);";

  return `
    <div class="route-step-card ${idx === 0 ? 'step-active' : ''}" id="step-${idx}" style="${border}${bg}">
      <div class="step-card__icon">${st.icon}</div>
      <div class="step-card__content">
        <div class="step-card__instr ${isWarn ? 'text-red' : ''}">${st.instruction}</div>
        <div class="step-card__sub">${st.subtext}</div>
      </div>
      <div class="step-card__dist">${st.distance}</div>
    </div>
  `;
}

function setupModeToggle() {
  const container = document.getElementById("route-mode-toggle");
  if (!container) return;

  container.querySelectorAll(".mode-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      _currentMode = chip.dataset.mode;
      renderLayout();
    });
  });
}

function setupNavSimulation() {
  const btn = document.getElementById("btn-start-nav");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (_navInterval) {
      clearInterval(_navInterval);
      _navInterval = null;
      btn.textContent = "🧭 Start Guidance";
      document.getElementById("nav-status-text").textContent = "Navigation Paused";
      return;
    }

    btn.textContent = "⏸️ Pause";
    const statusText = document.getElementById("nav-status-text");
    const subText = document.getElementById("nav-sub-text");

    const steps = ROUTE_DATA[_currentMode].steps;
    _activeStepIdx = 0;

    _navInterval = setInterval(() => {
      _activeStepIdx = (_activeStepIdx + 1) % steps.length;
      highlightStep(_activeStepIdx);

      const st = steps[_activeStepIdx];
      if (statusText) statusText.textContent = `Proceeding: ${st.instruction}`;
      if (subText) subText.textContent = `Distance remaining: ${st.distance} • Safe elevation`;

      if (_activeStepIdx === steps.length - 1) {
        clearInterval(_navInterval);
        _navInterval = null;
        btn.textContent = "✓ Arrived";
        if (statusText) statusText.textContent = "🎉 You have reached Safe Shelter B!";
      }
    }, 2800);
  });
}

function highlightStep(idx) {
  document.querySelectorAll(".route-step-card").forEach((c, i) => {
    c.classList.toggle("step-active", i === idx);
  });
}

function initRouteMap() {
  if (typeof L === "undefined") return;

  if (_map) {
    _map.remove();
    _map = null;
  }

  const mapEl = document.getElementById("route-map");
  if (!mapEl) return;

  // Center on Pune Riverside area
  _map = L.map("route-map", {
    center: [18.528, 73.858],
    zoom: 14,
    zoomControl: false,
    attributionControl: false,
  });

  L.control.zoom({ position: "bottomright" }).addTo(_map);

  // Dark basemap
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd",
  }).addTo(_map);

  // Coordinates
  const origin = [18.524, 73.848];
  const destination = [18.537, 73.868];
  const floodedHazard = [18.525, 73.858];

  // Safe route coordinates
  const safePolylineCoords = _currentMode === "vehicle" ? [
    [18.524, 73.848],
    [18.528, 73.853],
    [18.533, 73.857],
    [18.536, 73.863],
    [18.537, 73.868],
  ] : [
    [18.524, 73.848],
    [18.527, 73.850],
    [18.531, 73.855],
    [18.535, 73.862],
    [18.537, 73.868],
  ];

  // Hazardous blocked route coordinates
  const hazardCoords = [
    [18.524, 73.848],
    [18.523, 73.854],
    [18.525, 73.858],
    [18.530, 73.864],
  ];

  // Draw Hazard (Dashed Red)
  _hazardLayer = L.polyline(hazardCoords, {
    color: "#ef4444",
    weight: 4,
    dashArray: "6, 8",
    opacity: 0.75,
  }).addTo(_map);

  // Draw Safe Route (Glow Cyan / Green)
  _routeLayer = L.polyline(safePolylineCoords, {
    color: "#06b6d4",
    weight: 6,
    opacity: 0.95,
  }).addTo(_map);

  // Add flood hazard circle
  L.circle(floodedHazard, {
    radius: 200,
    color: "#ef4444",
    fillColor: "#ef4444",
    fillOpacity: 0.35,
    weight: 2,
  }).bindPopup("<b>⚠️ FLOODED: Z-Bridge</b><br>1.4m submerged depth. Impassable.").addTo(_map);

  // Markers
  const startIcon = L.divIcon({
    className: "custom-map-pin pin--start",
    html: `<div class="pin-badge pin--origin">📍 YOU</div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 24],
  });

  const destIcon = L.divIcon({
    className: "custom-map-pin pin--dest",
    html: `<div class="pin-badge pin--shelter">🏥 SHELTER B</div>`,
    iconSize: [80, 24],
    iconAnchor: [40, 24],
  });

  const hazardIcon = L.divIcon({
    className: "custom-map-pin pin--warn",
    html: `<div class="pin-badge pin--hazard">⚠️ BLOCKED</div>`,
    iconSize: [65, 24],
    iconAnchor: [32, 24],
  });

  L.marker(origin, { icon: startIcon }).addTo(_map).bindPopup("<b>Your Location</b><br>Riverside Avenue");
  L.marker(destination, { icon: destIcon }).addTo(_map).bindPopup("<b>Shelter B</b><br>Central High School Relief Hub");
  L.marker(floodedHazard, { icon: hazardIcon }).addTo(_map);

  _map.fitBounds(_routeLayer.getBounds(), { padding: [40, 40] });
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
});
