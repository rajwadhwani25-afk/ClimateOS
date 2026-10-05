/**
 * ClimateOS — Citizen Mode: Safe Route Page Controller
 * File owner: Safe Routing team
 *
 * TODO (Safe Routing Engine): This is a PLACEHOLDER page.
 * Implement GET /api/safe-route?origin_lat=X&origin_lng=Y&shelter_id=Z
 * Route calculation should factor in:
 *   - Active flood zone polygons (avoid flooded roads)
 *   - Blocked road reports from incident feed
 *   - Real-time road condition updates
 *   - Multiple route options ranked by safety score
 *   - Walking vs. vehicle routing modes
 * Render result on a Leaflet map with color-coded safety polylines.
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("safe-route-content");
  if (!container) return;

  container.innerHTML = `
    <div class="placeholder-panel">
      <div class="placeholder-panel__icon">🗺️</div>
      <h2 class="placeholder-panel__title">Safe Route Navigator</h2>
      <p class="placeholder-panel__desc">
        This feature is coming soon. The safe routing engine will calculate
        the safest evacuation route from your location to the nearest open shelter,
        avoiding flooded roads and blocked bridges.
      </p>
      <div class="placeholder-panel__current-route">
        <div class="glass-card" style="text-align:left;">
          <div class="card-title">📍 Currently Recommended</div>
          <div style="font-size:14px;font-weight:600;color:var(--risk-low);margin-bottom:4px;">
            Route C — Elevated Highway Bypass
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
            Est. Distance: 2.4 km &bull; Travel Time: ~12 mins (Safest Route)
          </div>
          <div class="alert-strip alert-strip--danger">
            ⚠️ Avoid Route A — Riverside Bridge flooded (1.4m depth)
          </div>
        </div>
      </div>
      <p class="placeholder-panel__note">
        <!-- TODO (Safe Routing Engine): Wire to /api/safe-route endpoint once implemented -->
      </p>
    </div>
  `;
});
