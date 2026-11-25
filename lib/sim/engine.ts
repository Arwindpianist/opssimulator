import {
  type AllocationMode,
  type Department,
  type DeptDemand,
  type EscalationTier,
  type Incident,
  type Influence,
  type Kpis,
  type Model,
  type Pool,
  type PoolStats,
  type SimFrame,
  type SlotState,
} from "./types"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function round(n: number) {
  return Math.round(n)
}

function influenceGhostBias(influence: Influence): number {
  if (influence === "High") return 0.22
  if (influence === "Medium") return 0.14
  return 0.08
}

/** Peak attendance multiplier for a department at a given hour. */
export function shiftMultiplier(
  hour: number,
  peakHour: number,
  shiftMode: Model["shiftMode"],
  deptIndex: number,
  openHour: number,
  closeHour: number,
): number {
  const span = Math.max(1, closeHour - openHour)
  if (hour < openHour || hour > closeHour) return 0.15

  if (shiftMode === "SinglePeak") {
    const dist = Math.abs(hour - peakHour)
    return clamp(1.05 - dist * 0.18, 0.35, 1.15)
  }

  if (shiftMode === "Staggered") {
    const offsetPeak = clamp(peakHour + (deptIndex % 3) - 1, openHour + 1, closeHour - 1)
    const dist = Math.abs(hour - offsetPeak)
    return clamp(1.0 - dist * 0.16, 0.4, 1.12)
  }

  // RotationalHybrid: alternate presence bands
  const band = Math.floor((hour - openHour) / Math.max(1, Math.floor(span / 3)))
  const onBand = deptIndex % 3 === band % 3
  return onBand ? 1.05 : 0.55
}

function isWorkstationLike(pool: Pool): boolean {
  const n = `${pool.name} ${pool.category}`.toLowerCase()
  return n.includes("workstation") || n.includes("desk") || n.includes("parking") || n.includes("bay") || n.includes("endpoint")
}

function isFieldPool(pool: Pool): boolean {
  const n = `${pool.name} ${pool.category}`.toLowerCase()
  return n.includes("field") || n.includes("mobile")
}

function poolWeight(pool: Pool, sync: boolean): number {
  if (isFieldPool(pool)) return sync ? 1.1 : 0.85
  if (isWorkstationLike(pool)) return sync ? 0.92 : 1.05
  return 0.7
}

function buildTiles(capacity: number, occupied: number, ghost: number, reclaimed: number): SlotState[] {
  const visual = Math.min(120, Math.max(16, capacity || 16))
  const scale = visual / Math.max(1, capacity)
  const occN = round(occupied * scale)
  const ghostN = round(ghost * scale)
  const reclaimN = round(reclaimed * scale)
  const tiles: SlotState[] = []
  for (let i = 0; i < visual; i++) {
    if (i < occN) tiles.push("occupied")
    else if (i < occN + ghostN) tiles.push("ghost")
    else if (i < occN + ghostN + reclaimN) tiles.push("reclaimed")
    else tiles.push("free")
  }
  return tiles
}

function allocatePool(
  mode: AllocationMode,
  capacity: number,
  demands: { deptId: string; demand: number }[],
  releasedShared: number,
): { allocated: Record<string, number>; rejected: Record<string, number>; unused: number; overflow: number } {
  const effective = Math.max(0, capacity + releasedShared)
  const allocated: Record<string, number> = {}
  const rejected: Record<string, number> = {}
  demands.forEach((d) => {
    allocated[d.deptId] = 0
    rejected[d.deptId] = 0
  })

  if (demands.length === 0) {
    return { allocated, rejected, unused: effective, overflow: 0 }
  }

  const totalDemand = demands.reduce((a, d) => a + d.demand, 0)

  if (mode === "Shared") {
    let remaining = effective
    // Priority: higher demand first for stable fill
    const ordered = [...demands].sort((a, b) => b.demand - a.demand)
    for (const d of ordered) {
      const take = Math.min(d.demand, remaining)
      allocated[d.deptId] = take
      rejected[d.deptId] = Math.max(0, d.demand - take)
      remaining -= take
    }
    const overflow = Math.max(0, totalDemand - effective)
    return { allocated, rejected, unused: Math.max(0, remaining), overflow }
  }

  // Siloed and Hybrid: fixed shares by demand weight (headcount proxy)
  const shareBase = demands.reduce((a, d) => a + Math.max(1, d.demand), 0)
  let used = 0
  const leftovers: number[] = []

  for (const d of demands) {
    const share = Math.floor((Math.max(1, d.demand) / shareBase) * effective)
    const take = Math.min(d.demand, share)
    allocated[d.deptId] = take
    rejected[d.deptId] = Math.max(0, d.demand - take)
    used += take
    leftovers.push(Math.max(0, share - take))
  }

  let freeBand = leftovers.reduce((a, n) => a + n, 0) + Math.max(0, effective - used - leftovers.reduce((a, n) => a + n, 0))

  if (mode === "Hybrid" && freeBand > 0) {
    for (const d of demands) {
      if (rejected[d.deptId] <= 0 || freeBand <= 0) continue
      const extra = Math.min(rejected[d.deptId], freeBand)
      allocated[d.deptId] += extra
      rejected[d.deptId] -= extra
      freeBand -= extra
      used += extra
    }
  }

  // Siloed: freeBand seats stay empty even while others reject
  const overflow = Object.values(rejected).reduce((a, n) => a + n, 0)
  const unused = mode === "Siloed" ? Math.max(0, effective - used) : Math.max(0, freeBand)
  return { allocated, rejected, unused, overflow }
}

