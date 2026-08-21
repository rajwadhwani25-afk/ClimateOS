# 🌍 ClimateOS — AI-Powered Climate Disaster Intelligence & Response Platform

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Hackathon%20MVP%20v2.0-emerald.svg)](#)
[![Theme](https://img.shields.io/badge/Theme-AI%20for%20Climate%20Change-brightgreen.svg)](#)

> **ClimateOS** transforms fragmented climate data and citizen observations into verified, localized, and actionable decisions before, during, and after climate disasters.

**Core Loop:** `Predict ➔ Sense ➔ Verify ➔ Understand ➔ Prioritize ➔ Act ➔ Learn`

---

## 🎯 Product Vision & Core Principle

ClimateOS acts as an AI decision-support layer for emergency authorities and citizens. Rather than just alerting, ClimateOS creates a continuous intelligence loop where citizens act as a real-time sensing network of ground truth.

- **For Citizens**: Personal risk awareness, localized emergency alerts, AI-calculated safe evacuation routes, shelter discovery, and instant incident reporting.
- **For Government & Responders**: City-level 2.5D Digital Twin risk map, AI incident verification with confidence scoring, automated rescue resource prioritization, and action recommendations.

---

## ✨ Key Features (MVP: Urban Flooding)

- 🗺️ **Dynamic Risk Map & Digital Twin**: 2D/2.5D spatial visualization of hazard zones, road blockages, shelters, and critical incidents.
- 🤖 **AI Fusion Core**: Risk scoring engine combining weather data, elevation, historical patterns, and citizen reports.
- 📱 **Citizen Reporting & Ground-Truth Network**: Report floods, trapped victims, fires, power failures, and road blockages with location and severity metadata.
- ✅ **AI Incident Verification**: AI assigns confidence scores (High, Needs Review, Low) by cross-referencing sensor inputs, weather, and nearby citizen reports.
- 🚨 **Personalized Risk & Safe-Route Engine**: Calculates safe evacuation routes considering flood probability, road closures, and obstacle severity.
- 🏥 **Shelter Intelligence**: Live tracking of shelter locations, occupancy, capacity, and accessibility status.
- 🚑 **AI Resource & Rescue Prioritizer**: Ranks rescue priorities (e.g., trapped victims, injuries) to deploy limited responder units efficiently.
- ⚡ **Disaster Simulation Mode**: Interactive sandbox to trigger synthetic rainfall, rising water levels, and emergency reports in real-time.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Single Page Web App (HTML5, Vanilla CSS with Glassmorphism, JavaScript ES6+)
- **Interactive Geospatial**: Leaflet / Canvas 2D Digital Twin Engine
- **AI Core**: Client-side & API-simulated AI Verification, Priority Engine, and Recommendation Services
- **Data Layer**: Weather API schemas, simulated river gauges, open shelter registry

---

## 🚀 Getting Started

### Quick Start (Local Web Server)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rajwadhwani25-afk/ClimateOS.git
   cd ClimateOS
   ```

2. **Launch the platform:**
   Simply open `index.html` in your browser or run a local static server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```

---

## 📄 Document Reference

- Product Requirements Document: [`ClimateOS_PRD.pdf`](file:///Users/maithilipawar/Project/ClimateOS/ClimateOS_PRD.pdf)
- License: [`LICENSE`](file:///Users/maithilipawar/Project/ClimateOS/LICENSE) (GNU GPL v3.0)