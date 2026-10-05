/**
 * ClimateOS — Government Mode: Simulation Panel
 * File owner: Government Dashboard / Simulation team
 *
 * Sliders for rainfall intensity and water level.
 * Calls POST /api/simulation and updates the zone risk display.
 */

import { runSimulation } from "../api.js";

export function initSimulationPanel() {
  const rainfallSlider  = document.getElementById("sim-rainfall");
  const waterSlider     = document.getElementById("sim-water");
  const rainfallDisplay = document.getElementById("sim-rainfall-val");
  const waterDisplay    = document.getElementById("sim-water-val");
  const runBtn          = document.getElementById("sim-run-btn");
  const resultEl        = document.getElementById("sim-result");
  const zoneSelect      = document.getElementById("sim-zone");

  if (!rainfallSlider || !waterSlider) return;

  // Live slider labels
  rainfallSlider.addEventListener("input", () => {
    if (rainfallDisplay) rainfallDisplay.textContent = `${rainfallSlider.value} mm/hr`;
  });
  waterSlider.addEventListener("input", () => {
    if (waterDisplay) waterDisplay.textContent = `${waterSlider.value} m`;
  });

  // Run simulation
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      runBtn.disabled = true;
      runBtn.textContent = "Running…";
      if (resultEl) resultEl.innerHTML = `<div class="loading-state">Calculating…</div>`;

      const rainfall  = parseFloat(rainfallSlider.value);
      const waterLvl  = parseFloat(waterSlider.value);
      const zoneId    = zoneSelect ? zoneSelect.value : "zone-a";

      const result = await runSimulation(rainfall, waterLvl, zoneId);

      runBtn.disabled = false;
      runBtn.textContent = "▶ Run Simulation";

      if (result && result.updated_zone_risk) {
        const z = result.updated_zone_risk;
        const COLOR = { severe: "#ef4444", high: "#f97316", moderate: "#f59e0b", low: "#22c55e" };
        const color = COLOR[z.risk_level] || "#f59e0b";

        if (resultEl) {
          resultEl.innerHTML = `
            <div class="sim-result-card">
              <div class="sim-result__label">Simulated Risk — ${z.zone_id.toUpperCase()}</div>
              <div class="sim-result__score" style="color:${color};">${z.risk_score} / 100</div>
              <div class="sim-result__status" style="color:${color};">${z.status}</div>
              <p class="sim-result__advice">${z.advice}</p>
            </div>
          `;
        }

        // TODO (Simulation Engine): When real engine is wired, call updateZoneStyle()
        // from map.js here to update the map polygon colors live.
        // import { updateZoneStyle } from '../../map.js';
        // updateZoneStyle(z.zone_id, z.risk_level);
      } else {
        if (resultEl) {
          resultEl.innerHTML = `<div class="alert alert--warning">Backend offline — simulation unavailable.</div>`;
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initSimulationPanel);
