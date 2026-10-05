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
// Build category <select> options dynamically
// ---------------------------------------------------------------------------
function populateCategories() {
  const select = document.getElementById("rep-category");
  if (!select) return;
  select.innerHTML = CATEGORIES.map(
    c => `<option value="${c.value}">${c.label}</option>`
  ).join("");
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
    btn.textContent = "📍 Capturing…";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _capturedLat = pos.coords.latitude;
        _capturedLng = pos.coords.longitude;
        btn.textContent = `📍 ${_capturedLat.toFixed(4)}, ${_capturedLng.toFixed(4)}`;
        btn.disabled = false;
        // Fill hidden display field if present
        const locField = document.getElementById("rep-location-display");
        if (locField) locField.textContent = `${_capturedLat.toFixed(4)}, ${_capturedLng.toFixed(4)}`;
      },
      () => {
        btn.textContent = "📍 Use My Location";
        btn.disabled = false;
        alert("Could not get location. Enable location permissions.");
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
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="alert alert--success">
            ✅ Report submitted!<br>
            AI Confidence: <strong>${verification.confidence_score}%</strong>
            (${verification.status})<br>
            Incident ID: <code>${incident.id}</code>
          </div>
        `;
      }
      form.reset();
      _capturedLat = null;
      _capturedLng = null;
      const locBtn = document.getElementById("btn-report-location");
      if (locBtn) locBtn.textContent = "📍 Use My Location";
    } else {
      // Offline / backend unavailable — show local confirmation
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="alert alert--warning">
            ⚠️ Backend offline. Report saved locally.
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
  setupLocationCapture();
  setupPhotoUpload();
  setupForm();
});
