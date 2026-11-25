export type AudiencePersona = "Supervisor" | "OpsManager" | "Executive"
export type ReviewCadence = "Daily" | "Weekly" | "Monthly" | "Quarterly"
export type IndicatorType = "Leading" | "Lagging"

export type WalkthroughPrinciple =
  | "leadingLagging"
  | "antiGaming"
  | "formulasOwners"
  | "roleTailored"
  | "balancedWeights"
  | "pdcaReady"

export type SubMetric = {
  id: string
  name: string
  formula: string
  value: number
  target: number
  status: "ok" | "watch" | "breach"
  weightPct: number
}

export type DashboardKpi = {
  id: string
  name: string
  owner: string
  target: number
  redFlag: number
  dataSource: string
  cadence: ReviewCadence
  indicatorType: IndicatorType
  antiGamingCounter: string
  weightPct: number
  subMetrics: SubMetric[]
}

export type DashboardPdca = {
  id: string
  createdAt: string
  kpi: string
  value: number
  threshold: number
  plan: string
  doStep: string
  check: string
  act: string
}

export type DashboardBlueprint = {
  version: 1
  title: string
  persona: AudiencePersona
  cadence: ReviewCadence
  roleDepartment: string
  kpis: DashboardKpi[]
  pdcaLog: DashboardPdca[]
  updatedAt: string
}

export type WeightPresetId =
  | "balanced"
  | "spaceCrunch"
  | "slaVendor"
  | "safetyFirst"
  | "execRisk"