function tierFromBreaches(breaches: number, escalationArmed: boolean): EscalationTier {
  if (!escalationArmed) return 0
  if (breaches >= 5) return 4
  if (breaches >= 3) return 3
  if (breaches >= 2) return 2
  if (breaches >= 1) return 1
  return 0
}

export type EngineInput = {
  model: Model
  hour: number
  tick: number
  incidents: Incident[]
  ghostPressure: number
  reopenPressure: number
}

export function recompute(input: EngineInput): SimFrame {
  const { model, hour, tick } = input
  const { rules, departments, pools, shiftMode, openHour, closeHour } = model
  const preventiveBoost = 1 + rules.preventiveCapacityPct / 200

  // Per-dept on-site and field
  const deptRaw = departments.map((d, i) => {
    const mult = shiftMultiplier(hour, d.peakArrivalWindow, shiftMode, i, openHour, closeHour)
    const onSiteBase = d.headcount * (1 - d.fieldDutyRatio / 100) * mult
    const fieldDeployed = d.headcount * (d.fieldDutyRatio / 100) * (0.85 + 0.1 * Math.sin((hour + i) * 0.4))
    const onSite = Math.max(0, onSiteBase)
    return { dept: d, index: i, onSite, fieldDeployed }
  })

  const totalOnSite = deptRaw.reduce((a, d) => a + d.onSite, 0)
  const totalField = deptRaw.reduce((a, d) => a + d.fieldDeployed, 0)
  const totalHeadcount = departments.reduce((a, d) => a + d.headcount, 0)

  // Sync releases workstation/parking demand from field staff into shared pool capacity
  const syncRelease = rules.sync ? round(totalField * 0.55) : 0

  const ghostEventBoost = model.events.some((e) => /ghost|hoard/i.test(e.title)) ? 0.12 : 0
  const surgeBoost = model.events.some((e) => /surge/i.test(e.title)) ? 0.08 : 0

  const poolStats: PoolStats[] = []
  const deptAllocatedTotal: Record<string, number> = {}
  const deptRejectedTotal: Record<string, number> = {}
  const deptUnusedTotal: Record<string, number> = {}
  departments.forEach((d) => {
    deptAllocatedTotal[d.id] = 0
    deptRejectedTotal[d.id] = 0
    deptUnusedTotal[d.id] = 0
  })

  let totalOverflow = 0
  let totalOccupied = 0
  let totalGhost = 0
  let totalBooked = 0
  let totalEffectiveCap = 0

  for (const pool of pools) {
    const weight = poolWeight(pool, rules.sync)
    const released = isWorkstationLike(pool) && rules.sync ? round(syncRelease * (pool.capacity / Math.max(1, pools.filter(isWorkstationLike).reduce((a, p) => a + p.capacity, 0)))) : 0
    const effectiveCapacity = round(pool.capacity * preventiveBoost + released)

    const demands = deptRaw.map(({ dept, onSite, fieldDeployed }) => {
      let demand = onSite * weight
      if (isFieldPool(pool)) demand = fieldDeployed * 0.9
      if (isWorkstationLike(pool) && rules.sync) {
        // Field-deployed staff leave HQ seats
        demand = Math.max(0, onSite * weight - fieldDeployed * 0.35)
      }
      // Siloed hoarding inflates booked (ghost) demand
      const ghostBias = influenceGhostBias(dept.stakeholderInfluence) + ghostEventBoost + input.ghostPressure
      const bookInflation = pool.allocationMode === "Siloed" ? 1 + ghostBias : 1 + ghostBias * 0.45
      return { deptId: dept.id, demand: demand * bookInflation * (1 + surgeBoost) }
    })

    const allocation = allocatePool(pool.allocationMode, effectiveCapacity, demands, 0)

    // Physical occupancy vs booked (ghost)
    let booked = round(demands.reduce((a, d) => a + d.demand, 0))
    let occupied = round(Object.values(allocation.allocated).reduce((a, n) => a + n, 0) * (rules.sync ? 0.94 : 0.88))
    occupied = Math.min(occupied, effectiveCapacity)

    // Ghost = booked paper seats that are physically empty within allocated band
    let ghost = Math.max(0, Math.min(booked, effectiveCapacity) - occupied)
    if (!rules.sync) ghost = round(ghost * 1.35 + effectiveCapacity * 0.04)
    ghost = Math.min(ghost, Math.max(0, effectiveCapacity - occupied))

    // Auto-release timer converts ghost to reclaimed and absorbs overflow
    let reclaimed = 0
    let poolOverflow = allocation.overflow
    if (rules.noShowMinutes > 0) {
      const releaseFrac = clamp((tick + 1) / Math.max(1, rules.noShowMinutes / 5), 0, 0.85)
      reclaimed = round(ghost * releaseFrac)
      ghost = Math.max(0, ghost - reclaimed)
      const absorb = Math.min(reclaimed, poolOverflow)
      poolOverflow = Math.max(0, poolOverflow - absorb)
      occupied = Math.min(effectiveCapacity, occupied + absorb)
    }
    totalOverflow += poolOverflow

    for (const d of demands) {
      deptAllocatedTotal[d.deptId] += allocation.allocated[d.deptId] ?? 0
      deptRejectedTotal[d.deptId] += allocation.rejected[d.deptId] ?? 0
    }
    // Siloed unused seats attributed proportionally
    if (pool.allocationMode === "Siloed" && allocation.unused > 0 && departments.length) {
      const per = allocation.unused / departments.length
      departments.forEach((d) => {
        deptUnusedTotal[d.id] += per
      })
    }

    const available = Math.max(0, effectiveCapacity - occupied - ghost - reclaimed)
    const overflow = Math.max(0, booked - effectiveCapacity)

    poolStats.push({
      poolId: pool.id,
      name: pool.name,
      category: pool.category,
      capacity: pool.capacity,
      effectiveCapacity,
      booked,
      occupied,
      ghost,
      reclaimed,
      available,
      overflow,
      allocationMode: pool.allocationMode,
      tiles: buildTiles(pool.capacity, occupied, ghost, reclaimed),
    })

    totalOccupied += occupied
    totalGhost += ghost
    totalBooked += Math.max(booked, occupied + ghost)
    totalEffectiveCap += effectiveCapacity
  }

  // Incidents / SLA
  const openIncidents = input.incidents.filter((i) => !i.closed)
  const closed = input.incidents.filter((i) => i.closed)
  const reopened = input.incidents.filter((i) => i.reopened).length
  const premature = closed.filter((i) => i.prematureClose).length
  const breached = input.incidents.filter((i) => i.breached).length

  let slaCompliance = 100
  if (input.incidents.length > 0) {
    const met = input.incidents.filter((i) => i.closed && !i.breached).length
    const openOk = openIncidents.filter((i) => !i.breached).length
    slaCompliance = round(((met + openOk) / input.incidents.length) * 100)
  } else {
    // Baseline SLA from operational pressure
    const pressure = totalOverflow / Math.max(1, totalOnSite)
    slaCompliance = round(clamp(94 - pressure * 40 - totalGhost / Math.max(1, totalBooked) * 25, 48, 99))
  }

  // Anti-gaming: premature closes inflate SLA but raise reopen
  let reopenRate = 0
  let maskedSlaBoost = 0
  if (!rules.antiGaming) {
    maskedSlaBoost = Math.min(18, premature * 4 + Math.floor(tick / 3))
    slaCompliance = clamp(slaCompliance + maskedSlaBoost, 0, 99)
    reopenRate = clamp(8 + premature * 6 + input.reopenPressure * 100, 0, 80)
  } else {
    reopenRate = clamp(reopened / Math.max(1, closed.length + reopened) * 100 + input.reopenPressure * 40, 0, 80)
    slaCompliance = clamp(slaCompliance - reopenRate * 0.35, 40, 99)
  }

  if (rules.escalation) {
    slaCompliance = clamp(slaCompliance + 2, 0, 99)
  }
  if (rules.checklist) {
    slaCompliance = clamp(slaCompliance + 1, 0, 99)
  }

  const trueDowntimeMinutes = input.incidents.reduce((a, i) => a + i.elapsedMinutes + (rules.allowClockPause ? i.pausedMinutes : 0), 0)

  const frictionRejection = totalOnSite <= 0
    ? 0
    : round(clamp((totalOverflow / Math.max(1, totalOnSite + totalOverflow)) * 100 + (rules.antiGaming ? 0 : 6), 0, 99))

  const netUtilization = totalEffectiveCap <= 0 ? 0 : round(clamp((totalOccupied / totalEffectiveCap) * 100, 0, 100))
  const ghostBooking = totalBooked <= 0 ? 0 : round(clamp((totalGhost / totalBooked) * 100, 0, 99))

  const vendorBreaches = breached + (frictionRejection > 35 ? 1 : 0) + (ghostBooking > 30 ? 1 : 0)
  const vendorEscalation = tierFromBreaches(vendorBreaches, rules.escalation)

  const deptViews: DeptDemand[] = deptRaw.map(({ dept, onSite, fieldDeployed }) => {
    const rejected = round(deptRejectedTotal[dept.id] ?? 0)
    const allocated = round(deptAllocatedTotal[dept.id] ?? 0)
    const unusedSeats = round(deptUnusedTotal[dept.id] ?? 0)
    const breachesForDept = input.incidents.filter((i) => i.deptId === dept.id && i.breached).length
    const escalationTier = tierFromBreaches(breachesForDept + (rejected > 12 ? 1 : 0), rules.escalation)
    let health: DeptDemand["health"] = "HEALTHY"
    if (escalationTier >= 3 || rejected > 20) health = "CRITICAL"
    else if (escalationTier >= 1 || rejected > 8) health = "WATCH"

    const demandByPool: Record<string, number> = {}
    pools.forEach((p) => {
      demandByPool[p.id] = round(onSite * poolWeight(p, rules.sync))
    })

    return {
      deptId: dept.id,
      name: dept.name,
      headcount: dept.headcount,
      onSite: round(onSite),
      fieldDeployed: round(fieldDeployed),
      demandByPool,
      allocated,
      rejected,
      unusedSeats,
      congested: rejected > 8 || onSite / Math.max(1, dept.headcount) > 0.9,
      health,
      escalationTier,
    }
  })

  const kpis: Kpis = {
    netUtilization,
    frictionRejection,
    slaCompliance: round(slaCompliance),
    ghostBooking,
    reopenRate: round(reopenRate),
    onSite: round(totalOnSite),
    demand: totalHeadcount,
    overflowQueue: round(totalOverflow),
    totalCapacity: round(totalEffectiveCap),
    trueDowntimeMinutes: round(trueDowntimeMinutes),
    maskedSlaBoost,
  }

  return {
    hour,
    tick,
    departments: deptViews,
    pools: poolStats,
    kpis,
    incidents: input.incidents,
    vendorEscalation,
  }
}

