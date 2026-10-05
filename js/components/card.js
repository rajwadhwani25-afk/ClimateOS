/**
 * ClimateOS — Reusable Card Component
 * Usage: import { renderCard } from './components/card.js';
 */

/**
 * Render a glass-morphism card.
 * @param {Object} options
 * @param {string} options.title - card title
 * @param {string} options.body  - inner HTML
 * @param {string} [options.id]  - optional element ID
 * @param {string} [options.extraClass] - additional CSS classes
 * @returns {string} HTML string
 */
export function renderCard({ title, body, id = "", extraClass = "" }) {
  return `
    <div class="glass-card ${extraClass}" ${id ? `id="${id}"` : ""}>
      ${title ? `<div class="card-title">${title}</div>` : ""}
      <div class="card-body">${body}</div>
    </div>
  `;
}
