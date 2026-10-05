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
  const currentPage = window.location.pathname.split("/").pop();

  return `
    <nav class="top-navbar" role="navigation" aria-label="ClimateOS Navigation">
      <div class="navbar__brand">
        <div class="navbar__logo" aria-hidden="true">🌍</div>
        <span class="navbar__title">ClimateOS</span>
        <span class="navbar__badge">MVP</span>
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

      <div class="navbar__mode-switch">
        <a href="citizen.html"    class="mode-btn ${mode === 'citizen'    ? 'mode-btn--active' : ''}" title="Switch to Citizen Mode">📱 Citizen</a>
        <a href="government.html" class="mode-btn ${mode === 'government' ? 'mode-btn--active' : ''}" title="Switch to Government Mode">🏛️ Gov</a>
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
