/**
 * ClimateOS — Citizen Mode: Shelters List Page Controller
 * File owner: Citizen Mode / Shelter Intelligence team
 */

import { getShelters } from "../api.js";

const STATUS_META = {
  OPEN:          { label: "Open",         color: "var(--risk-low)",      icon: "✅" },
  NEAR_CAPACITY: { label: "Near Capacity", color: "var(--risk-moderate)", icon: "⚠️" },
  FULL:          { label: "Full",          color: "var(--risk-severe)",   icon: "🔴" },
  STANDBY:       { label: "Standby",       color: "var(--text-muted)",    icon: "⏸️" },
};

let _allShelters = [];
let _activeFilter = "all";

const _FALLBACK_SHELTERS = [
  {
    id: "shelter-b",
    name: "Shelter B — Central High School (Elevated)",
    address: "Plot 42, Higher Ridge Rd, Pune",
    status: "OPEN",
    capacity: 400,
    occupancy: 120,
    distance_km: 0.8,
    elevation: "High Ground (620m MSL)",
    contact: "+91 20 2550 1108",
    accessibility: ["Wheelchair Ramp", "Elevator", "Elderly Care"],
    facilities: ["3 Meals/Day", "Medical Station", "Backup Generator", "Clean Water"],
  },
  {
    id: "shelter-a",
    name: "Shelter A — Model Colony Community Center",
    address: "18 Colony Rd, Shivajinagar, Pune",
    status: "NEAR_CAPACITY",
    capacity: 500,
    occupancy: 410,
    distance_km: 1.5,
    elevation: "Moderate Elevation (580m MSL)",
    contact: "+91 20 2550 1109",
    accessibility: ["Ramp Access"],
    facilities: ["Food Packets", "First Aid", "Sleeping Mats"],
  },
  {
    id: "shelter-c",
    name: "Shelter C — Sports Complex Indoor Arena",
    address: "Sector 9, Stadium Rd, Pune",
    status: "OPEN",
    capacity: 800,
    occupancy: 85,
    distance_km: 2.1,
    elevation: "Safe High Ground (640m MSL)",
    contact: "+91 20 2550 1110",
    accessibility: ["Fully Accessible", "Braille Signage", "Child Care Area"],
    facilities: ["Hot Meals", "Full Medical Unit", "Doctor on Site", "Solar Microgrid"],
  },
  {
    id: "shelter-d",
    name: "Shelter D — East Ward Municipal Hall",
    address: "Main Chowk, Hadapsar, Pune",
    status: "STANDBY",
    capacity: 350,
    occupancy: 0,
    distance_km: 3.4,
    elevation: "High Ground",
    contact: "+91 20 2550 1111",
    accessibility: ["Ground Floor Access"],
    facilities: ["Dry Rations", "Drinking Water"],
  },
];

async function loadShelters() {
  const listEl = document.getElementById("shelter-list");
  if (!listEl) return;

  listEl.innerHTML = `<div class="loading-state">Loading real-time shelters…</div>`;

  const apiShelters = await getShelters();
  _allShelters = (apiShelters && apiShelters.length > 0) ? apiShelters : _FALLBACK_SHELTERS;

  updateSummaryStats(_allShelters);
  renderShelters();
  setupFilters();
}

function updateSummaryStats(shelters) {
  const openCount = shelters.filter(s => s.status === "OPEN" || s.status === "NEAR_CAPACITY").length;
  const totalCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (s.occupancy || 0), 0);
  const bedsAvailable = Math.max(0, totalCapacity - totalOccupancy);

  const openEl = document.getElementById("shelters-open-count");
  if (openEl) openEl.textContent = openCount;

  const bedsEl = document.getElementById("shelters-beds-count");
  if (bedsEl) bedsEl.textContent = bedsAvailable.toLocaleString();
}

function setupFilters() {
  const container = document.getElementById("shelter-filters");
  if (!container) return;

  container.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      _activeFilter = chip.dataset.filter;
      renderShelters();
    });
  });
}

function renderShelters() {
  const listEl = document.getElementById("shelter-list");
  if (!listEl) return;

  let filtered = _allShelters;
  if (_activeFilter === "open") {
    filtered = _allShelters.filter(s => s.status === "OPEN");
  } else if (_activeFilter === "accessible") {
    filtered = _allShelters.filter(s => (s.accessibility || []).length > 0);
  } else if (_activeFilter === "medical") {
    filtered = _allShelters.filter(s =>
      (s.facilities || []).some(f => f.toLowerCase().includes("med") || f.toLowerCase().includes("doctor") || f.toLowerCase().includes("aid"))
    );
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="glass-card" style="text-align:center;padding:24px;color:var(--text-muted);">No shelters match the selected filter.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(s => buildShelterCard(s)).join("");
}

function buildShelterCard(s) {
  const meta = STATUS_META[s.status] || STATUS_META.STANDBY;
  const pct = Math.round((s.occupancy / s.capacity) * 100);
  const barColor = meta.color;
  const availableBeds = Math.max(0, s.capacity - s.occupancy);

  return `
    <div class="shelter-card glass-card" id="shelter-${s.id}">
      <div class="shelter-card__header">
        <div>
          <h3 class="shelter-card__name">${s.name}</h3>
          <p class="shelter-card__address">📍 ${s.address || 'Pune Ward'}</p>
        </div>
        <span class="badge badge--status" style="color:${barColor};border-color:${barColor};background:${barColor}18;">
          ${meta.icon} ${meta.label}
        </span>
      </div>

      <div class="shelter-stat-strip">
        <div class="shelter-stat-item">
          <span class="shelter-stat-val">${s.distance_km || 1.2} km</span>
          <span class="shelter-stat-lbl">Distance</span>
        </div>
        <div class="shelter-stat-item">
          <span class="shelter-stat-val text-green">${availableBeds}</span>
          <span class="shelter-stat-lbl">Beds Left</span>
        </div>
        <div class="shelter-stat-item">
          <span class="shelter-stat-val">${pct}%</span>
          <span class="shelter-stat-lbl">Occupancy</span>
        </div>
      </div>

      <div class="progress-bar" style="margin: 8px 0;">
        <div class="progress-bar__fill" style="width:${pct}%;background:${barColor};"></div>
      </div>

      <div class="shelter-card__tags">
        ${(s.accessibility || []).map(a => `<span class="tag">♿ ${a}</span>`).join("")}
        ${(s.facilities || []).map(f => `<span class="tag tag--facility">✓ ${f}</span>`).join("")}
      </div>

      <div class="shelter-card__footer">
        <a href="tel:${s.contact}" class="btn btn--cyan btn-sm" style="text-decoration:none;">
          📞 Call Facility
        </a>
        <a href="citizen-route.html?shelter=${s.id}" class="btn btn--primary btn-sm" style="text-decoration:none;">
          🧭 Navigate Safe Route →
        </a>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadShelters);

