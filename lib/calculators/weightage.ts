import { clamp, newId, normalizeWeights, sumWeights, weightedAverage } from "@/lib/shared/weights"
import type { WeightageKpi } from "./types"

export function kpiWeightedScore(kpi: WeightageKpi): number {
  if (!kpi.subs.length) return 0
  return weightedAverage(
    kpi.subs.map((s) => ({
      weightPct: s.weightPct,
      score: s.target <= 0 ? 0 : clamp((s.actual / s.target) * 100, 0, 120),
    })),
  )
}

export function compositeIndex(kpis: WeightageKpi[]): number {
  if (!kpis.length) return 0
  return weightedAverage(kpis.map((k) => ({ weightPct: k.weightPct, score: Math.min(100, kpiWeightedScore(k)) })))
}

export function antiGamingAlerts(kpis: WeightageKpi[]): string[] {
  const alerts: string[] = []
  for (const k of kpis) {
    const score = kpiWeightedScore(k)
    if (score > 85 && k.counterValue > k.counterThreshold) {
      alerts.push(
        `${k.name}: score ${Math.round(score)}% while ${k.counterMetricName || "counter-metric"} at ${k.counterValue}% (threshold ${k.counterThreshold}%)`,
      )
    }
  }
  return alerts
}

function mk(
  name: string,
  weightPct: number,
  counterMetricName: string,
  counterValue: number,
  counterThreshold: number,
  subs: [string, number, number, number][],
): WeightageKpi {
  return {
    id: newId(),
    name,
    weightPct,
    counterMetricName,
    counterValue,
    counterThreshold,
    subs: subs.map(([n, w, a, t]) => ({ id: newId(), name: n, weightPct: w, actual: a, target: t })),
  }
}

export function balancedWeightageKpis(): WeightageKpi[] {
  return [
    mk("Space Utilization", 20, "Arrival Rejection Rate", 18, 12, [
      ["Desk Occupancy", 40, 82, 85],
      ["Ghost Booking Rate", 30, 16, 10],
      ["Parking Overflow", 30, 9, 8],
    ]),
    mk("SLA Reliability", 25, "Reopen Rate", 14, 10, [
      ["On-Time Close", 50, 88, 90],
      ["P1 Response", 50, 93, 95],
    ]),
    mk("Preventive Maintenance", 20, "Reactive Backlog", 22, 15, [
      ["PM Completion", 60, 78, 85],
      ["Critical Assets Up", 40, 96, 98],
    ]),
    mk("HSE Compliance", 20, "Near-Miss Lag Days", 6, 3, [
      ["Training Complete", 50, 94, 98],
      ["Findings Closed", 50, 90, 95],
    ]),
    mk("Stakeholder CSAT", 15, "Complaint Reopen Rate", 11, 8, [
      ["CSAT Index", 60, 84, 85],
      ["Complaint Cycle", 40, 70, 80],
    ]),
  ]
}

export const WEIGHTAGE_PRESETS: Record<string, { label: string; kpis: () => WeightageKpi[] }> = {
  balanced: {
    label: "Balanced Ops",
    kpis: () => balancedWeightageKpis(),
  },
  space: {
    label: "Space & Manpower Focus",
    kpis: () =>
      normalizeWeights(
        balancedWeightageKpis().map((k) => ({
          ...k,
          weightPct: k.name.includes("Space") ? 40 : k.name.includes("SLA") ? 15 : 15,
        })),
      ),
  },
  vendor: {
    label: "Vendor & SLA Governance",
    kpis: () =>
      normalizeWeights(
        balancedWeightageKpis().map((k) => ({
          ...k,
          weightPct: k.name.includes("SLA") ? 40 : k.name.includes("Preventive") ? 25 : 12,
        })),
      ),
  },
  hse: {
    label: "HSE & Compliance First",
    kpis: () =>
      normalizeWeights(
        balancedWeightageKpis().map((k) => ({
          ...k,
          weightPct: k.name.includes("HSE") ? 40 : k.name.includes("SLA") ? 20 : 13,
        })),
      ),
  },
}

export { sumWeights, normalizeWeights }
