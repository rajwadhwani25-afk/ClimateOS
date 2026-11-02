/**
 * ClimateOS — Government Mode: Simulation Panel
 * File owner: Government Dashboard / Simulation team
 *
 * Sliders for rainfall intensity and water level.
 * Calls POST /api/simulation → updates result card + live map zone recolor.
 *
 * Live features:
 *  - Debounced slider preview (calls simulation API as you drag)
 *  - Full run on "▶ Run Simulation" button click
 *  - Map zone polygon color updates via updateZoneStyle()
 *  - Floating stats bar sync via updateMapStatsBar()
 *  - Simulation mode banner on map
 */

import { runSimulation } from "../api.js";
import {
  updateZoneStyle,
  updateMapStatsBar,
  enterSimulationMode,
  exitSimulationMode,
  RISK_COLORS,
} from "../map.js";

// ---------------------------------------------------------------------------
// Zone display name lookup
// ---------------------------------------------------------------------------
const ZONE_NAMES = {
  "zone-a": "Zone A — Riverside",
  "zone-b": "Zone B — Downtown",
  "zone-c": "Zone C — Westside",
  "zone-d": "Zone D — North Hills",
  "zone-e": "Zone E — Industrial Port",
};

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ---------------------------------------------------------------------------
// Result card renderer
// ---------------------------------------------------------------------------
function renderResultCard(z, isPreview = false) {
  const color = RISK_COLORS[z.risk_level] || "#f59e0b";
  const scoreWidth = z.risk_score;

  return `
    <div class="sim-result-card ${isPreview ? "sim-result-card--preview" : "sim-result-card--live"}"
         style="--sim-color:${color}; border-color: ${color}33;">
      <div class="sim-result__label">
        ${isPreview ? "⚡ Preview — " : "✅ Simulated — "}${z.zone_id.toUpperCase().replace("-", " ")}
      </div>
      <div class="sim-result__score" style="color:${color};">
        ${z.risk_score}
        <span style="font-size:18px;font-weight:400;color:var(--text-muted);">/100</span>
      </div>
      <div class="sim-result__status" style="color:${color};">${z.status}</div>

      <!-- Score bar -->
      <div class="sim-result__bar">
        <div class="sim-result__bar-fill"
             style="width:${scoreWidth}%;background:${color};box-shadow:0 0 8px ${color}40;"></div>
      </div>

      <p class="sim-result__advice">${z.advice}</p>

      ${isPreview ? "" : `
      <div class="sim-result__inputs">
        <span>🌧️ ${z.rainfall_mm_hr} mm/hr</span>
        <span>🌊 ${z.water_level_m} m</span>
      </div>`}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Core simulation runner
// ---------------------------------------------------------------------------
async function _executeSimulation({ rainfall, waterLvl, zoneId, isPreview = false, runBtn, resultEl }) {
  if (!isPreview && runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span class="sim-spinner"></span> Running…`;
  }

  if (resultEl && !isPreview) {
    resultEl.innerHTML = `<div class="loading-state">⚡ Calculating zone risk…</div>`;
  }

  const result = await runSimulation(rainfall, waterLvl, zoneId);

  if (!isPreview && runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = `▶ Run Simulation`;
  }

  if (result && result.updated_zone_risk) {
    const z = result.updated_zone_risk;

    // 1. Update primary zone polygon with pulse
    updateZoneStyle(zoneId, z.risk_level, z.risk_score);

    // 2. Update all propagated zones (backend returns all_zones_risk)
    if (result.all_zones_risk && !isPreview) {
      result.all_zones_risk.forEach(zr => {
        if (zr.zone_id !== zoneId) {
          updateZoneStyle(zr.zone_id, zr.risk_level, zr.risk_score);
        }
      });
    }

    // 3. Update floating stats bar
    updateMapStatsBar(z.rainfall_mm_hr, z.water_level_m);

    // 4. Show / refresh simulation mode banner on map
    enterSimulationMode(ZONE_NAMES[zoneId] || zoneId, z.risk_level);

    // 5. Render result card
    if (resultEl) {
      resultEl.innerHTML = renderResultCard(z, isPreview);
    }

    return z;
  } else {
    if (resultEl && !isPreview) {
      resultEl.innerHTML = `<div class="alert alert--warning">⚠️ Backend offline — running in mock mode.</div>`;
    }
    // Offline fallback: still update map with a mock level based on rainfall
    const mockLevel = rainfall > 150 ? "severe" : rainfall > 100 ? "high" : rainfall > 60 ? "moderate" : "low";
    updateZoneStyle(zoneId, mockLevel, Math.round(rainfall * 0.5));
    enterSimulationMode(ZONE_NAMES[zoneId] || zoneId, mockLevel);
    updateMapStatsBar(rainfall, waterLvl);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Panel initializer
// ---------------------------------------------------------------------------
export function initSimulationPanel() {
  const rainfallSlider  = document.getElementById("sim-rainfall");
  const waterSlider     = document.getElementById("sim-water");
  const rainfallDisplay = document.getElementById("sim-rainfall-val");
  const waterDisplay    = document.getElementById("sim-water-val");
  const runBtn          = document.getElementById("sim-run-btn");
  const resultEl        = document.getElementById("sim-result");
  const zoneSelect      = document.getElementById("sim-zone");
  const resetBtn        = document.getElementById("sim-reset-btn");

  if (!rainfallSlider || !waterSlider) return;

  // ── Slider live labels ────────────────────────────────────────────────────
  rainfallSlider.addEventListener("input", () => {
    if (rainfallDisplay) rainfallDisplay.textContent = `${rainfallSlider.value} mm/hr`;
  });

  waterSlider.addEventListener("input", () => {
    if (waterDisplay) waterDisplay.textContent = `${waterSlider.value} m`;
  });

  // ── Debounced live preview on slider drag ─────────────────────────────────
  const debouncedPreview = debounce(async () => {
    const rainfall = parseFloat(rainfallSlider.value);
    const waterLvl = parseFloat(waterSlider.value);
    const zoneId   = zoneSelect ? zoneSelect.value : "zone-a";

    await _executeSimulation({
      rainfall, waterLvl, zoneId,
      isPreview: true,
      runBtn, resultEl,
    });
  }, 400);

  rainfallSlider.addEventListener("input", debouncedPreview);
  waterSlider.addEventListener("input", debouncedPreview);
  if (zoneSelect) zoneSelect.addEventListener("change", debouncedPreview);

  // ── Scenario Presets ───────────────────────────────────────────────────────
  const presetsGrid = document.getElementById("sim-presets-grid");
  if (presetsGrid) {
    presetsGrid.querySelectorAll(".sim-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        presetsGrid.querySelectorAll(".sim-preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const rain = parseFloat(btn.dataset.rain);
        const water = parseFloat(btn.dataset.water);

        rainfallSlider.value = rain;
        waterSlider.value = water;
        if (rainfallDisplay) rainfallDisplay.textContent = `${rain} mm/hr`;
        if (waterDisplay) waterDisplay.textContent = `${water} m`;

        debouncedPreview();
      });
    });
  }


  // ── Full run button ───────────────────────────────────────────────────────
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      const rainfall = parseFloat(rainfallSlider.value);
      const waterLvl = parseFloat(waterSlider.value);
      const zoneId   = zoneSelect ? zoneSelect.value : "zone-a";

      await _executeSimulation({
        rainfall, waterLvl, zoneId,
        isPreview: false,
        runBtn, resultEl,
      });
    });
  }

  // ── Reset button ──────────────────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      exitSimulationMode();
      if (resultEl) resultEl.innerHTML = "";
      // Restore sliders to default
      rainfallSlider.value = 110;
      waterSlider.value    = 4.2;
      if (rainfallDisplay) rainfallDisplay.textContent = "110 mm/hr";
      if (waterDisplay)    waterDisplay.textContent    = "4.2 m";
      updateMapStatsBar(110, 4.2);
      // Reload the original zone colors from the API
      import("../api.js").then(({ getZonesRisk }) => {
        getZonesRisk().then(zones => {
          if (zones) {
            import("../map.js").then(({ renderRiskZonesGeoJSON }) => {
              renderRiskZonesGeoJSON(zones);
            });
          }
        });
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", initSimulationPanel);
