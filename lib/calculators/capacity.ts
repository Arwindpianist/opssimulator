import type { CapacityState } from "./types"

export type CapacityResult = {
  onSiteHeadcount: number
  requiredWorkstations: number
  requiredParking: number
  commonAreaSeats: number
  siloedDesks: number
  netSpaceSaved: number
  congestionIndex: number
}

export function computeCapacity(s: CapacityState): CapacityResult {
  const field = clampPct(s.fieldPct) / 100
  const stagger = clampPct(s.hybridStaggerPct) / 100
  const share = Math.max(0.5, s.seatSharingRatio || 1)
  const parkElig = clampPct(s.parkingEligibilityPct) / 100
  const buffer = 1 + clampPct(s.peakBufferPct) / 100

  const onSiteHeadcount = Math.round(s.headcount * (1 - field) * (1 - stagger * 0.35))
  const requiredWorkstations = Math.ceil((onSiteHeadcount / share) * buffer)
  const requiredParking = Math.ceil(s.headcount * parkElig * (1 - field * 0.5) * buffer)
  const commonAreaSeats = Math.ceil(onSiteHeadcount * 0.22 * buffer)
  const siloedDesks = s.headcount
  const netSpaceSaved = Math.max(0, siloedDesks - requiredWorkstations)
  const congestionIndex = Math.round(clampPct(((onSiteHeadcount / Math.max(1, requiredWorkstations * share)) * 100)))

  return {
    onSiteHeadcount,
    requiredWorkstations,
    requiredParking,
    commonAreaSeats,
    siloedDesks,
    netSpaceSaved,
    congestionIndex,
  }
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n))
}

export function defaultCapacity(): CapacityState {
  return {
    headcount: 400,
    fieldPct: 28,
    hybridStaggerPct: 20,
    seatSharingRatio: 1.3,
    parkingEligibilityPct: 55,
    peakBufferPct: 12,
  }
}
