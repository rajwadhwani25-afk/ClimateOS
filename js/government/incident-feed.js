/**
 * ClimateOS — Government Mode: Incident Feed Panel
 * File owner: Government Dashboard / Incident team
 *
 * Renders ranked incidents with confidence badges.
 * Subscribes to GET /api/incidents/stream (SSE) for real-time push updates.
 *
 * Live features:
 *  - SSE connection with auto-reconnect on disconnect
 *  - Animated "NEW" flash card prepended on arrival
 *  - Live counter badge in panel header
 *  - Incident map marker auto-pinned when lat/lng available
 */

import { getIncidents } from "../api.js";
import { addIncidentMarker } from "../map.js";
import { API_BASE } from "../api.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONFIDENCE_BADGE = {
  "High Confidence": { cls: "badge--high",   label: "High Confidence" },
  "Needs Review":    { cls: "badge--review", label: "Needs Review"    },
  "Low Confidence":  { cls: "badge--low",    label: "Low Confidence"  },
};

const CATEGORY_ICONS = {
  trapped:         "🆘",
  flood:           "🌊",
  fire:            "🔥",
  road:            "🚧",
  medical:         "🚑",
  power_failure:   "⚡",
  water_shortage:  "🚰",
  infrastructure:  "🏢",
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _liveCount    = 0; // count of incidents received via SSE this session
let _evtSource    = null;
let _reconnectMs  = 2000; // backoff base for reconnect
const MAX_RECONNECT_MS = 30000;

// ---------------------------------------------------------------------------
// Build a single incident card HTML string
// ---------------------------------------------------------------------------
function buildIncidentItem(inc, rank, isNew = false) {
  const badge         = CONFIDENCE_BADGE[inc.confidence_label] || CONFIDENCE_BADGE["Needs Review"];
  const icon          = CATEGORY_ICONS[inc.category] || "⚠️";
  const priorityColor = inc.priority_score >= 85 ? "var(--risk-severe)"
                      : inc.priority_score >= 60 ? "var(--risk-high)"
                      : "var(--risk-moderate)";
  const ts            = inc.timestamp
    ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return `
    <div class="incident-item ${isNew ? "incident-item--new" : ""}"
         id="incident-${inc.id}" data-id="${inc.id}">
      <div class="incident-item__header">
        <span class="incident-item__rank">#${rank}</span>
        <span class="incident-item__type">${icon} ${inc.category.replace("_", " ")}</span>
        ${isNew ? `<span class="incident-live-badge">🔴 LIVE</span>` : ""}
        <span class="badge ${badge.cls}">${badge.label}</span>
      </div>
      <div class="incident-item__location">📍 ${inc.location}</div>
      <div class="incident-item__desc">${inc.description}</div>
      <div class="incident-item__footer">
        <span style="color:${priorityColor};font-weight:700;">Priority: ${inc.priority_score}/100</span>
        ${inc.trapped_count > 0 ? `<span class="tag tag--danger">🆘 ${inc.trapped_count} trapped</span>` : ""}
        ${inc.injured_count > 0 ? `<span class="tag tag--warning">🤕 ${inc.injured_count} injured</span>` : ""}
        <span style="color:var(--text-muted);font-size:11px;">AI: ${inc.confidence_score}%</span>
        ${ts ? `<span style="color:var(--text-muted);font-size:10px;">${ts}</span>` : ""}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Update the live-counter badge in the tab header
// ---------------------------------------------------------------------------
function _updateLiveBadge(count) {
  let badge = document.getElementById("incident-live-count");
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

// ---------------------------------------------------------------------------
// Update the SSE status dot in the panel header
// ---------------------------------------------------------------------------
function _setStreamStatus(status) {
  const dot = document.getElementById("sse-status-dot");
  if (!dot) return;
  dot.dataset.status = status; // 'connecting' | 'live' | 'offline'
  dot.title = { connecting: "Connecting to live feed…", live: "Live feed connected", offline: "Live feed offline" }[status] || "";
}

// ---------------------------------------------------------------------------
// Prepend a new incident card with flash animation
// ---------------------------------------------------------------------------
function prependIncident(inc) {
  const container = document.getElementById("incident-feed");
  if (!container) return;

  // Remove loading/empty states if still present
  const loading = container.querySelector(".loading-state, .empty-state");
  if (loading) loading.remove();

  // Re-number all existing items (+1)
  container.querySelectorAll(".incident-item__rank").forEach((el, i) => {
    el.textContent = `#${i + 2}`;
  });

  // Build and inject the new card at the top
  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildIncidentItem(inc, 1, true);
  const card = wrapper.firstElementChild;
  container.insertBefore(card, container.firstChild);

  // Drop the "NEW" marker after 8 seconds
  setTimeout(() => {
    const liveTag = card.querySelector(".incident-live-badge");
    if (liveTag) liveTag.remove();
    card.classList.remove("incident-item--new");
  }, 8000);

  // Pin a map marker if coordinates are available
  if (inc.lat && inc.lng) {
    addIncidentMarker(inc);
  }

  // Bump live counter
  _liveCount++;
  _updateLiveBadge(_liveCount);
}

