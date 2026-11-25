"use client"

import { Download, Plus, X } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { FancySelect } from "@/components/fancy-select"
import { GaugeCard } from "@/components/sim-widgets"
import { useCalculators } from "@/hooks/use-calculators"
import { cellKey } from "@/lib/calculators/raci"
import type { CalcTab, RaciLetter } from "@/lib/calculators/types"
import { newId } from "@/lib/shared/weights"
import { CalculatorsPrint } from "./calculators-print"

const TABS: { id: CalcTab; label: string }[] = [
  { id: "weightage", label: "Weightage" },
  { id: "raci", label: "RACI" },
  { id: "scorecard", label: "Scorecard" },
  { id: "sla", label: "SLA Clock" },
  { id: "capacity", label: "Capacity" },
  { id: "power", label: "Power-Interest" },
  { id: "summary", label: "Summary" },
]

const LETTER_CLASS: Record<RaciLetter, string> = {
  R: "raci-r",
  A: "raci-a",
  C: "raci-c",
  I: "raci-i",
  "-": "raci-none",
}

export function CalculatorsApp() {
  const api = useCalculators()
  const { state, tab } = api

  return (
    <main className="stage builder-stage">
      <AppNav
        subtitle="GOVERNANCE CALCULATORS"
        actions={
          <>
            <button className="action-btn export" type="button" onClick={api.exportAll}>
              <Download /> Export All Calculations
            </button>
            <label className="action-btn import">
              <input type="file" accept="application/json" hidden onChange={(e) => api.importJson(e.target.files?.[0])} />
              <Download /> Import
            </label>
          </>
        }
      />

      <div className="calc-tabs" role="tablist" aria-label="Calculator tools">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className={tab === t.id ? "active" : ""} onClick={() => api.setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "weightage" && (
        <section className="builder-panel">
          <div className="drawer-section-title">
            <h2>KPI & Sub-Matrix Weightage</h2>
            <button type="button" onClick={api.addKpi}>
              <Plus /> ADD KPI
            </button>
          </div>
          <div className={`weight-badge ${Math.abs(api.weightSum - 100) <= 0.5 ? "ok" : api.weightSum > 100 ? "bad" : "warn"}`}>
            Total Weight {api.weightSum}%
          </div>
          <div className="builder-actions">
            <button type="button" className="action-btn configure" onClick={api.normalizeKpiWeights}>
              Auto-Normalize to 100%
            </button>
            {Object.entries(api.weightPresets).map(([key, p]) => (
              <button key={key} type="button" className="action-btn" onClick={() => api.applyWeightPreset(key)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="telemetry-row">
            <GaugeCard
              label="COMPOSITE GOVERNANCE INDEX"
              value={Math.round(api.composite)}
              tone={api.composite >= 85 ? "mint" : api.composite >= 70 ? "amber" : "rose"}
            />
          </div>
          {api.weightAlerts.map((a) => (
            <div className="raci-warning" key={a}>
              Anti-gaming alert: {a}
            </div>
          ))}
          {state.weightage.map((k) => (
            <article className="kpi-edit-card" key={k.id}>
              <div className="setup-row pool-setup-full">
                <input value={k.name} onChange={(e) => api.updateKpi(k.id, { name: e.target.value })} />
                <label>
                  KPI WT %
                  <input type="number" value={k.weightPct} onChange={(e) => api.updateKpi(k.id, { weightPct: Number(e.target.value) })} />
                </label>
                <label>
                  SCORE
                  <input readOnly value={Math.round(api.kpiWeightedScore(k))} />
                </label>
                <button type="button" className="delete-row" onClick={() => api.removeKpi(k.id)}>
                  <X />
                </button>
              </div>
              <div className="builder-grid-3">
                <label className="setup-field">
                  Counter-metric
                  <input value={k.counterMetricName} onChange={(e) => api.updateKpi(k.id, { counterMetricName: e.target.value })} />
                </label>
                <label className="setup-field">
                  Counter value
                  <input type="number" value={k.counterValue} onChange={(e) => api.updateKpi(k.id, { counterValue: Number(e.target.value) })} />
                </label>
                <label className="setup-field">
                  Counter threshold
                  <input
                    type="number"
                    value={k.counterThreshold}
                    onChange={(e) => api.updateKpi(k.id, { counterThreshold: Number(e.target.value) })}
                  />
                </label>
              </div>
              {k.subs.map((s, si) => (
                <div className="setup-row dept-setup" key={s.id}>
                  <input
                    value={s.name}
                    onChange={(e) => {
                      const subs = k.subs.map((x, i) => (i === si ? { ...x, name: e.target.value } : x))
                      api.updateKpi(k.id, { subs })
                    }}
                  />
                  <label>
                    WT %
                    <input
                      type="number"
                      value={s.weightPct}
                      onChange={(e) => {
                        const subs = k.subs.map((x, i) => (i === si ? { ...x, weightPct: Number(e.target.value) } : x))
                        api.updateKpi(k.id, { subs })
                      }}
                    />
                  </label>
                  <label>
                    ACTUAL
                    <input
                      type="number"
                      value={s.actual}
                      onChange={(e) => {
                        const subs = k.subs.map((x, i) => (i === si ? { ...x, actual: Number(e.target.value) } : x))
                        api.updateKpi(k.id, { subs })
                      }}
                    />
                  </label>
                  <label>
                    TARGET
                    <input
                      type="number"
                      value={s.target}
                      onChange={(e) => {
                        const subs = k.subs.map((x, i) => (i === si ? { ...x, target: Number(e.target.value) } : x))
                        api.updateKpi(k.id, { subs })
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="delete-row"
                    onClick={() => api.updateKpi(k.id, { subs: k.subs.filter((_, i) => i !== si) })}
                  >
                    <X />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  api.updateKpi(k.id, {
                    subs: [...k.subs, { id: newId(), name: "New matrix", weightPct: 0, actual: 0, target: 100 }],
                  })
                }
              >
                <Plus /> Sub-metric
              </button>
            </article>
          ))}
        </section>
      )}

      {tab === "raci" && (
        <section className="builder-panel">
          <h2>RACI Matrix Builder</h2>
          <div className="builder-actions">
            {Object.entries(api.raciTemplates).map(([key, t]) => (
              <button key={key} type="button" className="action-btn" onClick={() => api.loadRaciTemplate(key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="raci-audit-bar">
            <span>Orphan A: {api.raciAudit.orphanSteps.length || "none"}</span>
            <span>Multi A: {api.raciAudit.multiA.length || "none"}</span>
            <span>Missing R: {api.raciAudit.missingR.length || "none"}</span>
            <span>Overloaded: {api.raciAudit.overloadedRoles.join(", ") || "none"}</span>
            <span>C-heavy: {api.raciAudit.consultHeavyRoles.join(", ") || "none"}</span>
          </div>
          {(api.raciAudit.orphanSteps.length > 0 || api.raciAudit.multiA.length > 0 || api.raciAudit.missingR.length > 0) && (
            <div className="raci-warning">
              Governance flags: {[
                ...api.raciAudit.orphanSteps.map((s) => `No A on "${s}"`),
                ...api.raciAudit.multiA.map((s) => `Multiple A on "${s}"`),
                ...api.raciAudit.missingR.map((s) => `No R on "${s}"`),
              ].join("; ")}
            </div>
          )}
          <div className="raci-table-wrap">
            <table className="raci-table">
              <thead>
                <tr>
                  <th>Process step</th>
                  {state.raci.roles.map((r) => (
                    <th key={r.id}>
                      <input
                        value={r.name}
                        onChange={(e) =>
                          api.patch({
                            raci: {
                              ...state.raci,
                              roles: state.raci.roles.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)),
                            },
                          })
                        }
                      />
                    </th>
                  ))}
                  <th>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        api.patch({
                          raci: { ...state.raci, roles: [...state.raci.roles, { id: newId(), name: "New role" }] },
                        })
                      }
                    >
                      + Role
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.raci.steps.map((step) => (
                  <tr key={step.id}>
                    <td>
                      <input
                        value={step.name}
                        onChange={(e) =>
                          api.patch({
                            raci: {
                              ...state.raci,
                              steps: state.raci.steps.map((x) => (x.id === step.id ? { ...x, name: e.target.value } : x)),
                            },
                          })
                        }
                      />
                    </td>
                    {state.raci.roles.map((role) => {
                      const letter = (state.raci.cells[cellKey(step.id, role.id)] ?? "-") as RaciLetter
                      return (
                        <td key={role.id}>
                          <button
                            type="button"
                            className={`raci-cell-btn ${LETTER_CLASS[letter]}`}
                            onClick={() => api.setRaciCell(step.id, role.id)}
                          >
                            {letter}
                          </button>
                        </td>
                      )
                    })}
                    <td>
                      <button
                        type="button"
                        className="delete-row"
                        onClick={() =>
                          api.patch({ raci: { ...state.raci, steps: state.raci.steps.filter((x) => x.id !== step.id) } })
                        }
                      >
                        <X />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() =>
              api.patch({ raci: { ...state.raci, steps: [...state.raci.steps, { id: newId(), name: "New step" }] } })
            }
          >
            <Plus /> Add step
          </button>
        </section>
      )}

      {tab === "scorecard" && (
        <section className="builder-panel">
          <h2>Vendor & Department Scorecard</h2>
          <label className="setup-field">
            Subject
            <input value={state.scorecard.subject} onChange={(e) => api.patch({ scorecard: { ...state.scorecard, subject: e.target.value } })} />
          </label>
          <div className="telemetry-row">
            <GaugeCard label="WEIGHTED SCORECARD" value={Math.round(api.scoreTotal)} tone={api.tier === 0 ? "mint" : api.tier <= 2 ? "amber" : "rose"} />
            <div className="mini-context">
              <span>ESCALATION</span>
              <b className="tabular projector-kpi-label">
                {api.tierLabel}
              </b>
              <small>Penalty ${api.penalty.toLocaleString()}</small>
            </div>
          </div>
          <div className="builder-actions">
            <button type="button" className="action-btn configure" onClick={api.normalizeScorecard}>
              Normalize weights
            </button>
            <label className="setup-field">
              Penalty per tier
              <input
                type="number"
                value={state.scorecard.penaltyPerTier}
                onChange={(e) => api.patch({ scorecard: { ...state.scorecard, penaltyPerTier: Number(e.target.value) } })}
              />
            </label>
          </div>
          {state.scorecard.criteria.map((c) => (
            <div className="setup-row pool-setup-full" key={c.id}>
              <input value={c.name} onChange={(e) => api.updateCriterion(c.id, { name: e.target.value })} />
              <label>
                WT %
                <input type="number" value={c.weightPct} onChange={(e) => api.updateCriterion(c.id, { weightPct: Number(e.target.value) })} />
              </label>
              <label>
                SCORE
                <input type="number" value={c.score} onChange={(e) => api.updateCriterion(c.id, { score: Number(e.target.value) })} />
              </label>
              <FancySelect
                label="SCALE"
                size="compact"
                value={c.scale}
                options={[
                  { value: "five", label: "1-5" },
                  { value: "percent", label: "0-100%" },
                ]}
                onChange={(v) => api.updateCriterion(c.id, { scale: v as "percent" | "five" })}
              />
            </div>
          ))}
        </section>
      )}

      {tab === "sla" && (
        <section className="builder-panel">
          <h2>SLA Compliance, Clock-Pause & Downtime</h2>
          <div className="builder-grid-3">
            {(
              [
                ["totalIncidents", "Total incidents"],
                ["metOnTime", "Met on time"],
                ["downtimeMinutes", "Downtime minutes"],
                ["pausedMinutes", "Vendor clock-paused minutes"],
                ["firstTimeFix", "First-time fix count"],
              ] as const
            ).map(([key, label]) => (
              <label className="setup-field" key={key}>
                {label}
                <input
                  type="number"
                  value={state.sla[key]}
                  onChange={(e) => api.patch({ sla: { ...state.sla, [key]: Number(e.target.value) } })}
                />
              </label>
            ))}
          </div>
          <div className="sla-compare">
            <article className="flaw-card">
              <span className="messy-label">Reported SLA (with clock-pause)</span>
              <b className="messy-value tabular">{api.slaResult.reportedSla}%</b>
            </article>
            <article className="flaw-card inspect-on">
              <span className="messy-label">True Operational SLA (strict)</span>
              <b className="messy-value tabular">{api.slaResult.trueSla}%</b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">MTTR (min)</span>
              <b className="messy-value tabular">{api.slaResult.mttr}</b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">First-Time Fix Rate</span>
              <b className="messy-value tabular">{api.slaResult.firstTimeFixRate}%</b>
            </article>
          </div>
          <div className="raci-warning">Loophole distortion: +{api.slaResult.distortion} pts on reported vs true SLA</div>
        </section>
      )}

      {tab === "capacity" && (
        <section className="builder-panel">
          <h2>Space, Parking & Manpower Capacity</h2>
          <div className="builder-grid-3">
            {(
              [
                ["headcount", "Total staff headcount"],
                ["fieldPct", "Field / off-site duty %"],
                ["hybridStaggerPct", "Hybrid / shift stagger %"],
                ["seatSharingRatio", "Seat sharing ratio"],
                ["parkingEligibilityPct", "Parking eligibility %"],
                ["peakBufferPct", "Peak buffer %"],
              ] as const
            ).map(([key, label]) => (
              <label className="setup-field" key={key}>
                {label}
                <input
                  type="number"
                  step={key === "seatSharingRatio" ? 0.1 : 1}
                  value={state.capacity[key]}
                  onChange={(e) => api.patch({ capacity: { ...state.capacity, [key]: Number(e.target.value) } })}
                />
              </label>
            ))}
          </div>
          <div className="telemetry-row">
            <GaugeCard
              label="CONGESTION INDEX"
              value={api.capacityResult.congestionIndex}
              tone={api.capacityResult.congestionIndex > 95 ? "rose" : api.capacityResult.congestionIndex > 80 ? "amber" : "mint"}
            />
            <div className="mini-context">
              <span>WORKSTATIONS</span>
              <b>{api.capacityResult.requiredWorkstations}</b>
              <small>ON-SITE {api.capacityResult.onSiteHeadcount}</small>
            </div>
            <div className="mini-context">
              <span>PARKING BAYS</span>
              <b>{api.capacityResult.requiredParking}</b>
              <small>COMMON {api.capacityResult.commonAreaSeats}</small>
            </div>
            <div className="mini-context overflow">
              <span>NET SPACE SAVED</span>
              <b>{api.capacityResult.netSpaceSaved}</b>
              <small>VS 1:1 SILOED {api.capacityResult.siloedDesks}</small>
            </div>
          </div>
        </section>
      )}

      {tab === "power" && (
        <section className="builder-panel">
          <div className="drawer-section-title">
            <h2>2x2 Power-Interest Matrix</h2>
            <button type="button" onClick={api.addStakeholder}>
              <Plus /> ADD
            </button>
          </div>
          <div className="pi-grid" aria-hidden="false">
            <div className="pi-quad keep-satisfied">
              <span>Keep Satisfied</span>
              {api.stakeholderViews.filter((s) => s.quadrant === "Keep Satisfied").map((s) => (
                <b key={s.id}>{s.name}</b>
              ))}
            </div>
            <div className="pi-quad manage-closely">
              <span>Manage Closely</span>
              {api.stakeholderViews.filter((s) => s.quadrant === "Manage Closely").map((s) => (
                <b key={s.id}>{s.name}</b>
              ))}
            </div>
            <div className="pi-quad monitor">
              <span>Monitor</span>
              {api.stakeholderViews.filter((s) => s.quadrant === "Monitor").map((s) => (
                <b key={s.id}>{s.name}</b>
              ))}
            </div>
            <div className="pi-quad keep-informed">
              <span>Keep Informed</span>
              {api.stakeholderViews.filter((s) => s.quadrant === "Keep Informed").map((s) => (
                <b key={s.id}>{s.name}</b>
              ))}
            </div>
          </div>
          {api.stakeholderViews.map((s) => (
            <div className="kpi-edit-card" key={s.id}>
              <div className="setup-row pool-setup-full">
                <input value={s.name} onChange={(e) => api.updateStakeholder(s.id, { name: e.target.value })} />
                <label>
                  POWER {s.power}
                  <input type="range" min={1} max={10} value={s.power} onChange={(e) => api.updateStakeholder(s.id, { power: Number(e.target.value) })} />
                </label>
                <label>
                  INTEREST {s.interest}
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={s.interest}
                    onChange={(e) => api.updateStakeholder(s.id, { interest: Number(e.target.value) })}
                  />
                </label>
                <button type="button" className="delete-row" onClick={() => api.removeStakeholder(s.id)}>
                  <X />
                </button>
              </div>
              <small>
                {s.quadrant}: {s.tip}
              </small>
            </div>
          ))}
        </section>
      )}

      {tab === "summary" && (
        <section className="builder-panel">
          <h2>All-in-One Summary</h2>
          <div className="summary-grid">
            <article className="flaw-card">
              <span className="messy-label">Composite Governance Index</span>
              <b className="messy-value tabular">{Math.round(api.composite)}%</b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">RACI health flags</span>
              <b className="messy-value tabular">
                {api.raciAudit.orphanSteps.length + api.raciAudit.multiA.length + api.raciAudit.missingR.length}
              </b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">Scorecard tier</span>
              <b className="messy-value projector-kpi-label">
                {api.tierLabel}
              </b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">SLA loophole gap</span>
              <b className="messy-value tabular">+{api.slaResult.distortion} pts</b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">Capacity net saved</span>
              <b className="messy-value tabular">{api.capacityResult.netSpaceSaved}</b>
            </article>
            <article className="flaw-card">
              <span className="messy-label">Manage Closely count</span>
              <b className="messy-value tabular">
                {api.stakeholderViews.filter((s) => s.quadrant === "Manage Closely").length}
              </b>
            </article>
          </div>
          <button type="button" className="action-btn export" onClick={api.exportAll}>
            Export All Calculations (JSON / Print Worksheet)
          </button>
        </section>
      )}

      <CalculatorsPrint open={api.printOpen} onClose={() => api.setPrintOpen(false)} api={api} />
      {api.notice && (
        <div className="toast">
          {api.notice}
          <button type="button" onClick={() => api.setNotice("")}>
            <X />
          </button>
        </div>
      )}
    </main>
  )
}
