/**
 * ClimateOS — Core Application Coordinator & UI Controller
 * Supports dual execution mode:
 * 1. Live Python FastAPI backend server (http://localhost:8000) with WebSockets & PostGIS
 * 2. In-browser client fallback for standalone static preview
 */

class ClimateOSApp {
  constructor() {
    this.currentView = 'gov'; // 'gov' or 'citizen'
    this.apiBaseUrl = 'http://localhost:8000';
    this.useLiveBackend = false;
    this.websocket = null;

    this.incidents = [
      {
        id: 'INC-1042',
        confidenceScore: 94,
        status: 'High Confidence',
        badgeClass: 'badge-high',
        category: 'trapped',
        location: '142 Riverside Avenue',
        description: 'Water rising up to 1.2m. 12 people trapped on 1st floor, 2 elderly injured.',
        trappedCount: 12,
        injuredCount: 2,
        priorityScore: 96,
        timestamp: '10:42 AM'
      },
      {
        id: 'INC-1039',
        confidenceScore: 88,
        status: 'High Confidence',
        badgeClass: 'badge-high',
        category: 'road',
        location: 'Riverside Bridge & 4th St',
        description: 'Submerged bridge under 1.4m flowing water. Vehicles blocked.',
        trappedCount: 0,
        injuredCount: 0,
        priorityScore: 72,
        timestamp: '10:39 AM'
      },
      {
        id: 'INC-1035',
        confidenceScore: 68,
        status: 'Needs Review',
        badgeClass: 'badge-review',
        category: 'water',
        location: 'Sector 3 Residential',
        description: 'Clean drinking water shortage due to flooded pump station.',
        trappedCount: 0,
        injuredCount: 0,
        priorityScore: 54,
        timestamp: '10:35 AM'
      }
    ];
  }

  async init() {
    // Initialize Map
    if (window.climateMap) {
      window.climateMap.init('map');
    }

    // Check Live FastAPI Backend Connectivity
    await this.checkBackendConnectivity();

    // Render Initial UI Data
    this.renderIncidents();
    this.renderRecommendations();
    this.renderPriorityMatrix();
    this.setupEventListeners();

    // Start on step 2 of simulation
    if (window.disasterSim) {
      window.disasterSim.setStep(2);
    }
  }