// ---------------------------------------------------------------------------
// SSE subscription with auto-reconnect
// ---------------------------------------------------------------------------
function subscribeToIncidentStream() {
  if (_evtSource) {
    _evtSource.close();
    _evtSource = null;
  }

  const streamUrl = `${API_BASE}/api/incidents/stream`;
  _setStreamStatus("connecting");

  const es = new EventSource(streamUrl);
  _evtSource = es;

  es.addEventListener("connected", () => {
    console.log("[SSE] Incident stream connected.");
    _setStreamStatus("live");
    _reconnectMs = 2000; // reset backoff on success
  });

  es.addEventListener("new_incident", (e) => {
    try {
      const incident = JSON.parse(e.data);
      prependIncident(incident);
    } catch (err) {
      console.warn("[SSE] Failed to parse incident:", err);
    }
  });

  es.onerror = () => {
    console.warn(`[SSE] Stream error — reconnecting in ${_reconnectMs}ms…`);
    _setStreamStatus("offline");
    es.close();
    _evtSource = null;
    // Exponential backoff reconnect
    setTimeout(() => {
      _reconnectMs = Math.min(_reconnectMs * 1.5, MAX_RECONNECT_MS);
      subscribeToIncidentStream();
    }, _reconnectMs);
  };
}

let _allLoadedIncidents = [];
let _activeCategoryFilter = "all";
let _activeSearchTerm = "";

// ---------------------------------------------------------------------------
// Prepend an incident received via SSE
// ---------------------------------------------------------------------------
export function prependIncident(inc) {
  const container = document.getElementById("incident-feed");
  if (!container) return;

  _allLoadedIncidents.unshift(inc);

  // Increment session counter
  _liveCount++;
  _updateLiveBadge(_liveCount);

  // Auto-pin to map if lat/lng available
  if (inc.lat && inc.lng) {
    addIncidentMarker(inc);
  }

  // Check if matches active filter
  if (_matchesFilter(inc)) {
    const emptyState = container.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    const rank = container.querySelectorAll(".incident-item").length + 1;
    const cardHtml = buildIncidentItem(inc, rank, true);
    container.insertAdjacentHTML("afterbegin", cardHtml);
  }
}

function _matchesFilter(inc) {
  const matchesCat = _activeCategoryFilter === "all" || inc.category === _activeCategoryFilter;
  const q = _activeSearchTerm.toLowerCase();
  const matchesSearch = !q ||
    (inc.location && inc.location.toLowerCase().includes(q)) ||
    (inc.description && inc.description.toLowerCase().includes(q)) ||
    (inc.category && inc.category.toLowerCase().includes(q));

  return matchesCat && matchesSearch;
}

function renderFilteredIncidents() {
  const container = document.getElementById("incident-feed");
  if (!container) return;

  const filtered = _allLoadedIncidents.filter(_matchesFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:20px;text-align:center;color:var(--text-muted);">No incidents match the search criteria.</div>`;
    return;
  }

  container.innerHTML = filtered.map((inc, idx) => buildIncidentItem(inc, idx + 1)).join("");
}

function setupIncidentControls() {
  const input = document.getElementById("incident-search-input");
  const chips = document.getElementById("incident-filter-chips");

  if (input) {
    input.addEventListener("input", (e) => {
      _activeSearchTerm = e.target.value.trim();
      renderFilteredIncidents();
    });
  }

  if (chips) {
    chips.querySelectorAll(".inc-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        chips.querySelectorAll(".inc-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        _activeCategoryFilter = chip.dataset.filter;
        renderFilteredIncidents();
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Initial load: fetch all existing incidents
// ---------------------------------------------------------------------------
export async function loadIncidentFeed() {
  const container = document.getElementById("incident-feed");
  if (!container) return;

  container.innerHTML = `<div class="loading-state">Loading incidents…</div>`;

  const incidents = await getIncidents();
  _allLoadedIncidents = incidents || [];

  if (_allLoadedIncidents.length === 0) {
    container.innerHTML = `<div class="empty-state">No active incidents.</div>`;
    return;
  }

  renderFilteredIncidents();
  setupIncidentControls();
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadIncidentFeed();
  subscribeToIncidentStream();
});

