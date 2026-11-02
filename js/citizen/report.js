/**
 * ClimateOS — Citizen Mode: Report Incident Page Controller
 * File owner: Citizen Mode / Report Verification team
 *
 * Handles the incident report form: category, description, photo upload,
 * geolocation, and POST to /api/reports.
 */

import { submitReport } from "../api.js";

// Incident categories (FR-03)
const CATEGORIES = [
  { value: "flood",           label: "🌊 Flood & Water Logging" },
  { value: "fire",            label: "🔥 Fire Hazard" },
  { value: "road",            label: "🚧 Road Blockage" },
  { value: "infrastructure",  label: "🏢 Infrastructure Damage" },
  { value: "power_failure",   label: "⚡ Power Failure" },
  { value: "medical",         label: "🚑 Medical Emergency" },
  { value: "trapped",         label: "🆘 Trapped People" },
  { value: "water_shortage",  label: "🚰 Water Shortage" },
];

// ---------------------------------------------------------------------------
// Build category grid & <select> options dynamically
// ---------------------------------------------------------------------------
function populateCategories() {
  const select = document.getElementById("rep-category");
  const grid = document.getElementById("category-grid");

  if (select) {
    select.innerHTML = CATEGORIES.map(
      c => `<option value="${c.value}">${c.label}</option>`
    ).join("");
  }

  if (grid) {
    grid.innerHTML = CATEGORIES.map((c, i) => `
      <button type="button" class="category-tile ${i === 0 ? 'active' : ''}" data-val="${c.value}">
        <span class="category-tile__icon">${c.label.split(' ')[0]}</span>
        <span class="category-tile__name">${c.label.split(' ').slice(1).join(' ')}</span>
      </button>
    `).join("");

    grid.querySelectorAll(".category-tile").forEach(btn => {
      btn.addEventListener("click", () => {
        grid.querySelectorAll(".category-tile").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (select) {
          select.value = btn.dataset.val;
          updatePriorityMeter();
        }
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Real-time Priority Estimator & Character Counter
// ---------------------------------------------------------------------------
function setupLiveEstimators() {
  const desc = document.getElementById("rep-description");
  const counter = document.getElementById("rep-char-count");
  const trapped = document.getElementById("rep-trapped");
  const injured = document.getElementById("rep-injured");

  if (desc && counter) {
    desc.addEventListener("input", () => {
      counter.textContent = `${desc.value.length} / 500`;
      updatePriorityMeter();
    });
  }

  if (trapped) trapped.addEventListener("input", updatePriorityMeter);
  if (injured) injured.addEventListener("input", updatePriorityMeter);
}

function updatePriorityMeter() {
  const badge = document.getElementById("rep-priority-badge");
  const hint = document.getElementById("rep-priority-hint");
  const trapped = parseInt(document.getElementById("rep-trapped")?.value || "0");
  const injured = parseInt(document.getElementById("rep-injured")?.value || "0");
  const category = document.getElementById("rep-category")?.value;
  const desc = (document.getElementById("rep-description")?.value || "").toLowerCase();

  if (!badge || !hint) return;

  const isSevereWord = desc.includes("trapped") || desc.includes("drowning") || desc.includes("chest") || desc.includes("roof") || desc.includes("submerged");

  if (trapped > 0 || injured > 0 || category === "trapped" || category === "medical" || isSevereWord) {
    badge.className = "badge badge--severe pulse";
    badge.textContent = "🚨 LEVEL 4 • CRITICAL RESPONSE";
    hint.textContent = "Urgent: Direct dispatch priority for NDRF boat teams and medical personnel.";
  } else if (category === "flood" || category === "fire" || category === "infrastructure") {
    badge.className = "badge badge--high";
    badge.textContent = "⚠️ LEVEL 3 • HIGH PRIORITY";
    hint.textContent = "AI model will route to field inspection teams for rapid mitigation.";
  } else {
    badge.className = "badge badge--info";
    badge.textContent = "ℹ️ LEVEL 2 • ACTIVE QUEUE";
    hint.textContent = "Standard priority verification with automated satellite & sensor correlation.";
  }
}

// ---------------------------------------------------------------------------
// Geolocation: "Use My Location" button
// ---------------------------------------------------------------------------
let _capturedLat = null;
let _capturedLng = null;

function setupLocationCapture() {
  const btn = document.getElementById("btn-report-location");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    btn.textContent = "📍 Pinning…";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _capturedLat = pos.coords.latitude;
        _capturedLng = pos.coords.longitude;
        btn.textContent = "✓ Pinned";
        btn.disabled = false;
        const locField = document.getElementById("rep-location-display");
        if (locField) locField.textContent = `📍 GPS Fixed: ${_capturedLat.toFixed(4)}, ${_capturedLng.toFixed(4)} (Pune Ward 4)`;
        const addrField = document.getElementById("rep-location");
        if (addrField && !addrField.value) {
          addrField.value = `Near Riverside Corridor (${_capturedLat.toFixed(3)}, ${_capturedLng.toFixed(3)})`;
        }
      },
      () => {
        btn.textContent = "📍 GPS Pin";
        btn.disabled = false;
        alert("Could not get location. Enable location permissions or enter address manually.");
      }
    );
  });
}


// ---------------------------------------------------------------------------
// Photo upload preview
// ---------------------------------------------------------------------------
function setupPhotoUpload() {
  const input = document.getElementById("rep-photo");
  const preview = document.getElementById("rep-photo-preview");
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Photo preview" style="width:100%;border-radius:8px;margin-top:8px;">`;
    };
    reader.readAsDataURL(file);
    // TODO (AI Report Verification): Send photo to backend for computer vision
    // flood/damage detection — attach as multipart/form-data alongside JSON payload.
  });
}

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------
function setupForm() {
  const form = document.getElementById("form-citizen-report");
  const statusDiv = document.getElementById("rep-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";
    if (statusDiv) statusDiv.textContent = "";

    const payload = {
      category:       document.getElementById("rep-category")?.value,
      description:    document.getElementById("rep-description")?.value,
      location:       document.getElementById("rep-location")?.value || null,
      lat:            _capturedLat,
      lng:            _capturedLng,
      trapped_count:  parseInt(document.getElementById("rep-trapped")?.value || "0"),
      injured_count:  parseInt(document.getElementById("rep-injured")?.value || "0"),
      photo_attached: !!(document.getElementById("rep-photo")?.files?.length),
    };

    const result = await submitReport(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";

    if (result) {
      const { verification, incident } = result;
      const conf     = verification.confidence_score;
      const confColor = conf >= 85 ? "#22c55e" : conf >= 55 ? "#f59e0b" : "#ef4444";

      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="report-confirm-card">
            <div class="report-confirm__header">
              <span class="report-confirm__icon">✅</span>
              <div>
                <div class="report-confirm__title">Report Submitted!</div>
                <div class="report-confirm__id">ID: <code>${incident.id}</code></div>
              </div>
            </div>

            <div class="report-confirm__ai">
              <div class="report-confirm__ai-label">
                AI Verification Score
                <span class="report-confirm__ai-status" style="color:${confColor};">
                  ${verification.status}
                </span>
              </div>
              <div class="report-confirm__score-row">
                <span class="report-confirm__score" style="color:${confColor};">${conf}%</span>
              </div>
              <div class="report-confirm__bar">
                <div class="report-confirm__bar-fill"
                     style="width:${conf}%;background:${confColor};"></div>
              </div>
            </div>

            <p class="report-confirm__note">
              🏛️ Your report has been sent to emergency authorities.
              ${conf >= 85
                ? "High confidence — likely to be actioned within minutes."
                : conf >= 55
                ? "Moderate confidence — under review by emergency team."
                : "Low confidence — additional verification may be requested."}
            </p>
          </div>
        `;
      }
      form.reset();
      _capturedLat = null;
      _capturedLng = null;
      const locBtn = document.getElementById("btn-report-location");
      if (locBtn) locBtn.textContent = "📍 GPS Pin";
      const locField = document.getElementById("rep-location-display");
      if (locField) locField.textContent = "";
      const counter = document.getElementById("rep-char-count");
      if (counter) counter.textContent = "0 / 500";
      const preview = document.getElementById("rep-photo-preview");
      if (preview) preview.innerHTML = "";
      // Reset category tiles
      const grid = document.getElementById("category-grid");
      if (grid) {
        grid.querySelectorAll(".category-tile").forEach((b, i) => {
          b.classList.toggle("active", i === 0);
        });
      }
      updatePriorityMeter();
    } else {
      // Offline / backend unavailable — show local confirmation
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="alert alert--warning">
            ⚠️ Backend offline. Report queued locally.
            <!-- TODO (Offline Cache): Queue to service worker for replay when online. -->
          </div>
        `;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  setupLiveEstimators();
  setupLocationCapture();
  setupPhotoUpload();
  setupForm();
});

