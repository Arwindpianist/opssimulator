import { blankBlueprint, defaultKpiCatalog } from "./presets"
import type { DashboardBlueprint } from "./types"

export const DASHBOARD_KEY = "opsim-dashboard-blueprint"

export function loadDashboardBlueprint(): DashboardBlueprint | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DASHBOARD_KEY)
    if (!raw) return null
    return migrateBlueprint(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveDashboardBlueprint(bp: DashboardBlueprint) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify({ ...bp, updatedAt: new Date().toISOString() }))
  } catch {
    /* ignore */
  }
}

export function migrateBlueprint(raw: unknown): DashboardBlueprint {
  const base = blankBlueprint()
  if (!raw || typeof raw !== "object") {
    return { ...base, kpis: defaultKpiCatalog() }
  }
  const m = raw as Partial<DashboardBlueprint>
  return {
    version: 1,
    title: String(m.title ?? base.title),
    persona: (m.persona as DashboardBlueprint["persona"]) ?? base.persona,
    cadence: (m.cadence as DashboardBlueprint["cadence"]) ?? base.cadence,
    roleDepartment: String(m.roleDepartment ?? ""),
    kpis: Array.isArray(m.kpis) ? m.kpis : defaultKpiCatalog(),
    pdcaLog: Array.isArray(m.pdcaLog) ? m.pdcaLog : [],
    updatedAt: String(m.updatedAt ?? new Date().toISOString()),
  }
}

export function exportDashboardJson(bp: DashboardBlueprint) {
  const blob = new Blob([JSON.stringify(bp, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "opssim-dashboard-blueprint.json"
  a.click()
  URL.revokeObjectURL(url)
}
