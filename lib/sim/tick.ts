import { advanceIncidents, recompute } from "./engine"
import { detectPdcaBreaches } from "./pdca"
import type { Incident, Model, SimFrame, Speed } from "./types"

export function speedIntervalMs(speed: Speed): number {
  if (speed === "5x") return 520
  if (speed === "30d") return 90
  return 2600
}

/** Simulated minutes represented by one hour tick (for SLA timers). */
export function minutesPerHourTick(speed: Speed): number {
  if (speed === "30d") return 60
  if (speed === "5x") return 60
  return 60
}

export type TickResult = {
  hour: number
  tick: number
  running: boolean
  incidents: Incident[]
  model: Model
  frame: SimFrame
}

export function applyHourTick(
  model: Model,
  hour: number,
  tick: number,
  incidents: Incident[],
  speed: Speed,
  ghostPressure: number,
  reopenPressure: number,
): TickResult {
  const close = model.closeHour
  let nextHour = hour + 1
  let running = true
  if (nextHour >= close) {
    nextHour = close
    running = false
  }
  const nextTick = tick + 1
  const nextIncidents = advanceIncidents(incidents, nextHour, model.rules, minutesPerHourTick(speed))
  const frame = recompute({
    model,
    hour: nextHour,
    tick: nextTick,
    incidents: nextIncidents,
    ghostPressure,
    reopenPressure,
  })
  const pdcaAdds = detectPdcaBreaches(frame.kpis, nextHour, model.pdcaLog)
  const nextModel =
    pdcaAdds.length > 0
      ? { ...model, pdcaLog: [...pdcaAdds, ...model.pdcaLog].slice(0, 40) }
      : model

  return {
    hour: nextHour,
    tick: nextTick,
    running,
    incidents: nextIncidents,
    model: nextModel,
    frame,
  }
}

export function computeFrame(
  model: Model,
  hour: number,
  tick: number,
  incidents: Incident[],
  ghostPressure = 0,
  reopenPressure = 0,
): SimFrame {
  return recompute({ model, hour, tick, incidents, ghostPressure, reopenPressure })
}
