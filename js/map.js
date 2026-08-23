/**
 * ClimateOS — Digital Twin & 2.5D Leaflet GIS Map Controller
 */

class ClimateMap {
  constructor() {
    this.map = null;
    this.zonePolygons = {};
    this.markers = [];
    this.routePolylines = [];
  }

  init(containerId) {
    if (!document.getElementById(containerId)) return;

    // Center on city coordinates (e.g. Pune / Urban area coordinates: 18.5204, 73.8567)
    this.map = L.map(containerId, {
      center: [18.5204, 73.8567],
      zoom: 13,
      zoomControl: false
    });

    // Dark Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Initialize Layers
    this.renderRiskZones();
    this.renderShelters();
    this.renderIncidents();
    this.renderEvacuationRoutes();
  }

  renderRiskZones() {
    // Zone A: Riverside (High Risk - Red Polygon)
    const zoneACoords = [
      [18.5280, 73.8450],
      [18.5350, 73.8600],
      [18.5250, 73.8750],
      [18.5150, 73.8550]
    ];
    this.zonePolygons['zone-a'] = L.polygon(zoneACoords, {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.35,
      weight: 2
    }).addTo(this.map).bindTooltip("<b>Zone A — Riverside</b><br>Risk: 88/100 (HIGH RISK)", { permanent: true, direction: 'center', className: 'map-zone-label' });

    // Zone B: Downtown (Medium Risk - Amber Polygon)
    const zoneBCoords = [
      [18.5150, 73.8550],
      [18.5250, 73.8750],
      [18.5050, 73.8850],
      [18.4980, 73.8600]
    ];
    this.zonePolygons['zone-b'] = L.polygon(zoneBCoords, {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.25,
      weight: 2
    }).addTo(this.map).bindTooltip("<b>Zone B — Downtown</b><br>Risk: 64/100", { direction: 'center' });

    // Zone C: Westside (Moderate Risk)
    const zoneCCoords = [
      [18.5280, 73.8450],
      [18.5150, 73.8550],
      [18.4980, 73.8600],
      [18.5000, 73.8300]
    ];
    this.zonePolygons['zone-c'] = L.polygon(zoneCCoords, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      weight: 1
    }).addTo(this.map);

    // Zone D: North Hills (Low Risk - Green)
    const zoneDCoords = [
      [18.5350, 73.8600],
      [18.5500, 73.8700],
      [18.5400, 73.8900],
      [18.5250, 73.8750]
    ];
    this.zonePolygons['zone-d'] = L.polygon(zoneDCoords, {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      weight: 1
    }).addTo(this.map);
  }

  renderShelters() {
    const shelters = [
      { name: "Shelter A — Community Hall", lat: 18.5050, lng: 73.8720, capacity: "410/500 Occupied", status: "ACTIVE" },
      { name: "Shelter B — Central School", lat: 18.5420, lng: 73.8780, capacity: "45/400 Occupied", status: "READY" }
    ];

    shelters.forEach(s => {
      const icon = L.divIcon({
        className: 'custom-map-icon shelter-icon',
        html: `<div style="background:#06b6d4; color:#000; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow:0 0 12px #06b6d4;">🏥</div>`,
        iconSize: [30, 30]
      });

      const marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(this.map)
        .bindPopup(`<b>${s.name}</b><br>Status: ${s.status}<br>Capacity: ${s.capacity}`);
      this.markers.push(marker);
    });
  }

  renderIncidents() {
    const incidents = [
      { title: "Trapped Civilians (12 people)", lat: 18.5260, lng: 73.8580, type: "danger", icon: "🆘" },
      { title: "Flooded Bridge & Road Closure", lat: 18.5230, lng: 73.8520, type: "warning", icon: "🚧" }
    ];

    incidents.forEach(inc => {
      const icon = L.divIcon({
        className: 'custom-map-icon incident-icon',
        html: `<div style="background:${inc.type === 'danger' ? '#ef4444' : '#f59e0b'}; color:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 0 10px ${inc.type === 'danger' ? '#ef4444' : '#f59e0b'};" class="pulse">${inc.icon}</div>`,
        iconSize: [28, 28]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: icon }).addTo(this.map)
        .bindPopup(`<b>${inc.title}</b>`);
      this.markers.push(marker);
    });
  }

  renderEvacuationRoutes() {
    // Unsafe Route A (Red dashed line)
    const unsafeRoute = L.polyline([
      [18.5280, 73.8480],
      [18.5230, 73.8520],
      [18.5150, 73.8550]
    ], { color: '#ef4444', weight: 4, dashArray: '6, 8' }).addTo(this.map)
      .bindTooltip("Route A: BLOCKED (Flooded)");
    this.routePolylines.push(unsafeRoute);

    // Safe Evacuation Route C (Glowing Green Line)
    const safeRoute = L.polyline([
      [18.5280, 73.8480],
      [18.5350, 73.8650],
      [18.5420, 73.8780]
    ], { color: '#10b981', weight: 5 }).addTo(this.map)
      .bindTooltip("Route C: SAFEST EVACUATION ROUTE", { permanent: true, direction: 'top' });
    this.routePolylines.push(safeRoute);
  }

  addIncidentMarker(lat, lng, category, title) {
    let iconChar = '⚠️';
    if (category === 'flood') iconChar = '🌊';
    if (category === 'trapped') iconChar = '🆘';
    if (category === 'fire') iconChar = '🔥';
    if (category === 'road') iconChar = '🚧';

    const icon = L.divIcon({
      className: 'custom-map-icon incident-icon',
      html: `<div style="background:#ef4444; color:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 0 10px #ef4444;" class="pulse">${iconChar}</div>`,
      iconSize: [28, 28]
    });

    const marker = L.marker([lat, lng], { icon: icon }).addTo(this.map)
      .bindPopup(`<b>${title}</b><br>Status: AI Verified`)
      .openPopup();

    this.markers.push(marker);
    this.map.panTo([lat, lng]);
  }

  updateZoneRiskVisual(zoneId, riskScore) {
    const polygon = this.zonePolygons[zoneId];
    if (!polygon) return;

    let color = '#10b981';
    let opacity = 0.15;
    if (riskScore >= 75) {
      color = '#ef4444';
      opacity = 0.4;
    } else if (riskScore >= 45) {
      color = '#f59e0b';
      opacity = 0.25;
    }

    polygon.setStyle({ color: color, fillColor: color, fillOpacity: opacity });
  }
}

window.climateMap = new ClimateMap();
