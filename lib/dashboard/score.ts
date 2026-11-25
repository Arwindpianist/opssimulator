import { weightedAverage } from "@/lib/shared/weights"
import type { DashboardBlueprint, DashboardKpi, WalkthroughPrinciple } from "./types"
import { newId } from "@/lib/shared/weights"
import type { DashboardPdca } from "./types"

export function subMetricScore(m: { value: number; target: number }): number {
  if (m.target === 0) return m.value <= 0 ? 100 : Math.max(0, 100 - m.value * 5)
  // Higher-is-better by default when value tracks toward target
  const ratio = (m.value / m.target) * 100
  return Math.round(Math.max(0, Math.min(120, ratio)) * 10) / 10
}

export function kpiFaceScore(kpi: DashboardKpi): number {
  if (!kpi.subMetrics.length) return 0
  return weightedAverage(
    kpi.subMetrics.map((m) => ({
      weightPct: m.weightPct,
      score: Math.min(100, subMetricScore(m)),
    })),
  )
}

export function overallDashboardScore(blueprint: DashboardBlueprint): number {
  if (!blueprint.kpis.length) return 0
  return weightedAverage(
    blueprint.kpis.map((k) => ({
      weightPct: k.weightPct,
      score: kpiFaceScore(k),
    })),
  )
}

export function walkthroughProgress(blueprint: DashboardBlueprint): Record<WalkthroughPrinciple, boolean> {
  const kpis = blueprint.kpis
  const hasLeading = kpis.some((k) => k.indicatorType === "Leading")
  const hasLagging = kpis.some((k) => k.indicatorType === "Lagging")
  const antiGaming = kpis.length > 0 && kpis.every((k) => k.antiGamingCounter.trim().length > 0)
  const formulasOwners =
    kpis.length > 0 &&
    kpis.every((k) => k.owner.trim() && k.dataSource.trim() && k.subMetrics.every((m) => m.formula.trim()))
  const roleTailored = Boolean(blueprint.persona && blueprint.roleDepartment.trim())
  const kpiWeights = kpis.reduce((a, k) => a + k.weightPct, 0)
  const balancedWeights = Math.abs(kpiWeights - 100) <= 0.5 && kpis.length > 0
  const pdcaReady = kpis.some((k) => k.redFlag > 0 && k.target > 0)
  return {
    leadingLagging: hasLeading && hasLagging,
    antiGaming,
    formulasOwners,
    roleTailored,
    balancedWeights,
    pdcaReady,
  }
}

export function detectDashboardPdca(blueprint: DashboardBlueprint): DashboardPdca[] {
  const adds: DashboardPdca[] = []
  const recent = new Set(blueprint.pdcaLog.slice(0, 10).map((e) => e.kpi))
  for (const k of blueprint.kpis) {
    const score = kpiFaceScore(k)
    if (score < k.redFlag && !recent.has(k.name)) {
      adds.push({
        id: newId(),
        createdAt: new Date().toISOString().slice(11, 16),
        kpi: k.name,
        value: score,
        threshold: k.redFlag,
        plan: `Restore ${k.name} above red flag ${k.redFlag}%.`,
        doStep: `Assign ${k.owner} to correct drivers and pair with ${k.antiGamingCounter || "counter-metric"}.`,
        check: `Recheck face score and sub-metrics at next ${k.cadence.toLowerCase()} review.`,
        act: "Lock improved controls into SOP and 30-60-90 rollout.",
      })
    }
  }
  return adds
}
