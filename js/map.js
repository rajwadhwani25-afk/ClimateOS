/**
 * ClimateOS — Shared Leaflet Map Helpers
 * Used by both citizen.html and government.html
 *
 * Usage:
 *   import { initMap, renderRiskZonesGeoJSON, addIncidentMarker,
 *            addShelterMarker, updateZoneStyle, updateMapStatsBar,
 *            enterSimulationMode, exitSimulationMode } from '../map.js';
 */

// City center: fictional "Riverdale" (mapped to Pune coordinates for demo)
const CITY_CENTER = [18.5204, 73.8567];
const DEFAULT_ZOOM = 13;

let _map = null;
let _zoneLayerGroup    = null;
let _incidentLayerGroup = null;
let _shelterLayerGroup  = null;
let _simBanner         = null; // Leaflet control for simulation mode overlay

// ---------------------------------------------------------------------------
// Risk level → style
// ---------------------------------------------------------------------------
const RISK_STYLES = {
  severe:   { color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.45, weight: 2.5 },
  high:     { color: "#f97316", fillColor: "#f97316", fillOpacity: 0.35, weight: 2   },
  moderate: { color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.25, weight: 1.5 },
  low:      { color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.15, weight: 1   },
};

function _riskStyle(riskLevel) {
  return RISK_STYLES[riskLevel] || RISK_STYLES.low;
}

export const RISK_COLORS = {
  severe:   "#ef4444",
  high:     "#f97316",
  moderate: "#f59e0b",
  low:      "#22c55e",
};

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initMap(containerId, options = {}) {
  if (!document.getElementById(containerId)) {
    console.warn(`[map.js] Container #${containerId} not found.`);
    return null;
  }

  _map = L.map(containerId, {
    center: options.center || CITY_CENTER,
    zoom:   options.zoom   || DEFAULT_ZOOM,
    zoomControl: false,
    ...options.leafletOptions,
  });

  // Dark CartoDB tile layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; <a href='https://carto.com/'>CARTO</a> &copy; OpenStreetMap",
    maxZoom: 19,
    subdomains: "abcd",
  }).addTo(_map);

  L.control.zoom({ position: "bottomright" }).addTo(_map);

  _zoneLayerGroup     = L.layerGroup().addTo(_map);
  _incidentLayerGroup = L.layerGroup().addTo(_map);
  _shelterLayerGroup  = L.layerGroup().addTo(_map);

  return _map;
}

export function getMap() {
  return _map;
}

// ---------------------------------------------------------------------------
// Risk Zone rendering from GeoJSON
// ---------------------------------------------------------------------------

/**
 * Render a zones array onto the map.
 * @param {Array} zones - array of zone objects with .geometry and .risk_level
 */
export function renderRiskZonesGeoJSON(zones) {
  if (!_map) return;
  _zoneLayerGroup.clearLayers();

  zones.forEach(zone => {
    if (!zone.geometry) return;
    const style = _riskStyle(zone.risk_level);
    L.geoJSON(
      { type: "Feature", geometry: zone.geometry, properties: { ...zone, _zoneId: zone.id } },
      {
        style: () => style,
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          // Store zoneId on the layer for fast lookup
          layer._climateZoneId = p.id || p._zoneId;
          layer.bindTooltip(
            `<b>${p.name}</b><br>Risk: ${p.risk_score}/100 (${p.status})`,
            { permanent: p.risk_level === "severe", direction: "center", className: "map-zone-label" }
          );
        },
      }
    ).addTo(_zoneLayerGroup);
  });
}

/**
 * Dynamically update the fill style for a single zone by ID.
 * Triggers a CSS pulse animation to make the change feel alive.
 *
 * @param {string} zoneId      - e.g. "zone-a"
 * @param {string} riskLevel   - 'low' | 'moderate' | 'high' | 'severe'
 * @param {number} [riskScore] - optional score for tooltip update
 */
export function updateZoneStyle(zoneId, riskLevel, riskScore = null) {
  if (!_zoneLayerGroup) return;

  const newStyle = _riskStyle(riskLevel);

  _zoneLayerGroup.eachLayer(outerLayer => {
    // Handle both direct GeoJSON layers and nested LayerGroups from L.geoJSON()
    const inner = outerLayer._layers
      ? Object.values(outerLayer._layers)
      : [outerLayer];

    inner.forEach(layer => {
      const id = layer._climateZoneId
        || layer.feature?.properties?.id
        || layer.feature?.properties?._zoneId;

      if (id !== zoneId) return;

      // 1. Apply new Leaflet style
      layer.setStyle(newStyle);

      // 2. Pulse animation — flash the polygon border
      _pulseZoneLayer(layer, newStyle);

      // 3. Update tooltip if score provided
      if (riskScore !== null) {
        const p = layer.feature?.properties || {};
        const tooltipContent = `<b>${p.name || zoneId}</b><br>⚡ Simulated: ${riskScore}/100 (${riskLevel.toUpperCase()})`;
        if (layer.getTooltip()) {
          layer.getTooltip().setContent(tooltipContent);
        } else {
          layer.bindTooltip(tooltipContent, {
            permanent: riskLevel === "severe",
            direction: "center",
            className: "map-zone-label",
          });
        }
      }
    });
  });
}

/**
 * Flash a quick pulse on a Leaflet layer to signal a live update.
 * We do 3 rapid style toggles using CSS transition timing.
 */
function _pulseZoneLayer(layer, finalStyle) {
  const pulseStyle = {
    ...finalStyle,
    fillOpacity: Math.min(0.85, finalStyle.fillOpacity + 0.4),
    weight: finalStyle.weight + 2,
    opacity: 1,
  };

  let count = 0;
  const interval = setInterval(() => {
    layer.setStyle(count % 2 === 0 ? pulseStyle : finalStyle);
    count++;
    if (count >= 6) {
      clearInterval(interval);
      layer.setStyle(finalStyle); // ensure we end on final
    }
  }, 120);
}

