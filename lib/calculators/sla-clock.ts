import { clamp } from "@/lib/shared/weights"
import type { SlaClockState } from "./types"

export type SlaClockResult = {
  reportedSla: number
  trueSla: number
  mttr: number
  firstTimeFixRate: number
  distortion: number
}

export function computeSlaClock(s: SlaClockState): SlaClockResult {
  const total = Math.max(0, s.totalIncidents)
  const met = Math.min(total, Math.max(0, s.metOnTime))
  const reportedSla = total <= 0 ? 0 : clamp((met / total) * 100, 0, 100)

  // Strict: paused minutes inflate effective downtime against service window proxy
  const effectiveDowntime = Math.max(0, s.downtimeMinutes)
  const masked = Math.max(0, s.pausedMinutes)
  const truePressure = effectiveDowntime + masked
  const trueSla =
    total <= 0
      ? 0
      : clamp(reportedSla - (masked / Math.max(1, effectiveDowntime + masked + 60)) * 25 - (total - met) * 2, 0, 100)

  const mttr = total <= 0 ? 0 : Math.round((truePressure / total) * 10) / 10
  const firstTimeFixRate = total <= 0 ? 0 : clamp((s.firstTimeFix / total) * 100, 0, 100)
  const distortion = Math.round((reportedSla - trueSla) * 10) / 10

  return {
    reportedSla: Math.round(reportedSla * 10) / 10,
    trueSla: Math.round(trueSla * 10) / 10,
    mttr,
    firstTimeFixRate: Math.round(firstTimeFixRate * 10) / 10,
    distortion,
  }
}

export function defaultSla(): SlaClockState {
  return {
    totalIncidents: 40,
    metOnTime: 36,
    downtimeMinutes: 480,
    pausedMinutes: 210,
    firstTimeFix: 28,
  }
}
