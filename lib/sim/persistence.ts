import { createSpaceCrunchModel } from "./presets"
import {
  newId,
  type AllocationMode,
  type Department,
  type Model,
  type Person,
  type Pool,
  type Rules,
  type RunSnapshot,
  type ShiftMode,
  WORKFLOWS,
} from "./types"

export const MODEL_KEY = "opsim-model"
export const RUN_A_KEY = "opsim-run-a"

function asNumber(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback
}

function mapAllocation(raw: unknown): AllocationMode {
  const s = String(raw ?? "")
  if (/silo/i.test(s) || /fixed/i.test(s)) return "Siloed"
  if (/hybrid/i.test(s)) return "Hybrid"
  return "Shared"
}

function mapShift(raw: unknown): ShiftMode {
  const s = String(raw ?? "")
  if (/stagger/i.test(s)) return "Staggered"
  if (/rotat/i.test(s)) return "RotationalHybrid"
  return "SinglePeak"
}

function migrateDepartment(raw: Record<string, unknown>): Department {
  return {
    id: typeof raw.id === "string" ? raw.id : newId(),
    name: String(raw.name ?? "Department"),
    headcount: asNumber(raw.headcount ?? raw.people, 20),
    fieldDutyRatio: asNumber(raw.fieldDutyRatio ?? raw.field, 10),
    peakArrivalWindow: asNumber(raw.peakArrivalWindow, 9),
    priorityTier: asNumber(raw.priorityTier ?? raw.tier, 2),
    stakeholderInfluence: (["High", "Medium", "Low"].includes(String(raw.stakeholderInfluence ?? raw.influence))
      ? String(raw.stakeholderInfluence ?? raw.influence)
      : "Medium") as Department["stakeholderInfluence"],
    escalationTier: clampTier(asNumber(raw.escalationTier, 0)),
  }
}

function clampTier(n: number): Department["escalationTier"] {
  const t = Math.max(0, Math.min(4, Math.round(n)))
  return t as Department["escalationTier"]
}

function migratePool(raw: Record<string, unknown>): Pool {
  return {
    id: typeof raw.id === "string" ? raw.id : newId(),
    name: String(raw.name ?? "Resource pool"),
    category: String(raw.category ?? "Shared resource"),
    capacity: Math.max(1, asNumber(raw.capacity, 40)),
    allocationMode: mapAllocation(raw.allocationMode ?? raw.policy),
  }
}

function migratePerson(raw: Record<string, unknown>): Person {
  const assignments: Person["assignments"] = {}
  const src = (raw.assignments ?? {}) as Record<string, unknown>
  for (const w of WORKFLOWS) {
    const v = src[w]
    if (v === "R" || v === "A" || v === "C" || v === "I") assignments[w] = v
    else assignments[w] = null
  }
  return {
    id: typeof raw.id === "string" ? raw.id : newId(),
    name: String(raw.name ?? "Role"),
    role: String(raw.role ?? "Contributor"),
    assignments,
  }
}

function migrateRules(raw: Record<string, unknown> | undefined): Rules {
  const r = raw ?? {}
  return {
    checklist: asBool(r.checklist, true),
    sync: asBool(r.sync, true),
    recovery: asBool(r.recovery, true),
    escalation: asBool(r.escalation, true),
    antiGaming: asBool(r.antiGaming, true),
    allowClockPause: asBool(r.allowClockPause, false),
    preventiveCapacityPct: asNumber(r.preventiveCapacityPct ?? r.preventive, 35),
    noShowMinutes: asNumber(r.noShowMinutes ?? r.noShow, 15),
  }
}

export function migrateModel(raw: unknown): Model {
  const base = createSpaceCrunchModel()
  if (!raw || typeof raw !== "object") return base
  const m = raw as Record<string, unknown>
  const departments = Array.isArray(m.departments) ? m.departments.map((d) => migrateDepartment(d as Record<string, unknown>)) : base.departments
  const pools = Array.isArray(m.pools) ? m.pools.map((p) => migratePool(p as Record<string, unknown>)) : base.pools
  const people = Array.isArray(m.people) ? m.people.map((p) => migratePerson(p as Record<string, unknown>)) : base.people
  const events = Array.isArray(m.events)
    ? m.events.map((e) => {
        const ev = e as Record<string, unknown>
        return {
          id: typeof ev.id === "string" ? ev.id : newId(),
          title: String(ev.title ?? "Event"),
          detail: String(ev.detail ?? ""),
          time: String(ev.time ?? "07:00"),
          severity: (["P1", "P2", "P3", "P4", "INFO"].includes(String(ev.severity)) ? String(ev.severity) : "INFO") as Model["events"][0]["severity"],
        }
      })
    : base.events

  return {
    org: String(m.org ?? base.org),
    openHour: asNumber(m.openHour, base.openHour),
    closeHour: asNumber(m.closeHour, base.closeHour),
    shiftMode: mapShift(m.shiftMode),
    hours: asNumber(m.hours, base.hours),
    departments,
    pools,
    people,
    rules: migrateRules(m.rules as Record<string, unknown>),
    events,
    pdcaLog: Array.isArray(m.pdcaLog) ? (m.pdcaLog as Model["pdcaLog"]) : [],
  }
}

export function loadModelFromStorage(): Model | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    if (!raw) return null
    return migrateModel(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveModelToStorage(model: Model) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(MODEL_KEY, JSON.stringify(model))
  } catch {
    /* ignore quota */
  }
}

export function loadRunAFromStorage(): RunSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(RUN_A_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RunSnapshot
  } catch {
    return null
  }
}

export function saveRunAToStorage(snapshot: RunSnapshot | null) {
  if (typeof window === "undefined") return
  try {
    if (!snapshot) localStorage.removeItem(RUN_A_KEY)
    else localStorage.setItem(RUN_A_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore */
  }
}

export function exportModelJson(model: Model): void {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "opssim-blueprint.json"
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportedModel(text: string): Model {
  return migrateModel(JSON.parse(text))
}
