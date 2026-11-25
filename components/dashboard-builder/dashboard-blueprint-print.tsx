"use client"

import type { DashboardBlueprint } from "@/lib/dashboard/types"
import { CleanDashboard } from "./clean-dashboard"

export function DashboardBlueprintPrint({
  open,
  onClose,
  blueprint,
  overall,
}: {
  open: boolean
  onClose: () => void
  blueprint: DashboardBlueprint
  overall: number
}) {
  if (!open) return null
  return (
    <div className="blueprint-scrim">
      <div className="blueprint-toolbar no-print">
        <button type="button" className="action-btn export" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button type="button" className="action-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <article className="blueprint-doc clean-print-doc">
        <header className="clean-print-header">
          <h1>{blueprint.title}</h1>
          <p>
            Persona {blueprint.persona} · Cadence {blueprint.cadence} · Role {blueprint.roleDepartment || "Unassigned"} ·
            Overall {Math.round(overall)}%
          </p>
        </header>
        <CleanDashboard blueprint={blueprint} overall={overall} showBanner={false} />
      </article>
    </div>
  )
}
