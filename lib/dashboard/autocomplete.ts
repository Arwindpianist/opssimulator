import { newId } from "@/lib/shared/weights"
import { defaultKpiCatalog } from "./presets"
import type { DashboardKpi } from "./types"

const ROLE_FOCUS: Record<string, string[]> = {
  Maintenance: ["Cost & Asset Lifecycle", "SLA & Response Reliability", "HSE & Compliance"],
  Accounting: ["Cost & Asset Lifecycle", "Stakeholder & Service Quality"],
  HSE: ["HSE & Compliance", "Manpower & Shift Execution"],
  "IT Infrastructure": ["SLA & Response Reliability", "Stakeholder & Service Quality"],
  "Transport Operations": ["Manpower & Shift Execution", "Space & Capacity Governance"],
  "Facilities & Space": ["Space & Capacity Governance", "Cost & Asset Lifecycle"],
  "Procurement & Vendor Mgmt": ["SLA & Response Reliability", "Cost & Asset Lifecycle"],
  "HR & Admin": ["Manpower & Shift Execution", "Stakeholder & Service Quality"],
}

export function suggestKpisForRole(role: string): DashboardKpi[] {
  const catalog = defaultKpiCatalog()
  const key = Object.keys(ROLE_FOCUS).find((k) => role.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(role.toLowerCase()))
  if (!key) {
    return catalog.map((k) => ({ ...k, id: newId(), subMetrics: k.subMetrics.map((m) => ({ ...m, id: newId() })) }))
  }
  const names = ROLE_FOCUS[key]
  const picked = catalog.filter((k) => names.includes(k.name))
  const rest = catalog.filter((k) => !names.includes(k.name)).slice(0, Math.max(0, 4 - picked.length))
  const merged = [...picked, ...rest]
  const even = Math.round((100 / merged.length) * 10) / 10
  return merged.map((k, i) => ({
    ...k,
    id: newId(),
    weightPct: i === merged.length - 1 ? Math.round((100 - even * (merged.length - 1)) * 10) / 10 : even,
    subMetrics: k.subMetrics.map((m) => ({ ...m, id: newId() })),
  }))
}