export function advanceIncidents(
  incidents: Incident[],
  hour: number,
  rules: Model["rules"],
  minutesPerTick: number,
): Incident[] {
  return incidents.map((inc) => {
    if (inc.closed) return inc
    const next = { ...inc }
    if (rules.allowClockPause && next.paused) {
      next.pausedMinutes += minutesPerTick
      // Masked: deadline clock does not advance while paused
    } else {
      next.elapsedMinutes += minutesPerTick
      if (next.elapsedMinutes >= next.deadlineMinutes) {
        next.breached = true
      }
    }
    // Auto-close some P3/P4 as premature when anti-gaming is off
    if (!rules.antiGaming && !next.closed && next.severity !== "P1" && next.elapsedMinutes > next.deadlineMinutes * 0.35) {
      if ((hour + next.elapsedMinutes) % 7 === 0) {
        next.closed = true
        next.prematureClose = true
      }
    }
    // With anti-gaming, premature closes reopen
    if (rules.antiGaming && next.prematureClose && next.closed) {
      next.closed = false
      next.reopened = true
      next.prematureClose = false
      next.breached = true
    }
    return next
  })
}

export function escalateDepartments(model: Model, frame: SimFrame): Department[] {
  return model.departments.map((d) => {
    const view = frame.departments.find((x) => x.deptId === d.id)
    return view ? { ...d, escalationTier: view.escalationTier } : d
  })
}

export const ESCALATION_LABELS: Record<EscalationTier, string> = {
  0: "Tier 0 Healthy",
  1: "Tier 1 Warning",
  2: "Tier 2 Corrective Plan",
  3: "Tier 3 Penalty / Reallocation",
  4: "Tier 4 Executive Review",
}
