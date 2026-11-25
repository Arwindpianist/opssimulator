import { defaultCapacity } from "./capacity"
import { defaultStakeholders } from "./power-interest"
import { defaultRaci } from "./raci"
import { defaultScorecard } from "./scorecard"
import { defaultSla } from "./sla-clock"
import type { CalculatorsState } from "./types"
import { balancedWeightageKpis } from "./weightage"

export const CALCULATORS_KEY = "opsim-calculators"

export function defaultCalculatorsState(): CalculatorsState {
  return {
    version: 1,
    weightage: balancedWeightageKpis(),
    raci: defaultRaci(),
    scorecard: defaultScorecard(),
    sla: defaultSla(),
    capacity: defaultCapacity(),
    stakeholders: defaultStakeholders(),
    updatedAt: new Date().toISOString(),
  }
}

export function loadCalculators(): CalculatorsState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CALCULATORS_KEY)
    if (!raw) return null
    return migrateCalculators(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveCalculators(state: CalculatorsState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CALCULATORS_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }))
  } catch {
    /* ignore */
  }
}

export function migrateCalculators(raw: unknown): CalculatorsState {
  const base = defaultCalculatorsState()
  if (!raw || typeof raw !== "object") return base
  const m = raw as Partial<CalculatorsState>
  return {
    version: 1,
    weightage: Array.isArray(m.weightage) ? m.weightage : base.weightage,
    raci: m.raci ?? base.raci,
    scorecard: m.scorecard ?? base.scorecard,
    sla: m.sla ?? base.sla,
    capacity: m.capacity ?? base.capacity,
    stakeholders: Array.isArray(m.stakeholders) ? m.stakeholders : base.stakeholders,
    updatedAt: String(m.updatedAt ?? new Date().toISOString()),
  }
}

export function exportCalculatorsJson(state: CalculatorsState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "opssim-calculators.json"
  a.click()
  URL.revokeObjectURL(url)
}
