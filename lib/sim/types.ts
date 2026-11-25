export type ShiftMode = "SinglePeak" | "Staggered" | "RotationalHybrid"
export type AllocationMode = "Siloed" | "Shared" | "Hybrid"
export type Influence = "High" | "Medium" | "Low"
export type RaciLetter = "R" | "A" | "C" | "I"
export type Severity = "P1" | "P2" | "P3" | "P4" | "INFO"
export type SlotState = "occupied" | "ghost" | "reclaimed" | "free"
export type EscalationTier = 0 | 1 | 2 | 3 | 4

export const WORKFLOWS = [
  "capacity-allocation",
  "incident-response",
  "booking-release",
  "vendor-escalation",
  "change-window",
] as const

export type WorkflowId = (typeof WORKFLOWS)[number]

export type Department = {
  id: string
  name: string
  headcount: number
  fieldDutyRatio: number
  peakArrivalWindow: number
  priorityTier: number
  stakeholderInfluence: Influence
  escalationTier: EscalationTier
}

export type Pool = {
  id: string
  name: string
  category: string
  capacity: number
  allocationMode: AllocationMode
}

export type Person = {
  id: string
  name: string
  role: string
  assignments: Partial<Record<WorkflowId, RaciLetter | null>>
}

export type SimEvent = {
  id: string
  title: string
  detail: string
  time: string
  severity: Severity
}

export type Incident = {
  id: string
  title: string
  severity: Severity
  deptId: string | null
  createdHour: number
  deadlineMinutes: number
  elapsedMinutes: number
  paused: boolean
  pausedMinutes: number
  closed: boolean
  prematureClose: boolean
  reopened: boolean
  breached: boolean
}

export type PdcaEntry = {
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

export type Rules = {
  checklist: boolean
  sync: boolean
  recovery: boolean
  escalation: boolean
  antiGaming: boolean
  allowClockPause: boolean
  preventiveCapacityPct: number
  noShowMinutes: number
}

export type Model = {
  org: string
  openHour: number
  closeHour: number
  shiftMode: ShiftMode
  hours: number
  departments: Department[]
  pools: Pool[]
  people: Person[]
  rules: Rules
  events: SimEvent[]
  pdcaLog: PdcaEntry[]
}

export type DeptDemand = {
  deptId: string
  name: string
  headcount: number
  onSite: number
  fieldDeployed: number
  demandByPool: Record<string, number>
  allocated: number
  rejected: number
  unusedSeats: number
  congested: boolean
  health: "HEALTHY" | "WATCH" | "CRITICAL"
  escalationTier: EscalationTier
}

export type PoolStats = {
  poolId: string
  name: string
  category: string
  capacity: number
  effectiveCapacity: number
  booked: number
  occupied: number
  ghost: number
  reclaimed: number
  available: number
  overflow: number
  allocationMode: AllocationMode
  tiles: SlotState[]
}

export type Kpis = {
  netUtilization: number
  frictionRejection: number
  slaCompliance: number
  ghostBooking: number
  reopenRate: number
  onSite: number
  demand: number
  overflowQueue: number
  totalCapacity: number
  trueDowntimeMinutes: number
  maskedSlaBoost: number
}

export type SimFrame = {
  hour: number
  tick: number
  departments: DeptDemand[]
  pools: PoolStats[]
  kpis: Kpis
  incidents: Incident[]
  vendorEscalation: EscalationTier
}

export type RunSnapshot = {
  capturedAt: string
  org: string
  kpis: Kpis
  rules: Rules
  shiftMode: ShiftMode
  departmentFriction: { name: string; rejected: number; health: string; escalationTier: EscalationTier }[]
  poolSummary: { name: string; occupied: number; capacity: number; ghost: number; overflow: number }[]
}

export type Speed = "1x" | "5x" | "30d"

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
