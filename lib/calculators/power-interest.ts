import { newId } from "@/lib/shared/weights"
import type { Stakeholder } from "./types"

export type Quadrant = "Manage Closely" | "Keep Satisfied" | "Keep Informed" | "Monitor"

export function quadrantFor(s: Stakeholder): Quadrant {
  const highPower = s.power >= 5.5
  const highInterest = s.interest >= 5.5
  if (highPower && highInterest) return "Manage Closely"
  if (highPower && !highInterest) return "Keep Satisfied"
  if (!highPower && highInterest) return "Keep Informed"
  return "Monitor"
}

export function engagementTip(q: Quadrant): string {
  if (q === "Manage Closely") return "Weekly briefing + decision forums; escalate blockers within 24h."
  if (q === "Keep Satisfied") return "Biweekly executive digest; no surprises on cost or risk."
  if (q === "Keep Informed") return "Operational updates and change notices each sprint."
  return "Monthly dashboard glance; monitor for power/interest shifts."
}

export function defaultStakeholders(): Stakeholder[] {
  return [
    { id: newId(), name: "Executive Leadership", power: 9, interest: 7 },
    { id: newId(), name: "Subordinate Department Heads", power: 7, interest: 8 },
    { id: newId(), name: "Field Teams", power: 4, interest: 8 },
    { id: newId(), name: "IT Support", power: 6, interest: 5 },
    { id: newId(), name: "Contractors", power: 5, interest: 6 },
    { id: newId(), name: "Visitors", power: 2, interest: 3 },
  ]
}