// ---------------------------------------------------------------------------
// Simulation Mode Banner
// ---------------------------------------------------------------------------

/**
 * Show a "SIMULATION MODE" banner on the map to signal it's in sim state.
 * @param {string} zoneLabel - e.g. "Zone A — Riverside"
 * @param {string} riskLevel - 'low' | 'moderate' | 'high' | 'severe'
 */
export function enterSimulationMode(zoneLabel, riskLevel) {
  if (!_map) return;
  exitSimulationMode(); // clear any existing

  const color = RISK_COLORS[riskLevel] || "#f59e0b";

  const SimBanner = L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create("div", "sim-map-banner");
      div.innerHTML = `
        <span class="sim-map-banner__dot" style="background:${color};box-shadow:0 0 8px ${color};"></span>
        <span class="sim-map-banner__text">
          SIMULATION MODE &mdash; <strong>${zoneLabel}</strong>
        </span>
        <span class="sim-map-banner__risk" style="color:${color};">${riskLevel.toUpperCase()}</span>
      `;
      return div;
    },
    onRemove() {},
  });

  _simBanner = new SimBanner({ position: "topright" });
  _simBanner.addTo(_map);
}

/**
 * Remove simulation mode banner and restore normal appearance.
 */
export function exitSimulationMode() {
  if (_simBanner && _map) {
    _map.removeControl(_simBanner);
    _simBanner = null;
  }
}

// ---------------------------------------------------------------------------
// Stats Bar sync
// ---------------------------------------------------------------------------

/**
 * Update the floating map stats pills (rainfall, water level, pop at risk).
 * @param {number} rainfallMmHr
 * @param {number} waterLevelM
 * @param {number} [popAtRisk]
 */
export function updateMapStatsBar(rainfallMmHr, waterLevelM, popAtRisk = null) {
  const rainfallEl = document.querySelector(".stat-pill__val[data-stat='rainfall']");
  const waterEl    = document.querySelector(".stat-pill__val[data-stat='water']");
  const popEl      = document.querySelector(".stat-pill__val[data-stat='pop']");

  if (rainfallEl) _animateNumber(rainfallEl, `${rainfallMmHr} mm/h`);
  if (waterEl)    _animateNumber(waterEl,    `${waterLevelM} m`);
  if (popAtRisk !== null && popEl) _animateNumber(popEl, popAtRisk.toLocaleString());
}

function _animateNumber(el, newVal) {
  el.style.transition = "opacity 0.2s";
  el.style.opacity = "0";
  setTimeout(() => {
    el.textContent = newVal;
    el.style.opacity = "1";
  }, 200);
}

// ---------------------------------------------------------------------------
// Incident Markers
// ---------------------------------------------------------------------------
const _CATEGORY_ICONS = {
  trapped:          { emoji: "🆘", color: "#ef4444" },
  flood:            { emoji: "🌊", color: "#3b82f6" },
  fire:             { emoji: "🔥", color: "#f97316" },
  road:             { emoji: "🚧", color: "#f59e0b" },
  medical:          { emoji: "🚑", color: "#ec4899" },
  power_failure:    { emoji: "⚡", color: "#a855f7" },
  water_shortage:   { emoji: "🚰", color: "#06b6d4" },
  infrastructure:   { emoji: "🏢", color: "#64748b" },
};

export function addIncidentMarker(incident) {
  if (!_map || !incident.lat || !incident.lng) return;
  const cfg = _CATEGORY_ICONS[incident.category] || { emoji: "⚠️", color: "#f59e0b" };

  const icon = L.divIcon({
    className: "climate-incident-icon",
    html: `<div style="background:${cfg.color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 12px ${cfg.color};animation:pulse 2s infinite;" title="${incident.location}">${cfg.emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  const marker = L.marker([incident.lat, incident.lng], { icon })
    .bindPopup(
      `<b>${incident.location}</b><br>` +
      `Category: ${incident.category}<br>` +
      `Confidence: ${incident.confidence_score}% (${incident.confidence_label})<br>` +
      `Priority: ${incident.priority_score}/100`
    );

  _incidentLayerGroup.addLayer(marker);
  return marker;
}

export function clearIncidentMarkers() {
  _incidentLayerGroup?.clearLayers();
}

// ---------------------------------------------------------------------------
// Shelter Markers
// ---------------------------------------------------------------------------
function _shelterColor(status) {
  return { OPEN: "#10b981", NEAR_CAPACITY: "#f59e0b", FULL: "#ef4444", STANDBY: "#64748b" }[status] || "#06b6d4";
}

export function addShelterMarker(shelter) {
  if (!_map) return;
  const color = _shelterColor(shelter.status);

  const icon = L.divIcon({
    className: "climate-shelter-icon",
    html: `<div style="background:${color};color:#000;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px ${color};">🏥</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
  const marker = L.marker([shelter.lat, shelter.lng], { icon })
    .bindPopup(
      `<b>${shelter.name}</b><br>` +
      `Status: ${shelter.status}<br>` +
      `Capacity: ${shelter.occupancy} / ${shelter.capacity} (${pct}%)<br>` +
      `Address: ${shelter.address}`
    );

  _shelterLayerGroup.addLayer(marker);
  return marker;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export function panTo(lat, lng, zoom) {
  if (_map) _map.setView([lat, lng], zoom || _map.getZoom());
}

export function invalidateSize() {
  if (_map) _map.invalidateSize();
}
