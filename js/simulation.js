/**
 * ClimateOS — Disaster Simulation Controller
 * Executes the 10-Step Signature Hackathon Demo Sequence (PRD Section 19)
 */

class DisasterSimulation {
  constructor() {
    this.currentStep = 0;
    this.steps = [
      {
        step: 1,
        title: "1. Predict — Early Warning",
        desc: "Extreme rainfall forecast (+110 mm/hr). AI Risk Prediction engine flags Zone A - Riverside.",
        rainfall: 45,
        waterLevel: 1.8,
        zoneARisk: 48,
        zoneAStatus: "MODERATE RISK",
        newIncident: null
      },
      {
        step: 2,
        title: "2. Risk Rises — Water Overflow",
        desc: "Simulated river gauge sensors report rapid rise (+35cm/hr). Zone A enters HIGH RISK (88/100).",
        rainfall: 110,
        waterLevel: 4.2,
        zoneARisk: 88,
        zoneAStatus: "HIGH RISK",
        newIncident: null
      },
      {
        step: 3,
        title: "3. Citizens Report — Ground Truth Arrives",
        desc: "3 citizen reports received: Flooded road, 12 trapped people on Riverside Ave, and bridge blockage.",
        rainfall: 110,
        waterLevel: 4.5,
        zoneARisk: 94,
        zoneAStatus: "HIGH RISK",
        newIncident: {
          category: 'trapped',
          location: '142 Riverside Avenue',
          description: 'Water rising up to 1.2m. 12 people trapped on 1st floor, 2 elderly injured.',
          trappedCount: 12,
          injuredCount: 2,
          hasPhoto: true,
          locationVerified: true
        }
      },
      {
        step: 4,
        title: "4. Verify — AI Report Verification",
        desc: "AI Fusion Core cross-references reports with sensor feeds. Returns 94% High Confidence.",
        rainfall: 115,
        waterLevel: 4.6,
        zoneARisk: 96,
        zoneAStatus: "CRITICAL RISK",
        newIncident: null
      },
      {
        step: 5,
        title: "5. Update — Digital Twin Recalculation",
        desc: "Digital Twin risk map updates spatial hazard polygons and obstacle overlays.",
        rainfall: 120,
        waterLevel: 4.8,
        zoneARisk: 98,
        zoneAStatus: "CRITICAL RISK",
        newIncident: null
      },
      {
        step: 6,
        title: "6. Recommend — AI Action Deployment",
        desc: "AI Engine generates 3 actions: Evacuate Zone A, Deploy Rescue Boat Unit 2, Activate Shelter B.",
        rainfall: 120,
        waterLevel: 4.8,
        zoneARisk: 98,
        zoneAStatus: "CRITICAL RISK",
        newIncident: null
      },
      {
        step: 7,
        title: "7. Personalize — Citizen Guidance",
        desc: "Citizen App delivers personalized alert: 'Evacuate Zone A immediately. Route C is safest (12 mins).'",
        rainfall: 110,
        waterLevel: 4.7,
        zoneARisk: 95,
        zoneAStatus: "HIGH RISK",
        newIncident: null
      },
      {
        step: 8,
        title: "8. Ground Truth — Route Blockage Alert",
        desc: "Citizen reports: 'Route A Riverside Bridge is flooded under 1.4m of water!'",
        rainfall: 105,
        waterLevel: 4.7,
        zoneARisk: 95,
        zoneAStatus: "HIGH RISK",
        newIncident: {
          category: 'road',
          location: 'Riverside Bridge',
          description: 'Submerged bridge under 1.4m flowing water. Vehicles cannot pass.',
          trappedCount: 0,
          injuredCount: 0,
          hasPhoto: true,
          locationVerified: true
        }
      },
      {
        step: 9,
        title: "9. Adapt — Dynamic Route Recalculation",
        desc: "AI Safe-Route engine instantly marks Route A unsafe and reroutes evacuees via Elevated Highway Bypass (Route C).",
        rainfall: 95,
        waterLevel: 4.5,
        zoneARisk: 90,
        zoneAStatus: "HIGH RISK",
        newIncident: null
      },
      {
        step: 10,
        title: "10. Learn — Closed Loop Intelligence",
        desc: "Ground truth observations update the continuous decision cycle for future risk modeling.",
        rainfall: 80,
        waterLevel: 4.2,
        zoneARisk: 82,
        zoneAStatus: "HIGH RISK",
        newIncident: null
      }
    ];
  }

  setStep(stepNum) {
    if (stepNum < 1 || stepNum > 10) return;
    this.currentStep = stepNum;
    const stepData = this.steps[stepNum - 1];

    // Trigger state changes in app
    if (window.climateApp) {
      window.climateApp.applySimulationStep(stepData);
    }
  }

  nextStep() {
    let next = this.currentStep + 1;
    if (next > 10) next = 1;
    this.setStep(next);
  }
}

window.disasterSim = new DisasterSimulation();