  async checkBackendConnectivity() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        this.useLiveBackend = true;
        console.log("⚡ ClimateOS Connected to Live Backend API:", data.platform);
        this.updateHeaderBackendStatus(true);
        this.connectWebSocket();
        this.syncWithBackend();
      }
    } catch (e) {
      this.useLiveBackend = false;
      console.log("ℹ️ Running in Standalone Client Mode (FastAPI backend not running at localhost:8000)");
      this.updateHeaderBackendStatus(false);
    }
  }

  updateHeaderBackendStatus(isLive) {
    const hdr = document.querySelector('.brand');
    if (hdr && !document.getElementById('hdr-api-badge')) {
      const badge = document.createElement('span');
      badge.id = 'hdr-api-badge';
      badge.className = 'brand-badge';
      badge.style.background = isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)';
      badge.style.color = isLive ? '#10b981' : '#94a3b8';
      badge.style.borderColor = isLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.4)';
      badge.innerText = isLive ? 'FastAPI + PostGIS API: LIVE' : 'Client Mode';
      hdr.appendChild(badge);
    }
  }

  async syncWithBackend() {
    if (!this.useLiveBackend) return;
    try {
      const incRes = await fetch(`${this.apiBaseUrl}/incidents`);
      if (incRes.ok) {
        const backendIncidents = await incRes.json();
        if (backendIncidents && backendIncidents.length > 0) {
          this.incidents = backendIncidents.map(i => ({
            id: i.id,
            confidenceScore: i.confidence_score || 90,
            status: i.confidence_score >= 85 ? 'High Confidence' : 'Needs Review',
            badgeClass: i.confidence_score >= 85 ? 'badge-high' : 'badge-review',
            category: i.category,
            location: i.location,
            description: i.description,
            trappedCount: i.trapped_count || 0,
            injuredCount: i.injured_count || 0,
            priorityScore: i.priority_score || 75,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          this.renderIncidents();
          this.renderPriorityMatrix();
        }
      }
    } catch (e) {
      console.warn("Backend sync failed:", e);
    }
  }

  connectWebSocket() {
    try {
      this.websocket = new WebSocket(`ws://localhost:8000/ws`);
      this.websocket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("WebSocket Live Stream Broadcast:", msg);
        if (msg.type === 'NEW_REPORT') {
          this.syncWithBackend();
        } else if (msg.type === 'SIMULATION_STEP') {
          this.syncWithBackend();
        }
      };
    } catch (e) {
      console.warn("WebSocket connection error:", e);
    }
  }

  setupEventListeners() {
    // View Switcher
    const btnGov = document.getElementById('btn-mode-gov');
    const btnCit = document.getElementById('btn-mode-citizen');
    const viewGov = document.getElementById('view-gov');
    const viewCit = document.getElementById('view-citizen');

    if (btnGov && btnCit) {
      btnGov.addEventListener('click', () => {
        btnGov.classList.add('active');
        btnCit.classList.remove('active');
        viewGov.classList.add('active');
        viewCit.classList.remove('active');
        this.currentView = 'gov';
        if (window.climateMap && window.climateMap.map) {
          setTimeout(() => window.climateMap.map.invalidateSize(), 100);
        }
      });

      btnCit.addEventListener('click', () => {
        btnCit.classList.add('active');
        btnGov.classList.remove('active');
        viewCit.classList.add('active');
        viewGov.classList.remove('active');
        this.currentView = 'citizen';
      });
    }

    // Modal Events
    const btnReport = document.getElementById('btn-open-report');
    const modalReport = document.getElementById('modal-report');
    const btnCloseReport = document.getElementById('btn-close-report');
    const formReport = document.getElementById('form-citizen-report');

    if (btnReport && modalReport) {
      btnReport.addEventListener('click', () => modalReport.classList.add('active'));
      if (btnCloseReport) {
        btnCloseReport.addEventListener('click', () => modalReport.classList.remove('active'));
      }
    }

    if (formReport) {
      formReport.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleReportSubmission();
      });
    }

    // Simulation Step Buttons
    document.querySelectorAll('.sim-step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = parseInt(e.target.dataset.step);
        document.querySelectorAll('.sim-step-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if (window.disasterSim) {
          window.disasterSim.setStep(step);
        }
      });
    });

    // XAI Modal Close
    const modalXAI = document.getElementById('modal-xai');
    const btnCloseXAI = document.getElementById('btn-close-xai');
    if (btnCloseXAI && modalXAI) {
      btnCloseXAI.addEventListener('click', () => modalXAI.classList.remove('active'));
    }
  }

  async handleReportSubmission() {
    const category = document.getElementById('rep-category').value;
    const location = document.getElementById('rep-location').value;
    const description = document.getElementById('rep-description').value;
    const trapped = parseInt(document.getElementById('rep-trapped').value) || 0;

    const rawReport = {
      category,
      location,
      lat: 18.5260,
      lng: 73.8580,
      description,
      trapped_count: trapped,
      injured_count: 0
    };

    if (this.useLiveBackend) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawReport)
        });
        if (res.ok) {
          const data = await res.json();
          alert(`Report Sent to FastAPI Server! AI Verification Score: ${data.verification.confidence_score}% (${data.verification.status})`);
          await this.syncWithBackend();
        }
      } catch (e) {
        console.error("Backend report POST error:", e);
      }
    } else {
      // Local fallback
      const verified = window.climateAI.verifyReport({
        ...rawReport,
        trappedCount: trapped,
        hasPhoto: true,
        locationVerified: true,
        zoneId: 'zone-a'
      });
      verified.priorityScore = window.climateAI.calculatePriorityScore(verified);

      this.incidents.unshift(verified);
      this.renderIncidents();
      this.renderPriorityMatrix();

      alert(`Report Submitted locally! AI Confidence: ${verified.confidenceScore}% (${verified.status})`);
    }

    // Add marker to Digital Twin Map
    if (window.climateMap) {
      window.climateMap.addIncidentMarker(18.5260, 73.8580, category, location);
    }

    // Close Modal & Reset Form
    document.getElementById('modal-report').classList.remove('active');
    document.getElementById('form-citizen-report').reset();
  }

  renderIncidents() {
    const container = document.getElementById('incident-feed-container');
    if (!container) return;

    container.innerHTML = this.incidents.map(inc => `
      <div class="incident-item">
        <div class="incident-header">
          <div class="incident-type">
            ${this.getCategoryIcon(inc.category)} ${this.getCategoryTitle(inc.category)}
          </div>
          <span class="badge-confidence ${inc.badgeClass}">
            AI: ${inc.confidenceScore}% (${inc.status})
          </span>
        </div>
        <div class="incident-location">📍 ${inc.location} • ${inc.timestamp}</div>
        <div class="incident-desc">${inc.description}</div>
      </div>
    `).join('');
  }

  renderPriorityMatrix() {
    const container = document.getElementById('priority-matrix-container');
    if (!container) return;

    const sorted = [...this.incidents].sort((a, b) => b.priorityScore - a.priorityScore);

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1); text-align:left; color:#94a3b8;">
            <th style="padding:6px;">Incident</th>
            <th style="padding:6px;">Condition</th>
            <th style="padding:6px; text-align:right;">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(inc => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
              <td style="padding:6px; font-weight:600;">${inc.id}</td>
              <td style="padding:6px; color:#cbd5e1;">${inc.trappedCount ? inc.trappedCount + ' trapped' : inc.location}</td>
              <td style="padding:6px; text-align:right; font-weight:700; color:${inc.priorityScore > 80 ? '#ef4444' : '#f59e0b'};">
                ${inc.priorityScore}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    const recs = window.climateAI.generateRecommendations(this.incidents, window.climateAI.zones);

    container.innerHTML = recs.map(r => `
      <div class="glass-card rec-card ${r.highPriority ? 'high-prio' : ''}" style="margin-bottom:12px;">
        <div class="rec-title">${r.title}</div>
        <div class="rec-reason">${r.reason}</div>
        <div class="rec-actions">
          <button class="btn-action btn-approve" onclick="climateApp.approveRec('${r.id}')">${r.actionText}</button>
          <button class="btn-action btn-reject" onclick="climateApp.rejectRec('${r.id}')">Dismiss</button>
          <button class="btn-action btn-xai" onclick="climateApp.showXAI('${r.id}')">Why AI?</button>
        </div>
      </div>
    `).join('');
  }

  async approveRec(id) {
    if (this.useLiveBackend) {
      try {
        await fetch(`${this.apiBaseUrl}/recommendations/${id}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'ACCEPTED' })
        });
      } catch (e) {}
    }
    alert(`Action Executed: Recommendation [${id}] has been confirmed and broadcasted.`);
    this.renderRecommendations();
  }

  async rejectRec(id) {
    if (this.useLiveBackend) {
      try {
        await fetch(`${this.apiBaseUrl}/recommendations/${id}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'REJECTED' })
        });
      } catch (e) {}
    }
    alert(`Recommendation [${id}] dismissed by authority operator.`);
    this.renderRecommendations();
  }

  showXAI(id) {
    const modal = document.getElementById('modal-xai');
    const content = document.getElementById('xai-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
        <div style="background:rgba(6,182,212,0.1); padding:10px; border-radius:8px; border:1px solid rgba(6,182,212,0.3);">
          <strong>AI Rationale Confidence: 96%</strong><br>
          Recommendation generated by cross-analyzing 4 independent data streams.
        </div>
        <div>
          <span style="color:#94a3b8;">1. Rainfall Intensity:</span> <strong>110 mm/hr</strong> (Extremely High)<br>
          <span style="color:#94a3b8;">2. River Overflow Gauge:</span> <strong>4.2m</strong> (+0.6m above flood margin)<br>
          <span style="color:#94a3b8;">3. Elevation Terrain:</span> <strong>Zone A low-lying basin</strong><br>
          <span style="color:#94a3b8;">4. Citizen Reports:</span> <strong>3 High-Confidence cross-verified incidents</strong>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  applySimulationStep(stepData) {
    // Update Header Risk Score Badge
    const riskBadge = document.getElementById('hdr-risk-score');
    if (riskBadge) {
      riskBadge.innerText = `City Risk: ${stepData.zoneARisk}/100 (${stepData.zoneAStatus})`;
      riskBadge.style.background = stepData.zoneARisk >= 75 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
      riskBadge.style.color = stepData.zoneARisk >= 75 ? '#ef4444' : '#f59e0b';
    }

    // Update Zone Visuals on Map
    if (window.climateMap) {
      window.climateMap.updateZoneRiskVisual('zone-a', stepData.zoneARisk);
    }

    // Update Simulation Status Card
    const simDesc = document.getElementById('sim-step-desc');
    if (simDesc) {
      simDesc.innerHTML = `<strong>${stepData.title}</strong><br><span style="color:#94a3b8;">${stepData.desc}</span>`;
    }

    // Add Incident if present in step
    if (stepData.newIncident) {
      const verified = window.climateAI.verifyReport(stepData.newIncident);
      verified.priorityScore = window.climateAI.calculatePriorityScore(verified);
      this.incidents.unshift(verified);
      this.renderIncidents();
      this.renderPriorityMatrix();
      this.renderRecommendations();
    }
  }

  getCategoryIcon(cat) {
    if (cat === 'trapped') return '🆘';
    if (cat === 'flood') return '🌊';
    if (cat === 'fire') return '🔥';
    if (cat === 'road') return '🚧';
    return '⚠️';
  }

  getCategoryTitle(cat) {
    if (cat === 'trapped') return 'Trapped Victims';
    if (cat === 'flood') return 'Severe Flooding';
    if (cat === 'fire') return 'Fire Hazard';
    if (cat === 'road') return 'Road Blockage';
    return 'Incident';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.climateApp = new ClimateOSApp();
  window.climateApp.init();
});
