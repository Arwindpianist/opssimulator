export type WeightageSub = {
  id: string
  name: string
  weightPct: number
  actual: number
  target: number
  isCounterMetric?: boolean
  counterThreshold?: number
}

export type WeightageKpi = {
  id: string
  name: string
  weightPct: number
  counterMetricName: string
  counterValue: number
  counterThreshold: number
  subs: WeightageSub[]
}

export type RaciLetter = "R" | "A" | "C" | "I" | "-"

export type RaciMatrix = {
  id: string
  title: string
  steps: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  cells: Record<string, RaciLetter>
}

export type ScorecardCriterion = {
  id: string
  name: string
  weightPct: number
  score: number
  scale: "percent" | "five"
}

export type ScorecardState = {
  subject: string
  criteria: ScorecardCriterion[]
  penaltyPerTier: number
}

export type SlaClockState = {
  totalIncidents: number
  metOnTime: number
  downtimeMinutes: number
  pausedMinutes: number
  firstTimeFix: number
}

export type CapacityState = {
  headcount: number
  fieldPct: number
  hybridStaggerPct: number
  seatSharingRatio: number
  parkingEligibilityPct: number
  peakBufferPct: number
}

export type Stakeholder = {
  id: string
  name: string
  power: number
  interest: number
}

export type CalculatorsState = {
  version: 1
  weightage: WeightageKpi[]
  raci: RaciMatrix
  scorecard: ScorecardState
  sla: SlaClockState
  capacity: CapacityState
  stakeholders: Stakeholder[]
  updatedAt: string
}

export type CalcTab =
  | "weightage"
  | "raci"
  | "scorecard"
  | "sla"
  | "capacity"
  | "power"
  | "summary"
