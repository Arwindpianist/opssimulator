"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { escalateDepartments } from "@/lib/sim/engine"
import {
  exportModelJson,
  loadModelFromStorage,
  loadRunAFromStorage,
  parseImportedModel,
  saveModelToStorage,
  saveRunAToStorage,
} from "@/lib/sim/persistence"
import { CHAOS_EVENTS, loadPresetModel, PRESET_LABELS, type PresetLabel } from "@/lib/sim/presets"
import { captureRunSnapshot } from "@/lib/sim/snapshot"
import { detectPdcaBreaches } from "@/lib/sim/pdca"
import { applyHourTick, computeFrame, speedIntervalMs } from "@/lib/sim/tick"
import {
  newId,
  type Department,
  type Incident,
  type Model,
  type Person,
  type Pool,
  type RaciLetter,
  type RunSnapshot,
  type Severity,
  type ShiftMode,
  type Speed,
  type WorkflowId,
  WORKFLOWS,
} from "@/lib/sim/types"

function emptyIncidents(): Incident[] {
  return []
}

export function useSimulation() {
  const [model, setModel] = useState<Model>(() => loadPresetModel(PRESET_LABELS[0]))
  const [hasHydrated, setHasHydrated] = useState(false)
  const [running, setRunning] = useState(false)
  const [hour, setHour] = useState(7)
  const [speed, setSpeed] = useState<Speed>("1x")
  const [tick, setTick] = useState(0)
  const [preset, setPreset] = useState<string>(PRESET_LABELS[0])
  const [incidents, setIncidents] = useState<Incident[]>(emptyIncidents)
  const [saved, setSaved] = useState<RunSnapshot | null>(null)
  const [notice, setNotice] = useState("")
  const [countdown, setCountdown] = useState(272)
  const [ghostPressure, setGhostPressure] = useState(0)
  const [reopenPressure, setReopenPressure] = useState(0)
  const [presenting, setPresenting] = useState(false)

  useEffect(() => {
    const stored = loadModelFromStorage()
    if (stored) setModel(stored)
    const runA = loadRunAFromStorage()
    if (runA) setSaved(runA)
    setHour(stored?.openHour ?? 7)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    saveModelToStorage(model)
  }, [model, hasHydrated])

  useEffect(() => {
    if (!hasHydrated) return
    saveRunAToStorage(saved)
  }, [saved, hasHydrated])

  const frame = useMemo(
    () => computeFrame(model, hour, tick, incidents, ghostPressure, reopenPressure),
    [model, hour, tick, incidents, ghostPressure, reopenPressure],
  )

  const modelRef = useRef(model)
  const hourRef = useRef(hour)
  const tickRef = useRef(tick)
  const incidentsRef = useRef(incidents)
  const speedRef = useRef(speed)
  const ghostRef = useRef(ghostPressure)
  const reopenRef = useRef(reopenPressure)
  modelRef.current = model
  hourRef.current = hour
  tickRef.current = tick
  incidentsRef.current = incidents
  speedRef.current = speed
  ghostRef.current = ghostPressure
  reopenRef.current = reopenPressure

  const tierKey = frame.departments.map((d) => d.escalationTier).join(",")
  useEffect(() => {
    if (!hasHydrated) return
    const nextDepts = escalateDepartments(modelRef.current, frame)
    const changed = nextDepts.some((d, i) => d.escalationTier !== modelRef.current.departments[i]?.escalationTier)
    if (changed) setModel((m) => ({ ...m, departments: escalateDepartments(m, frame) }))
  }, [tierKey, frame, hasHydrated])

  const kpiKey = [
    frame.kpis.netUtilization,
    frame.kpis.frictionRejection,
    frame.kpis.slaCompliance,
    frame.kpis.ghostBooking,
    frame.kpis.reopenRate,
  ].join(",")
  useEffect(() => {
    if (!hasHydrated) return
    const adds = detectPdcaBreaches(frame.kpis, hourRef.current, modelRef.current.pdcaLog)
    if (adds.length) {
      setModel((m) => ({ ...m, pdcaLog: [...adds, ...m.pdcaLog].slice(0, 40) }))
    }
  }, [kpiKey, frame.kpis, hasHydrated])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      const result = applyHourTick(
        modelRef.current,
        hourRef.current,
        tickRef.current,
        incidentsRef.current,
        speedRef.current,
        ghostRef.current,
        reopenRef.current,
      )
      setHour(result.hour)
      setTick(result.tick)
      setIncidents(result.incidents)
      if (result.model !== modelRef.current) setModel(result.model)
      if (!result.running) setRunning(false)
    }, speedIntervalMs(speed))
    return () => window.clearInterval(timer)
  }, [running, speed])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    const onFs = () => setPresenting(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const togglePresentation = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      setNotice("Fullscreen unavailable")
    }
  }, [])

  const resetClock = useCallback(() => {
    setRunning(false)
    setHour(model.openHour)
    setTick(0)
    setIncidents([])
    setGhostPressure(0)
    setReopenPressure(0)
    setCountdown(300)
  }, [model.openHour])

  const stepHour = useCallback(() => {
    const result = applyHourTick(model, hour, tick, incidents, speed, ghostPressure, reopenPressure)
    setHour(result.hour)
    setTick(result.tick)
    setIncidents(result.incidents)
    if (result.model !== model) setModel(result.model)
    if (!result.running) setRunning(false)
  }, [model, hour, tick, incidents, speed, ghostPressure, reopenPressure])

  const loadPreset = useCallback((label: string) => {
    setPreset(label)
    const next = loadPresetModel(label)
    setModel(next)
    setRunning(false)
    setHour(next.openHour)
    setTick(0)
    setIncidents([])
    setGhostPressure(0)
    setReopenPressure(0)
    setCountdown(300)
    setNotice(`Loaded ${label}`)
  }, [])

  const toggleRule = useCallback((key: keyof Model["rules"]) => {
    setModel((m) => {
      const rules = { ...m.rules }
      if (key === "noShowMinutes") {
        rules.noShowMinutes = rules.noShowMinutes > 0 ? 0 : 15
      } else if (typeof rules[key] === "boolean") {
        ;(rules as Record<string, boolean | number>)[key] = !rules[key as keyof typeof rules]
      }
      return { ...m, rules }
    })
    setTick((t) => t + 1)
  }, [])

  const setNoShow = useCallback((minutes: number) => {
    setModel((m) => ({ ...m, rules: { ...m.rules, noShowMinutes: minutes } }))
    setTick((t) => t + 1)
  }, [])

  const setPreventive = useCallback((pct: number) => {
    setModel((m) => ({ ...m, rules: { ...m.rules, preventiveCapacityPct: pct } }))
    setTick((t) => t + 1)
  }, [])

  const setShiftMode = useCallback((shiftMode: ShiftMode) => {
    setModel((m) => ({ ...m, shiftMode }))
    setTick((t) => t + 1)
  }, [])

  const addEvent = useCallback(
    (title: string, severity: Severity = "P2", detail = "Operational pressure injected") => {
      const time = `${String(hour).padStart(2, "0")}:00`
      setModel((m) => ({
        ...m,
        events: [{ id: newId(), title, detail, time, severity }, ...m.events],
      }))
      setCountdown(300)
      setTick((t) => t + 1)
      if (/ghost|hoard/i.test(title)) setGhostPressure((g) => Math.min(0.35, g + 0.08))
      if (/SLA|breach/i.test(title)) {
        const deptId = model.departments[0]?.id ?? null
        setIncidents((list) => [
          {
            id: newId(),
            title,
            severity: severity === "INFO" ? "P2" : severity,
            deptId,
            createdHour: hour,
            deadlineMinutes: severity === "P1" ? 60 : severity === "P2" ? 120 : 240,
            elapsedMinutes: 0,
            paused: false,
            pausedMinutes: 0,
            closed: false,
            prematureClose: false,
            reopened: false,
            breached: false,
          },
          ...list,
        ])
      }
      if (/surge/i.test(title)) setReopenPressure((r) => Math.min(0.4, r + 0.05))
    },
    [hour, model.departments],
  )

  const injectChaos = useCallback(
    (index: number) => {
      const e = CHAOS_EVENTS[index]
      if (e) addEvent(e.title, e.severity, e.detail)
    },
    [addEvent],
  )

  const dismissBanner = useCallback(() => {
    setModel((m) => ({ ...m, events: m.events.slice(1) }))
    setCountdown(300)
  }, [])

  const toggleClockPausePolicy = useCallback(() => {
    setModel((m) => {
      const allow = !m.rules.allowClockPause
      return { ...m, rules: { ...m.rules, allowClockPause: allow } }
    })
    setIncidents((list) =>
      list.map((inc) => {
        if (inc.closed) return inc
        // When allowing pause, auto-pause open incidents (contractor loophole)
        if (!model.rules.allowClockPause) return { ...inc, paused: true }
        return { ...inc, paused: false }
      }),
    )
    setTick((t) => t + 1)
    setNotice(model.rules.allowClockPause ? "Clock-pause sealed: true elapsed time enforced" : "Clock-pause loophole open")
  }, [model.rules.allowClockPause])

  const saveRunA = useCallback(() => {
    const snap = captureRunSnapshot(model, frame)
    setSaved(snap)
    setNotice("Baseline Run A captured")
  }, [model, frame])

  const exportBlueprint = useCallback(() => {
    exportModelJson(model)
  }, [model])

  const importBlueprint = useCallback((file?: File) => {
    file?.text().then((t) => {
      try {
        const next = parseImportedModel(t)
        setModel(next)
        setHour(next.openHour)
        setTick(0)
        setIncidents([])
        setNotice("Blueprint imported")
      } catch {
        setNotice("Invalid blueprint")
      }
    })
  }, [])

  // CRUD helpers
  const updateOrg = useCallback((patch: Partial<Pick<Model, "org" | "openHour" | "closeHour" | "shiftMode" | "hours">>) => {
    setModel((m) => ({ ...m, ...patch }))
  }, [])

  const addDepartment = useCallback(() => {
    setModel((m) => ({
      ...m,
      departments: [
        ...m.departments,
        {
          id: newId(),
          name: "New department",
          headcount: 20,
          fieldDutyRatio: 10,
          peakArrivalWindow: 9,
          priorityTier: 2,
          stakeholderInfluence: "Medium",
          escalationTier: 0,
        },
      ],
    }))
  }, [])

  const updateDepartment = useCallback((id: string, patch: Partial<Department>) => {
    setModel((m) => ({
      ...m,
      departments: m.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
  }, [])

  const removeDepartment = useCallback((id: string) => {
    setModel((m) => ({ ...m, departments: m.departments.filter((d) => d.id !== id) }))
  }, [])

  const addPool = useCallback(() => {
    setModel((m) => ({
      ...m,
      pools: [
        ...m.pools,
        {
          id: newId(),
          name: "New zone",
          category: "Shared resource",
          capacity: 40,
          allocationMode: "Shared",
        },
      ],
    }))
  }, [])

  const updatePool = useCallback((id: string, patch: Partial<Pool>) => {
    setModel((m) => ({
      ...m,
      pools: m.pools.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }, [])

  const removePool = useCallback((id: string) => {
    setModel((m) => ({ ...m, pools: m.pools.filter((p) => p.id !== id) }))
  }, [])

  const addPerson = useCallback(() => {
    const assignments: Person["assignments"] = {}
    WORKFLOWS.forEach((w) => {
      assignments[w] = null
    })
    setModel((m) => ({
      ...m,
      people: [...m.people, { id: newId(), name: "New role", role: "Contributor", assignments }],
    }))
  }, [])

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    setModel((m) => ({
      ...m,
      people: m.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }, [])

  const setRaci = useCallback((personId: string, workflow: WorkflowId, letter: RaciLetter | null) => {
    setModel((m) => ({
      ...m,
      people: m.people.map((p) =>
        p.id === personId ? { ...p, assignments: { ...p.assignments, [workflow]: letter } } : p,
      ),
    }))
  }, [])

  const removePerson = useCallback((id: string) => {
    setModel((m) => ({ ...m, people: m.people.filter((p) => p.id !== id) }))
  }, [])

  const workflowsMissingA = useMemo(() => {
    return WORKFLOWS.filter((w) => !model.people.some((p) => p.assignments[w] === "A"))
  }, [model.people])

  return {
    model,
    setModel,
    hasHydrated,
    running,
    setRunning,
    hour,
    speed,
    setSpeed,
    tick,
    preset,
    presets: PRESET_LABELS as unknown as PresetLabel[],
    loadPreset,
    incidents,
    frame,
    saved,
    saveRunA,
    notice,
    setNotice,
    countdown,
    presenting,
    togglePresentation,
    resetClock,
    stepHour,
    toggleRule,
    setNoShow,
    setPreventive,
    setShiftMode,
    addEvent,
    injectChaos,
    dismissBanner,
    toggleClockPausePolicy,
    exportBlueprint,
    importBlueprint,
    updateOrg,
    addDepartment,
    updateDepartment,
    removeDepartment,
    addPool,
    updatePool,
    removePool,
    addPerson,
    updatePerson,
    setRaci,
    removePerson,
    workflowsMissingA,
    chaosEvents: CHAOS_EVENTS,
  }
}

export type SimulationApi = ReturnType<typeof useSimulation>
