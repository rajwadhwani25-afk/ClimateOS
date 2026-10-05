/**
 * ClimateOS — Government Mode: Zone Risk Overview Table
 * File owner: Government Dashboard / Risk team
 */

import { getZonesRisk } from "../api.js";

const RISK_STYLES = {
  severe:   { color: "var(--risk-severe)",   bg: "rgba(239,68,68,0.1)",   label: "Severe"   },
  high:     { color: "var(--risk-high)",     bg: "rgba(249,115,22,0.1)",  label: "High"     },
  moderate: { color: "var(--risk-moderate)", bg: "rgba(245,158,11,0.1)",  label: "Moderate" },
  low:      { color: "var(--risk-low)",      bg: "rgba(34,197,94,0.1)",   label: "Low"      },
};

export async function loadZoneTable() {
  const tableBody = document.getElementById("zone-table-body");
  if (!tableBody) return;

  const zones = await getZonesRisk();
  if (!zones || zones.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No zone data.</td></tr>`;
    return;
  }

  tableBody.innerHTML = zones.map(z => buildZoneRow(z)).join("");
}

function buildZoneRow(z) {
  const style = RISK_STYLES[z.risk_level] || RISK_STYLES.low;
  const barWidth = z.risk_score;

  return `
    <tr id="zone-row-${z.id}" style="background:${style.bg};">
      <td class="zone-table__name">${z.name}</td>
      <td>
        <div class="mini-bar">
          <div class="mini-bar__fill" style="width:${barWidth}%;background:${style.color};"></div>
        </div>
      </td>
      <td style="color:${style.color};font-weight:700;">${z.risk_score}/100</td>
      <td><span class="badge" style="color:${style.color};border-color:${style.color};">${style.label}</span></td>
      <td>${z.rainfall_mm_hr} mm/hr</td>
      <td>${z.water_level_m} m</td>
      <td>${z.population_at_risk.toLocaleString()}</td>
    </tr>
  `;
}

document.addEventListener("DOMContentLoaded", loadZoneTable);
