"use client"

import { ArrowDownRight, Plus, Settings2, X } from "lucide-react"
import { FancySelect } from "@/components/fancy-select"
import type { SimulationApi } from "@/hooks/use-simulation"
import { WORKFLOWS, type AllocationMode, type Influence, type RaciLetter, type ShiftMode } from "@/lib/sim/types"

const SHIFT_OPTIONS: { id: ShiftMode; label: string }[] = [
  { id: "SinglePeak", label: "Single peak" },
  { id: "Staggered", label: "Staggered" },
  { id: "RotationalHybrid", label: "Rotational" },
]

const ALLOC: AllocationMode[] = ["Siloed", "Shared", "Hybrid"]
const INFLUENCE: Influence[] = ["High", "Medium", "Low"]
const RACI: (RaciLetter | null)[] = ["R", "A", "C", "I", null]

export function ConfigureWorld({
  open,
  onClose,
  sim,
}: {
  open: boolean
  onClose: () => void
  sim: SimulationApi
}) {
  if (!open) return null
  const { model } = sim

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="world-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">
              <Settings2 /> WORLD SETUP
            </span>
            <h2>Configure World</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close setup">
            <X />
          </button>
        </div>

        <div className="drawer-scroll">
          <label className="setup-field">
            Organization
            <input value={model.org} onChange={(e) => sim.updateOrg({ org: e.target.value })} />
          </label>

          <div className="setup-row org-hours">
            <label>
              OPEN HOUR
              <input
                type="number"
                min={0}
                max={23}
                value={model.openHour}
                onChange={(e) => sim.updateOrg({ openHour: Number(e.target.value) })}
              />
            </label>
            <label>
              CLOSE HOUR
              <input
                type="number"
                min={1}
                max={24}
                value={model.closeHour}
                onChange={(e) => sim.updateOrg({ closeHour: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>SHIFT MODEL</span>
            </div>
            <div className="shift-options">
              {SHIFT_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={model.shiftMode === s.id ? "active" : ""}
                  onClick={() => sim.setShiftMode(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>DEPARTMENTS</span>
              <button type="button" onClick={sim.addDepartment}>
                <Plus /> ADD
              </button>
            </div>
            {model.departments.map((d) => (
              <div className="setup-row dept-setup" key={d.id}>
                <input
                  aria-label="Department name"
                  value={d.name}
                  onChange={(e) => sim.updateDepartment(d.id, { name: e.target.value })}
                />
                <label>
                  STAFF
                  <input
                    type="number"
                    value={d.headcount}
                    onChange={(e) => sim.updateDepartment(d.id, { headcount: Number(e.target.value) })}
                  />
                </label>
                <label>
                  FIELD %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={d.fieldDutyRatio}
                    onChange={(e) => sim.updateDepartment(d.id, { fieldDutyRatio: Number(e.target.value) })}
                  />
                </label>
                <label>
                  PEAK
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={d.peakArrivalWindow}
                    onChange={(e) => sim.updateDepartment(d.id, { peakArrivalWindow: Number(e.target.value) })}
                  />
                </label>
                <label>
                  TIER
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={d.priorityTier}
                    onChange={(e) => sim.updateDepartment(d.id, { priorityTier: Number(e.target.value) })}
                  />
                </label>
                <FancySelect
                  label="INFLUENCE"
                  size="compact"
                  value={d.stakeholderInfluence}
                  options={INFLUENCE.map((i) => ({ value: i, label: i }))}
                  onChange={(v) => sim.updateDepartment(d.id, { stakeholderInfluence: v as Influence })}
                />
                <button className="delete-row" type="button" aria-label={`Remove ${d.name}`} onClick={() => sim.removeDepartment(d.id)}>
                  <X />
                </button>
              </div>
            ))}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>RESOURCE ZONES</span>
              <button type="button" onClick={sim.addPool}>
                <Plus /> ADD
              </button>
            </div>
            {model.pools.map((p) => (
              <div className="setup-row pool-setup-full" key={p.id}>
                <input
                  aria-label="Resource name"
                  value={p.name}
                  onChange={(e) => sim.updatePool(p.id, { name: e.target.value })}
                />
                <label>
                  CATEGORY
                  <input value={p.category} onChange={(e) => sim.updatePool(p.id, { category: e.target.value })} />
                </label>
                <label>
                  CAPACITY
                  <input
                    type="number"
                    min={1}
                    value={p.capacity}
                    onChange={(e) => sim.updatePool(p.id, { capacity: Number(e.target.value) })}
                  />
                </label>
                <FancySelect
                  label="ALLOCATION"
                  size="compact"
                  value={p.allocationMode}
                  options={ALLOC.map((a) => ({ value: a, label: a }))}
                  onChange={(v) => sim.updatePool(p.id, { allocationMode: v as AllocationMode })}
                />
                <button className="delete-row" type="button" aria-label={`Remove ${p.name}`} onClick={() => sim.removePool(p.id)}>
                  <X />
                </button>
              </div>
            ))}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>RACI ROSTER</span>
              <button type="button" onClick={sim.addPerson}>
                <Plus /> ADD
              </button>
            </div>
            {sim.workflowsMissingA.length > 0 && (
              <div className="raci-warning" role="alert">
                Missing Accountable (A) owner for: {sim.workflowsMissingA.join(", ")}
              </div>
            )}
            {model.people.map((person) => (
              <div className="raci-edit" key={person.id}>
                <div className="setup-row raci-identity">
                  <input
                    aria-label="Person name"
                    value={person.name}
                    onChange={(e) => sim.updatePerson(person.id, { name: e.target.value })}
                  />
                  <label>
                    ROLE
                    <input value={person.role} onChange={(e) => sim.updatePerson(person.id, { role: e.target.value })} />
                  </label>
                  <button className="delete-row" type="button" aria-label={`Remove ${person.name}`} onClick={() => sim.removePerson(person.id)}>
                    <X />
                  </button>
                </div>
                <div className="raci-matrix">
                  {WORKFLOWS.map((w) => (
                    <div key={w} className="raci-cell">
                      <FancySelect
                        label={w}
                        size="compact"
                        value={person.assignments[w] ?? ""}
                        options={[
                          { value: "", label: "-" },
                          ...RACI.filter(Boolean).map((letter) => ({ value: letter!, label: letter! })),
                        ]}
                        onChange={(v) => sim.setRaci(person.id, w, v === "" ? null : (v as RaciLetter))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!model.people.length && <p className="empty-hint">No RACI roles yet. Add owners for each workflow.</p>}
          </div>
        </div>

        <button className="drawer-done" type="button" onClick={onClose}>
          APPLY TO SIMULATION <ArrowDownRight />
        </button>
      </aside>
    </div>
  )
}
