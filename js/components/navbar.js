/**
 * ClimateOS — Reusable Navbar Component
 * Injects the shared top navbar into any page.
 * Usage: import './components/navbar.js';
 * Place <div id="navbar-root"></div> at top of <body>.
 */

const PAGES = {
  citizen: [
    { href: "citizen.html",         label: "🏠 Home"       },
    { href: "citizen-map.html",     label: "🗺️ Map"        },
    { href: "citizen-report.html",  label: "📢 Report"     },
    { href: "citizen-shelters.html",label: "🏥 Shelters"   },
    { href: "citizen-route.html",   label: "🛡️ Safe Route"  },
  ],
  government: [
    { href: "government.html", label: "🏛️ Command Center" },
  ],
};

function buildNavbar(mode) {
  const links = PAGES[mode] || [];
  const currentPage = window.location.pathname.split("/").pop() || (mode === "government" ? "government.html" : "citizen.html");

  const modeBadge = mode === "government"
    ? `<div class="navbar__status-pill navbar__status-pill--gov" title="Autonomous monitoring active">
         <span class="status-beacon status-beacon--red"></span>
         <span>DISASTER LEVEL 2</span>
       </div>`
    : `<a href="tel:108" class="navbar__sos-btn" title="Call Emergency Disaster Response (108)">
         <span class="sos-icon">🚨</span>
         <span>SOS 108</span>
       </a>`;

  return `
    <nav class="top-navbar" role="navigation" aria-label="ClimateOS Navigation">
      <div class="navbar__brand">
        <a href="${mode === 'government' ? 'government.html' : 'citizen.html'}" class="navbar__logo-link">
          <div class="navbar__logo" aria-hidden="true">
            <span class="navbar__logo-icon">🌍</span>
            <span class="navbar__logo-ring"></span>
          </div>
          <div class="navbar__brand-text">
            <span class="navbar__title">Climate<span class="navbar__title-accent">OS</span></span>
            <span class="navbar__tagline">${mode === 'government' ? 'COMMAND CTR' : 'CITIZEN DEFENSE'}</span>
          </div>
        </a>
      </div>

      <div class="navbar__links">
        ${links.map(p => `
          <a href="${p.href}"
             class="navbar__link ${currentPage === p.href ? 'navbar__link--active' : ''}"
             ${currentPage === p.href ? 'aria-current="page"' : ''}>
            ${p.label}
          </a>
        `).join("")}
      </div>

      <div class="navbar__actions">
        ${modeBadge}
        <div class="navbar__mode-switch">
          <a href="citizen.html"    class="mode-btn ${mode === 'citizen'    ? 'mode-btn--active' : ''}" title="Switch to Citizen Mode">📱 Citizen</a>
          <a href="government.html" class="mode-btn ${mode === 'government' ? 'mode-btn--active' : ''}" title="Switch to Government Command Mode">🏛️ Command</a>
        </div>
      </div>
    </nav>
  `;
}

export function initNavbar(mode = "citizen") {
  const root = document.getElementById("navbar-root");
  if (root) {
    root.innerHTML = buildNavbar(mode);
  }
}

