/**
 * ClimateOS — Reusable Badge Component
 * Usage: import { renderBadge, renderConfidenceBadge } from './components/badge.js';
 */

/**
 * Render a generic colored badge span.
 * @param {string} text
 * @param {'high'|'review'|'low'|'severe'|'moderate'|'info'} variant
 * @returns {string} HTML string
 */
export function renderBadge(text, variant = "info") {
  const variants = {
    high:     "badge badge--high",
    review:   "badge badge--review",
    low:      "badge badge--low",
    severe:   "badge badge--severe",
    moderate: "badge badge--moderate",
    info:     "badge badge--info",
  };
  const cls = variants[variant] || variants.info;
  return `<span class="${cls}">${text}</span>`;
}

/**
 * Render a confidence badge based on AI confidence label string.
 * @param {string} confidenceLabel - "High Confidence" | "Needs Review" | "Low Confidence"
 * @param {number} score - numeric confidence 0-100
 * @returns {string} HTML string
 */
export function renderConfidenceBadge(confidenceLabel, score) {
  const variantMap = {
    "High Confidence": "high",
    "Needs Review":    "review",
    "Low Confidence":  "low",
  };
  const variant = variantMap[confidenceLabel] || "review";
  return renderBadge(`${confidenceLabel} (${score}%)`, variant);
}
