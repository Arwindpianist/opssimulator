import type { Model, RunSnapshot, SimFrame } from "./types"

export function captureRunSnapshot(model: Model, frame: SimFrame): RunSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    org: model.org,
    kpis: { ...frame.kpis },
    rules: { ...model.rules },
    shiftMode: model.shiftMode,
    departmentFriction: frame.departments.map((d) => ({
      name: d.name,
      rejected: d.rejected,
      health: d.health,
      escalationTier: d.escalationTier,
    })),
    poolSummary: frame.pools.map((p) => ({
      name: p.name,
      occupied: p.occupied,
      capacity: p.capacity,
      ghost: p.ghost,
      overflow: p.overflow,
    })),
  }
}

export function deltaPct(a: number, b: number): number {
  return Math.round(b - a)
}

export function formatDelta(delta: number, inverse = false): string {
  const good = inverse ? delta < 0 : delta > 0
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta}%${good ? "" : ""}`
}
