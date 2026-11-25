import { clamp, newId, normalizeWeights, weightedAverage } from "@/lib/shared/weights"
import type { ScorecardState } from "./types"
import type { EscalationTier } from "@/lib/sim/types"

export function criterionPercent(c: ScorecardState["criteria"][0]): number {
  if (c.scale === "five") return clamp((c.score / 5) * 100, 0, 100)
  return clamp(c.score, 0, 100)
}

export function scorecardTotal(state: ScorecardState): number {
  return weightedAverage(state.criteria.map((c) => ({ weightPct: c.weightPct, score: criterionPercent(c) })))
}

export function scorecardTier(total: number): EscalationTier {
  if (total >= 85) return 0
  if (total >= 75) return 1
  if (total >= 65) return 2
  if (total >= 55) return 3
  return 4
}

export const TIER_LABELS: Record<EscalationTier, string> = {
  0: "Tier 0: Compliant",
  1: "Tier 1: Warning",
  2: "Tier 2: Corrective Action Plan",
  3: "Tier 3: Fee Deduction / Reallocation",
  4: "Tier 4: Executive Review",
}

export function penaltyAmount(total: number, perTier: number): number {
  const tier = scorecardTier(total)
  return Math.max(0, tier) * perTier
}

export function defaultScorecard(): ScorecardState {
  return {
    subject: "Vendor Alpha / Facilities Ops",
    penaltyPerTier: 2500,
    criteria: [
      { id: newId(), name: "SLA Response & Resolution", weightPct: 25, score: 4, scale: "five" },
      { id: newId(), name: "Preventive Maintenance / Policy Adherence", weightPct: 20, score: 3, scale: "five" },
      { id: newId(), name: "HSE & Compliance", weightPct: 20, score: 5, scale: "five" },
      { id: newId(), name: "First-Time Fix / Quality", weightPct: 20, score: 3, scale: "five" },
      { id: newId(), name: "Reporting & Comms", weightPct: 15, score: 4, scale: "five" },
    ],
  }
}

export { normalizeWeights }
