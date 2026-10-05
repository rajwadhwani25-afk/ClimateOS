/**
 * ClimateOS — Government Mode: AI Recommendations Panel
 * File owner: Government Dashboard / Recommendations team
 *
 * Renders AI recommendations with Approve / Reject buttons (human-in-the-loop).
 */

import { getRecommendations, postRecommendationDecision } from "../api.js";

const PRIORITY_STYLES = {
  CRITICAL: { color: "var(--risk-severe)",   icon: "🔴" },
  HIGH:     { color: "var(--risk-high)",     icon: "🟠" },
  MODERATE: { color: "var(--risk-moderate)", icon: "🟡" },
  LOW:      { color: "var(--risk-low)",      icon: "🟢" },
};

export async function loadRecommendations() {
  const container = document.getElementById("recommendations-panel");
  if (!container) return;

  container.innerHTML = `<div class="loading-state">Loading recommendations…</div>`;

  const recs = await getRecommendations();
  if (!recs || recs.length === 0) {
    container.innerHTML = `<div class="empty-state">No pending recommendations.</div>`;
    return;
  }

  container.innerHTML = recs.map(rec => buildRecCard(rec)).join("");

  // Attach Approve/Reject event listeners
  container.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => handleDecision(
      btn.dataset.recId,
      btn.dataset.action,
      btn
    ));
  });
}

function buildRecCard(rec) {
  const style   = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.MODERATE;
  const isPending = rec.decision_status === "PENDING";

  const xaiFactors = rec.xai_factors
    ? Object.entries(rec.xai_factors)
        .map(([k, v]) => `<li><span class="xai-key">${k.replace(/_/g," ")}:</span> ${v}</li>`)
        .join("")
    : "";

  return `
    <div class="rec-card glass-card" id="rec-${rec.id}" data-status="${rec.decision_status}">
      <div class="rec-card__header">
        <span style="color:${style.color};font-size:12px;font-weight:700;">${style.icon} ${rec.priority}</span>
        <span class="rec-card__type">${rec.type.replace("_"," ")}</span>
        <span class="rec-card__confidence">AI: ${rec.confidence}%</span>
      </div>
      <div class="rec-card__title">${rec.title}</div>
      <p class="rec-card__desc">${rec.description}</p>

      ${xaiFactors ? `
      <details class="xai-details">
        <summary class="xai-summary">🤖 Why did AI recommend this?</summary>
        <ul class="xai-list">${xaiFactors}</ul>
      </details>` : ""}

      <div class="rec-card__actions">
        ${isPending ? `
          <button class="btn btn--approve" data-action="APPROVED" data-rec-id="${rec.id}">
            ✅ ${rec.action_text || "Approve"}
          </button>
          <button class="btn btn--reject" data-action="REJECTED" data-rec-id="${rec.id}">
            ❌ Reject
          </button>
        ` : `
          <span class="rec-card__decided">
            ${rec.decision_status === "APPROVED" ? "✅ Approved" : "❌ Rejected"}
          </span>
        `}
      </div>
    </div>
  `;
}

async function handleDecision(recId, decision, btn) {
  btn.disabled = true;
  btn.textContent = "Processing…";

  const result = await postRecommendationDecision(recId, decision);

  if (result) {
    // Re-render this card in decided state
    const card = document.getElementById(`rec-${recId}`);
    if (card) {
      card.querySelector(".rec-card__actions").innerHTML = `
        <span class="rec-card__decided">
          ${decision === "APPROVED" ? "✅ Approved" : "❌ Rejected"}
          &mdash; recorded by ${result.decision || decision}
        </span>
      `;
      card.dataset.status = decision;
    }
  } else {
    btn.disabled = false;
    btn.textContent = decision === "APPROVED" ? "Approve" : "Reject";
    alert("Backend unavailable. Decision not recorded.");
  }
}

document.addEventListener("DOMContentLoaded", loadRecommendations);
