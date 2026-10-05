/**
 * ClimateOS — Government Mode: Incident Feed Panel
 * File owner: Government Dashboard / Incident team
 *
 * Renders ranked incidents with confidence badges (High Confidence / Needs Review / Low Confidence)
 */

import { getIncidents } from "../api.js";

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

export async function loadIncidentFeed() {
  const container = document.getElementById("incident-feed");
  if (!container) return;

  container.innerHTML = `<div class="loading-state">Loading incidents…</div>`;

  const incidents = await getIncidents();
  if (!incidents || incidents.length === 0) {
    container.innerHTML = `<div class="empty-state">No active incidents.</div>`;
    return;
  }

  container.innerHTML = incidents.map((inc, idx) => buildIncidentItem(inc, idx + 1)).join("");
}

function buildIncidentItem(inc, rank) {
  const badge = CONFIDENCE_BADGE[inc.confidence_label] || CONFIDENCE_BADGE["Needs Review"];
  const icon  = CATEGORY_ICONS[inc.category] || "⚠️";
  const priorityColor = inc.priority_score >= 85 ? "var(--risk-severe)"
                      : inc.priority_score >= 60 ? "var(--risk-high)"
                      : "var(--risk-moderate)";

  return `
    <div class="incident-item" id="incident-${inc.id}" data-id="${inc.id}">
      <div class="incident-item__header">
        <span class="incident-item__rank">#${rank}</span>
        <span class="incident-item__type">${icon} ${inc.category.replace("_", " ")}</span>
        <span class="badge ${badge.cls}">${badge.label}</span>
      </div>
      <div class="incident-item__location">📍 ${inc.location}</div>
      <div class="incident-item__desc">${inc.description}</div>
      <div class="incident-item__footer">
        <span style="color:${priorityColor};font-weight:700;">Priority: ${inc.priority_score}/100</span>
        ${inc.trapped_count > 0 ? `<span class="tag tag--danger">🆘 ${inc.trapped_count} trapped</span>` : ""}
        ${inc.injured_count > 0 ? `<span class="tag tag--warning">🤕 ${inc.injured_count} injured</span>` : ""}
        <span style="color:var(--text-muted);font-size:11px;">AI: ${inc.confidence_score}%</span>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadIncidentFeed);
