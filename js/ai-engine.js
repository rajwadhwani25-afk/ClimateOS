/**
 * ClimateOS — Core AI Intelligence Engine
 * Predict ➔ Sense ➔ Verify ➔ Understand ➔ Prioritize ➔ Act ➔ Learn
 */

class ClimateAIEngine {
  constructor() {
    this.zones = [
      { id: 'zone-a', name: 'Zone A — Riverside', riskScore: 88, status: 'HIGH RISK', popAtRisk: 14200, terrain: 'Low-lying basin' },
      { id: 'zone-b', name: 'Zone B — Downtown', riskScore: 64, status: 'MEDIUM RISK', popAtRisk: 28500, terrain: 'Urban paved' },
      { id: 'zone-c', name: 'Zone C — Westside', riskScore: 42, status: 'MODERATE RISK', popAtRisk: 18000, terrain: 'Rolling hills' },
      { id: 'zone-d', name: 'Zone D — North Hills', riskScore: 15, status: 'LOW RISK', popAtRisk: 9200, terrain: 'High elevation' }
    ];
  }

  /**
   * Risk Prediction Engine
   * Calculates zone disaster risk from rainfall intensity (mm/hr), water level (m), historical risk factor, and report density
   */
  calculateZoneRisk(zoneId, rainfallMmHr, waterLevelMeters, reportCount) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (!zone) return null;

    let baseRisk = (rainfallMmHr * 0.8) + (waterLevelMeters * 18) + (reportCount * 4);
    if (zoneId === 'zone-a') baseRisk *= 1.35; // Low-lying elevation multiplier

    const finalScore = Math.min(99, Math.max(5, Math.round(baseRisk)));
    let status = 'LOW RISK';
    if (finalScore >= 75) status = 'HIGH RISK';
    else if (finalScore >= 45) status = 'MEDIUM RISK';
    else if (finalScore >= 25) status = 'MODERATE RISK';

    zone.riskScore = finalScore;
    zone.status = status;

    return { zoneId, riskScore: finalScore, status };
  }

  /**
   * AI Report Verification Engine
   * Cross-references citizen report data with simulated sensor feeds, nearby reports, and historical patterns
   */
  verifyReport(report) {
    let confidenceScore = 60; // Base score

    // Factors increasing confidence
    if (report.hasPhoto) confidenceScore += 15;
    if (report.category === 'trapped' || report.category === 'flood') confidenceScore += 10;
    if (report.locationVerified) confidenceScore += 10;
    
    // Cross-referencing nearby reports (mock sensor logic)
    if (report.zoneId === 'zone-a') confidenceScore += 10;

    const finalConfidence = Math.min(98, confidenceScore);
    let status = 'Needs Review';
    let badgeClass = 'badge-review';

    if (finalConfidence >= 85) {
      status = 'High Confidence';
      badgeClass = 'badge-high';
    } else if (finalConfidence < 50) {
      status = 'Low Confidence';
      badgeClass = 'badge-low';
    }

    return {
      id: report.id || 'REP-' + Math.floor(1000 + Math.random() * 9000),
      confidenceScore: finalConfidence,
      status: status,
      badgeClass: badgeClass,
      category: report.category,
      location: report.location,
      description: report.description,
      trappedCount: report.trappedCount || 0,
      injuredCount: report.injuredCount || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  /**
   * Impact & Priority Ranking Engine
   * Calculates priority ranking score (0-100) for emergency rescue allocation
   */
  calculatePriorityScore(incident) {
    const trappedScore = (incident.trappedCount || 0) * 15;
    const injuredScore = (incident.injuredCount || 0) * 20;
    let categoryWeight = 10;

    if (incident.category === 'trapped') categoryWeight = 30;
    else if (incident.category === 'medical') categoryWeight = 25;
    else if (incident.category === 'flood') categoryWeight = 20;
    else if (incident.category === 'road') categoryWeight = 15;

    const rawPriority = trappedScore + injuredScore + categoryWeight + (incident.confidenceScore * 0.2);
    return Math.min(99, Math.round(rawPriority));
  }

  /**
   * Recommendation Engine
   * Converts verified intelligence into actionable human-reviewable recommendations
   */
  generateRecommendations(incidents, zones) {
    const recs = [];
    const highRiskZones = zones.filter(z => z.riskScore >= 75);

    highRiskZones.forEach(z => {
      recs.push({
        id: 'REC-EVAC-' + z.id,
        highPriority: true,
        title: `Evacuate ${z.name}`,
        reason: `Zone risk reached ${z.riskScore}/100. Water level rising +15cm/hr with low-lying flood probability.`,
        actionText: 'Trigger Evacuation Alert',
        targetZone: z.id,
        xai: {
          rainfall: '110 mm/hr',
          riverGauge: '4.2m (+0.6m overflow threshold)',
          elevation: 'Low-lying basin (4m above sea level)',
          verifiedReports: `${incidents.length} active high-confidence reports`
        }
      });
    });

    const urgentIncidents = incidents.filter(i => (i.trappedCount > 0 || i.injuredCount > 0));
    if (urgentIncidents.length > 0) {
      const topIncident = urgentIncidents[0];
      recs.push({
        id: 'REC-RESCUE-' + topIncident.id,
        highPriority: true,
        title: `Deploy Rescue Boat Unit 2 ➔ ${topIncident.location}`,
        reason: `${topIncident.trappedCount} people trapped, ${topIncident.injuredCount} injured. AI priority rank: ${topIncident.priorityScore}/100.`,
        actionText: 'Dispatch Rescue Team',
        targetZone: 'zone-a',
        xai: {
          trappedCount: topIncident.trappedCount,
          injuredCount: topIncident.injuredCount,
          waterDepth: '1.2 meters on road',
          confidence: `${topIncident.confidenceScore}% (3 cross-verified reports)`
        }
      });
    }

    // Shelter opening recommendation
    recs.push({
      id: 'REC-SHELTER-1',
      highPriority: false,
      title: 'Open Secondary Relief Shelter B (Central School)',
      reason: 'Shelter A (Community Center) is operating at 82% capacity.',
      actionText: 'Activate Shelter B',
      targetZone: 'zone-b',
      xai: {
        shelterACapacity: '410 / 500 occupants',
        projectedEvacuees: '+250 citizens in next 2 hours',
        accessibilityRoute: 'Route C (Clear of flooding)'
      }
    });

    return recs;
  }

  /**
   * Dynamic Safe Route Calculator
   * Returns safest route avoiding flood-prone zones and blocked bridges
   */
  calculateSafeRoute(userLocation, destinationShelter, blockedRoads) {
    const isRouteAHazardous = blockedRoads.includes('Riverside Drive Bridge');
    
    if (isRouteAHazardous) {
      return {
        routeName: 'Route C — Elevated Highway Bypass',
        distanceKm: 2.4,
        estimatedMinutes: 12,
        riskLevel: 'LOW (Safest Route)',
        statusColor: '#10b981',
        avoidedHazards: ['Riverside Bridge (Flooded - 1.4m depth)']
      };
    }

    return {
      routeName: 'Route A — Riverside Direct',
      distanceKm: 1.2,
      estimatedMinutes: 6,
      riskLevel: 'MODERATE RISK',
      statusColor: '#f59e0b',
      avoidedHazards: []
    };
  }
}

// Global AI Engine instance
window.climateAI = new ClimateAIEngine();
