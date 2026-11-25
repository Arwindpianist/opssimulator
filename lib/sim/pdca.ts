import { newId, type Kpis, type PdcaEntry } from "./types"

export const KPI_THRESHOLDS = {
  netUtilization: { redLow: 45, redHigh: 96, label: "Net Utilization %" },
  frictionRejection: { redHigh: 28, label: "Friction / Rejection %" },
  slaCompliance: { redLow: 80, label: "SLA Compliance %" },
  ghostBooking: { redHigh: 22, label: "Ghost Booking %" },
  reopenRate: { redHigh: 12, label: "Repeat Fault / Reopen Rate %" },
} as const

type ThresholdKey = keyof typeof KPI_THRESHOLDS

function entryFor(kpi: ThresholdKey, value: number, threshold: number, hour: number): PdcaEntry {
  const label = KPI_THRESHOLDS[kpi].label
  return {
    id: newId(),
    createdAt: `${String(hour).padStart(2, "0")}:00`,
    kpi: label,
    value,
    threshold,
    plan: `Stabilize ${label} below red flag within one operating day.`,
    doStep: `Apply governance levers (sync, auto-release, allocation, escalation) targeting ${label}.`,
    check: `Recheck ${label} after next simulated hour; target ${threshold}.`,
    act: `Lock improved policy set into 30-60-90 rollout and assign RACI Accountable owner.`,
  }
}

export function detectPdcaBreaches(kpis: Kpis, hour: number, existing: PdcaEntry[]): PdcaEntry[] {
  const additions: PdcaEntry[] = []
  const recent = new Set(existing.slice(0, 8).map((e) => e.kpi))

  const util = kpis.netUtilization
  if ((util < KPI_THRESHOLDS.netUtilization.redLow || util > KPI_THRESHOLDS.netUtilization.redHigh) && !recent.has(KPI_THRESHOLDS.netUtilization.label)) {
    const threshold = util < KPI_THRESHOLDS.netUtilization.redLow ? KPI_THRESHOLDS.netUtilization.redLow : KPI_THRESHOLDS.netUtilization.redHigh
    additions.push(entryFor("netUtilization", util, threshold, hour))
  }
  if (kpis.frictionRejection > KPI_THRESHOLDS.frictionRejection.redHigh && !recent.has(KPI_THRESHOLDS.frictionRejection.label)) {
    additions.push(entryFor("frictionRejection", kpis.frictionRejection, KPI_THRESHOLDS.frictionRejection.redHigh, hour))
  }
  if (kpis.slaCompliance < KPI_THRESHOLDS.slaCompliance.redLow && !recent.has(KPI_THRESHOLDS.slaCompliance.label)) {
    additions.push(entryFor("slaCompliance", kpis.slaCompliance, KPI_THRESHOLDS.slaCompliance.redLow, hour))
  }
  if (kpis.ghostBooking > KPI_THRESHOLDS.ghostBooking.redHigh && !recent.has(KPI_THRESHOLDS.ghostBooking.label)) {
    additions.push(entryFor("ghostBooking", kpis.ghostBooking, KPI_THRESHOLDS.ghostBooking.redHigh, hour))
  }
  if (kpis.reopenRate > KPI_THRESHOLDS.reopenRate.redHigh && !recent.has(KPI_THRESHOLDS.reopenRate.label)) {
    additions.push(entryFor("reopenRate", kpis.reopenRate, KPI_THRESHOLDS.reopenRate.redHigh, hour))
  }
  return additions
}
