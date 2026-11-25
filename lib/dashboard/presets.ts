import { newId } from "@/lib/shared/weights"
import type { DashboardBlueprint, DashboardKpi, WeightPresetId } from "./types"

function sm(name: string, formula: string, value: number, target: number, weightPct: number) {
  const status = value < target * 0.85 ? ("breach" as const) : value < target ? ("watch" as const) : ("ok" as const)
  return { id: newId(), name, formula, value, target, status, weightPct }
}

export function blankBlueprint(): DashboardBlueprint {
  return {
    version: 1,
    title: "Clean Operations Dashboard",
    persona: "OpsManager",
    cadence: "Weekly",
    roleDepartment: "",
    kpis: [],
    pdcaLog: [],
    updatedAt: new Date().toISOString(),
  }
}

export function defaultKpiCatalog(): DashboardKpi[] {
  return [
    {
      id: newId(),
      name: "Space & Capacity Governance",
      owner: "Facilities lead",
      target: 85,
      redFlag: 70,
      dataSource: "Booking + badge system",
      cadence: "Daily",
      indicatorType: "Leading",
      antiGamingCounter: "Booking Rejection / Friction %",
      weightPct: 20,
      subMetrics: [
        sm("Desk Occupancy vs Booked", "occupied / booked * 100", 78, 85, 30),
        sm("Parking Peak Overflow", "overflow / capacity * 100", 12, 8, 25),
        sm("Ghost Booking Rate", "ghost / booked * 100", 18, 10, 25),
        sm("Meeting Room No-Show Rate", "noShow / booked * 100", 14, 8, 20),
      ],
    },
    {
      id: newId(),
      name: "SLA & Response Reliability",
      owner: "Service owner",
      target: 90,
      redFlag: 80,
      dataSource: "ITSM ticket clock",
      cadence: "Daily",
      indicatorType: "Lagging",
      antiGamingCounter: "Reopen Rate %",
      weightPct: 20,
      subMetrics: [
        sm("On-Time Resolution", "met / total * 100", 86, 90, 40),
        sm("P1 Response", "p1Met / p1Total * 100", 92, 95, 30),
        sm("Reopen Rate", "reopened / closed * 100", 11, 8, 30),
      ],
    },
    {
      id: newId(),
      name: "Manpower & Shift Execution",
      owner: "Ops supervisor",
      target: 88,
      redFlag: 75,
      dataSource: "Roster + timeclock",
      cadence: "Daily",
      indicatorType: "Leading",
      antiGamingCounter: "Overtime Dependency %",
      weightPct: 15,
      subMetrics: [
        sm("Shift Fill Rate", "filled / planned * 100", 91, 95, 50),
        sm("Stagger Adherence", "onWindow / scheduled * 100", 82, 90, 50),
      ],
    },
    {
      id: newId(),
      name: "HSE & Compliance",
      owner: "HSE lead",
      target: 95,
      redFlag: 90,
      dataSource: "HSE register",
      cadence: "Weekly",
      indicatorType: "Lagging",
      antiGamingCounter: "Near-Miss Reporting Lag Days",
      weightPct: 15,
      subMetrics: [
        sm("Mandatory Training Complete", "trained / required * 100", 94, 98, 50),
        sm("Open High-Risk Findings", "openHigh", 3, 0, 50),
      ],
    },
    {
      id: newId(),
      name: "Cost & Asset Lifecycle",
      owner: "Asset manager",
      target: 80,
      redFlag: 65,
      dataSource: "CMMS + finance",
      cadence: "Monthly",
      indicatorType: "Lagging",
      antiGamingCounter: "Deferred Critical Work Orders",
      weightPct: 15,
      subMetrics: [
        sm("Preventive vs Reactive Mix", "pm / (pm+reactive) * 100", 62, 70, 60),
        sm("Asset Downtime Hours", "downtimeHours", 48, 30, 40),
      ],
    },
    {
      id: newId(),
      name: "Stakeholder & Service Quality",
      owner: "Service excellence",
      target: 85,
      redFlag: 70,
      dataSource: "CSAT + complaints",
      cadence: "Weekly",
      indicatorType: "Lagging",
      antiGamingCounter: "Complaint Reopen Rate %",
      weightPct: 15,
      subMetrics: [
        sm("CSAT Score", "avgCsat * 20", 84, 85, 50),
        sm("Complaint Cycle Time", "avgDays", 4.5, 3, 50),
      ],
    },
  ]
}

export const WEIGHT_PRESETS: Record<WeightPresetId, { label: string; weights: number[] }> = {
  balanced: { label: "Balanced Operations", weights: [20, 20, 15, 15, 15, 15] },
  spaceCrunch: { label: "Space & Capacity Crunch Focus", weights: [35, 15, 20, 10, 10, 10] },
  slaVendor: { label: "SLA & Vendor Accountability", weights: [10, 35, 10, 15, 20, 10] },
  safetyFirst: { label: "Safety & Compliance First", weights: [10, 15, 10, 35, 15, 15] },
  execRisk: { label: "Executive Risk & Cost View", weights: [15, 20, 10, 15, 25, 15] },
}

export const ROLE_SUGGESTIONS = [
  "Maintenance",
  "Accounting",
  "HSE",
  "IT Infrastructure",
  "Transport Operations",
  "Facilities & Space",
  "Procurement & Vendor Mgmt",
  "HR & Admin",
] as const
