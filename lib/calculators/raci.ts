import { newId } from "@/lib/shared/weights"
import type { RaciLetter, RaciMatrix } from "./types"

export function cellKey(stepId: string, roleId: string) {
  return `${stepId}::${roleId}`
}

export function cycleLetter(current: RaciLetter): RaciLetter {
  const order: RaciLetter[] = ["R", "A", "C", "I", "-"]
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

export type RaciAudit = {
  orphanSteps: string[]
  multiA: string[]
  missingR: string[]
  overloadedRoles: string[]
  consultHeavyRoles: string[]
}

export function auditRaci(matrix: RaciMatrix): RaciAudit {
  const orphanSteps: string[] = []
  const multiA: string[] = []
  const missingR: string[] = []
  const roleLoad: Record<string, number> = {}
  const roleC: Record<string, number> = {}
  matrix.roles.forEach((r) => {
    roleLoad[r.id] = 0
    roleC[r.id] = 0
  })

  for (const step of matrix.steps) {
    let aCount = 0
    let rCount = 0
    for (const role of matrix.roles) {
      const letter = matrix.cells[cellKey(step.id, role.id)] ?? "-"
      if (letter === "A") {
        aCount++
        roleLoad[role.id]++
      }
      if (letter === "R") {
        rCount++
        roleLoad[role.id]++
      }
      if (letter === "C") roleC[role.id]++
    }
    if (aCount === 0) orphanSteps.push(step.name)
    if (aCount > 1) multiA.push(step.name)
    if (rCount === 0) missingR.push(step.name)
  }

  const totalExec = Object.values(roleLoad).reduce((a, n) => a + n, 0) || 1
  const overloadedRoles = matrix.roles
    .filter((r) => roleLoad[r.id] / totalExec > 0.4)
    .map((r) => r.name)
  const consultHeavyRoles = matrix.roles.filter((r) => roleC[r.id] > Math.max(3, matrix.steps.length * 0.6)).map((r) => r.name)

  return { orphanSteps, multiA, missingR, overloadedRoles, consultHeavyRoles }
}

function blank(title: string, steps: string[], roles: string[]): RaciMatrix {
  const stepRows = steps.map((name) => ({ id: newId(), name }))
  const roleCols = roles.map((name) => ({ id: newId(), name }))
  const cells: Record<string, RaciLetter> = {}
  stepRows.forEach((s) => roleCols.forEach((r) => {
    cells[cellKey(s.id, r.id)] = "-"
  }))
  return { id: newId(), title, steps: stepRows, roles: roleCols, cells }
}

function assign(m: RaciMatrix, step: number, role: number, letter: RaciLetter) {
  const s = m.steps[step]
  const r = m.roles[role]
  if (s && r) m.cells[cellKey(s.id, r.id)] = letter
}

export const RACI_TEMPLATES: Record<string, { label: string; build: () => RaciMatrix }> = {
  blank: {
    label: "Blank Matrix",
    build: () => blank("Blank RACI", ["Step 1", "Step 2"], ["Role A", "Role B"]),
  },
  space: {
    label: "Space & Desk Reallocation",
    build: () => {
      const m = blank("Space & Desk Reallocation", ["Demand forecast", "Seat release", "Reassign desks", "Communicate moves"], [
        "Facilities",
        "Dept Head",
        "IT",
        "Staff",
      ])
      assign(m, 0, 0, "R")
      assign(m, 0, 1, "A")
      assign(m, 0, 2, "C")
      assign(m, 1, 0, "A")
      assign(m, 1, 0, "R")
      assign(m, 1, 3, "I")
      assign(m, 2, 0, "R")
      assign(m, 2, 1, "A")
      assign(m, 2, 2, "C")
      assign(m, 3, 1, "A")
      assign(m, 3, 0, "R")
      assign(m, 3, 3, "I")
      return m
    },
  },
  parking: {
    label: "Parking & Access Governance",
    build: () => {
      const m = blank("Parking & Access Governance", ["Eligibility check", "Bay allocation", "Exception approval", "Access revoke"], [
        "Security",
        "Facilities",
        "HR",
        "Requester",
      ])
      assign(m, 0, 2, "A")
      assign(m, 0, 0, "R")
      assign(m, 1, 1, "A")
      assign(m, 1, 1, "R")
      assign(m, 2, 1, "A")
      assign(m, 2, 2, "C")
      assign(m, 3, 0, "R")
      assign(m, 3, 0, "A")
      return m
    },
  },
  fault: {
    label: "Reactive Fault-to-Fix",
    build: () => {
      const m = blank("Reactive Fault-to-Fix", ["Log fault", "Triage", "Dispatch", "Close & verify"], [
        "Service Desk",
        "Technician",
        "Ops Manager",
        "Requester",
      ])
      assign(m, 0, 0, "R")
      assign(m, 0, 2, "A")
      assign(m, 1, 0, "R")
      assign(m, 1, 2, "A")
      assign(m, 2, 1, "R")
      assign(m, 2, 2, "A")
      assign(m, 3, 1, "R")
      assign(m, 3, 3, "C")
      assign(m, 3, 2, "A")
      return m
    },
  },
  vendor: {
    label: "Vendor SLA Escalation",
    build: () => {
      const m = blank("Vendor SLA Escalation", ["Detect breach", "Vendor notify", "Corrective plan", "Penalty / escalate"], [
        "Vendor Mgmt",
        "Ops Manager",
        "Finance",
        "Executive",
      ])
      assign(m, 0, 0, "R")
      assign(m, 0, 1, "A")
      assign(m, 1, 0, "R")
      assign(m, 1, 1, "A")
      assign(m, 2, 0, "R")
      assign(m, 2, 1, "A")
      assign(m, 2, 2, "C")
      assign(m, 3, 1, "R")
      assign(m, 3, 3, "A")
      assign(m, 3, 2, "C")
      return m
    },
  },
}

export function defaultRaci(): RaciMatrix {
  return RACI_TEMPLATES.space.build()
}
