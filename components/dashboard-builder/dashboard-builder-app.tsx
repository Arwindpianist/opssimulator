"use client"

import { Download, Plus, X } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { FancySelect } from "@/components/fancy-select"
import { useDashboardBuilder } from "@/hooks/use-dashboard-builder"
import { ROLE_SUGGESTIONS } from "@/lib/dashboard/presets"
import type { AudiencePersona, ReviewCadence, WalkthroughPrinciple, WeightPresetId } from "@/lib/dashboard/types"
import { CleanDashboard } from "./clean-dashboard"
import { DashboardBlueprintPrint } from "./dashboard-blueprint-print"

const PRINCIPLES: { id: WalkthroughPrinciple; label: string }[] = [
  { id: "leadingLagging", label: "Leading vs Lagging" },
  { id: "antiGaming", label: "Anti-Gaming Pairs" },
  { id: "formulasOwners", label: "Clear Formulas & Owners" },
  { id: "roleTailored", label: "Role-Tailored Views" },
  { id: "balancedWeights", label: "Balanced Weightages" },
  { id: "pdcaReady", label: "PDCA Trigger Ready" },
]

export function DashboardBuilderApp() {
  const db = useDashboardBuilder()
  const { blueprint: bp, step } = db

  return (
    <main className="stage builder-stage">
      <AppNav
        subtitle="DASHBOARD BUILDER"
        actions={
          <>
            <button className="action-btn export" type="button" onClick={db.exportAll}>
              <Download /> Save & Export
            </button>
            <label className="action-btn import">
              <input type="file" accept="application/json" hidden onChange={(e) => db.importJson(e.target.files?.[0])} />
              <Download /> Import
            </label>
          </>
        }
      />

      <div className="builder-step-rail" role="tablist" aria-label="Builder steps">
        {[1, 2, 3, 4].map((n) => (
          <button key={n} type="button" role="tab" className={step === n ? "active" : ""} onClick={() => db.setStep(n)}>
            Step {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="builder-panel">
          <h2>Audience, Role & Horizon</h2>
          <div className="builder-grid-3">
            <FancySelect
              label="PERSONA"
              value={bp.persona}
              options={[
                { value: "Supervisor", label: "Supervisor / Daily Ops", hint: "Shift-level ops view" },
                { value: "OpsManager", label: "Department / Ops Manager", hint: "Cross-team governance" },
                { value: "Executive", label: "Executive Director", hint: "Risk and cost lens" },
              ]}
              onChange={(v) => db.setAudience(v as AudiencePersona, bp.cadence)}
            />
            <FancySelect
              label="REVIEW CADENCE"
              value={bp.cadence}
              options={(["Daily", "Weekly", "Monthly", "Quarterly"] as ReviewCadence[]).map((c) => ({
                value: c,
                label: c,
              }))}
              onChange={(v) => db.setAudience(bp.persona, v as ReviewCadence)}
            />
            <FancySelect
              label="ROLE / DEPARTMENT"
              value={bp.roleDepartment || ROLE_SUGGESTIONS[0]}
              options={ROLE_SUGGESTIONS.map((r) => ({ value: r, label: r }))}
              onChange={(v) => db.patch({ roleDepartment: v })}
            />
          </div>
          <div className="builder-actions">
            <button type="button" className="action-btn configure" onClick={() => db.applyRole(bp.roleDepartment || "Facilities & Space", true)}>
              Load role preset
            </button>
            <button type="button" className="action-btn" onClick={db.loadCatalog}>
              Load full catalog
            </button>
            <button type="button" className="action-btn" onClick={db.startBlank}>
              Start blank
            </button>
            <button type="button" className="action-btn export" onClick={() => db.setStep(2)}>
              Next: KPIs
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="builder-panel">
          <div className="drawer-section-title">
            <h2>KPI & Metric Configuration</h2>
            <button type="button" onClick={db.addKpi}>
              <Plus /> ADD KPI
            </button>
          </div>
          {bp.kpis.map((k, i) => (
            <article className="kpi-edit-card" key={k.id}>
              <div className="setup-row dept-setup">
                <input value={k.name} onChange={(e) => db.updateKpi(k.id, { name: e.target.value })} aria-label="KPI name" />
                <label>
                  OWNER
                  <input value={k.owner} onChange={(e) => db.updateKpi(k.id, { owner: e.target.value })} />
                </label>
                <label>
                  TARGET
                  <input type="number" value={k.target} onChange={(e) => db.updateKpi(k.id, { target: Number(e.target.value) })} />
                </label>
                <label>
                  RED FLAG
                  <input type="number" value={k.redFlag} onChange={(e) => db.updateKpi(k.id, { redFlag: Number(e.target.value) })} />
                </label>
                <button type="button" className="delete-row" onClick={() => db.moveKpi(k.id, -1)} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className="delete-row" onClick={() => db.moveKpi(k.id, 1)} aria-label="Move down">
                  ↓
                </button>
                <button type="button" className="delete-row" onClick={() => db.removeKpi(k.id)} aria-label="Remove KPI">
                  <X />
                </button>
              </div>
              <div className="builder-grid-3">
                <label className="setup-field">
                  Data source
                  <input value={k.dataSource} onChange={(e) => db.updateKpi(k.id, { dataSource: e.target.value })} />
                </label>
                <FancySelect
                  label="INDICATOR"
                  value={k.indicatorType}
                  options={[
                    { value: "Leading", label: "Leading", hint: "Predictive driver" },
                    { value: "Lagging", label: "Lagging", hint: "Outcome result" },
                  ]}
                  onChange={(v) => db.updateKpi(k.id, { indicatorType: v as "Leading" | "Lagging" })}
                />
                <label className="setup-field">
                  Anti-gaming counter-metric
                  <input
                    value={k.antiGamingCounter}
                    onChange={(e) => db.updateKpi(k.id, { antiGamingCounter: e.target.value })}
                    placeholder="e.g. Reopen Rate %"
                  />
                </label>
              </div>
              {!k.antiGamingCounter.trim() && <div className="raci-warning">Missing anti-gaming counter-metric for this KPI.</div>}
              <div className="drawer-section-title">
                <span>SUB-METRICS / MATRICES · Face score {Math.round(db.kpiFaceScore(k))}%</span>
                <button type="button" onClick={() => db.addSub(k.id)}>
                  <Plus /> ADD
                </button>
              </div>
              {k.subMetrics.map((m) => (
                <div className="setup-row pool-setup-full" key={m.id}>
                  <input value={m.name} onChange={(e) => db.updateSub(k.id, m.id, { name: e.target.value })} />
                  <label>
                    FORMULA
                    <input value={m.formula} onChange={(e) => db.updateSub(k.id, m.id, { formula: e.target.value })} />
                  </label>
                  <label>
                    VALUE
                    <input type="number" value={m.value} onChange={(e) => db.updateSub(k.id, m.id, { value: Number(e.target.value) })} />
                  </label>
                  <label>
                    TARGET
                    <input type="number" value={m.target} onChange={(e) => db.updateSub(k.id, m.id, { target: Number(e.target.value) })} />
                  </label>
                  <button type="button" className="delete-row" onClick={() => db.removeSub(k.id, m.id)}>
                    <X />
                  </button>
                </div>
              ))}
              <small className="empty-hint">KPI #{i + 1}</small>
            </article>
          ))}
          <div className="builder-actions">
            <button type="button" className="action-btn" onClick={() => db.setStep(1)}>
              Back
            </button>
            <button type="button" className="action-btn export" onClick={() => db.setStep(3)}>
              Next: Weightages
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="builder-panel">
          <h2>Weightage Adjustments</h2>
          <div className={`weight-badge ${db.weightsOk ? "ok" : "bad"}`}>Total KPI weight: {db.kpiWeightSum}%</div>
          <div className="builder-actions">
            <button type="button" className="action-btn configure" onClick={db.normalizeKpiWeights}>
              Normalize to 100%
            </button>
            {(Object.keys(db.weightPresets) as WeightPresetId[]).map((id) => (
              <button key={id} type="button" className="action-btn" onClick={() => db.applyWeightPreset(id)}>
                {db.weightPresets[id].label}
              </button>
            ))}
          </div>
          {bp.kpis.map((k) => (
            <div className="weight-row" key={k.id}>
              <span>{k.name}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={k.weightPct}
                onChange={(e) => db.updateKpi(k.id, { weightPct: Number(e.target.value) })}
              />
              <b className="tabular">{k.weightPct}%</b>
              <button type="button" className="action-btn" onClick={() => db.normalizeSubWeights(k.id)}>
                Norm subs
              </button>
            </div>
          ))}
          <div className="builder-actions">
            <button type="button" className="action-btn" onClick={() => db.setStep(2)}>
              Back
            </button>
            <button type="button" className="action-btn export" onClick={() => db.setStep(4)}>
              Next: Preview
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="builder-panel">
          <h2>Walkthrough & Live Preview</h2>
          <div className="walkthrough-bar">
            {PRINCIPLES.map((p) => (
              <span key={p.id} className={`walk-chip ${db.walkthrough[p.id] ? "done" : ""}`}>
                {db.walkthrough[p.id] ? "✓ " : ""}
                {p.label}
              </span>
            ))}
          </div>
          <CleanDashboard blueprint={bp} overall={db.overall} />
          <div className="builder-actions">
            <button type="button" className="action-btn" onClick={() => db.setStep(3)}>
              Back
            </button>
            <button type="button" className="action-btn export" onClick={db.exportAll}>
              Save & Export Dashboard Blueprint
            </button>
          </div>
        </section>
      )}

      <DashboardBlueprintPrint open={db.printOpen} onClose={() => db.setPrintOpen(false)} blueprint={bp} overall={db.overall} />
      {db.notice && (
        <div className="toast">
          {db.notice}
          <button type="button" onClick={() => db.setNotice("")}>
            <X />
          </button>
        </div>
      )}
    </main>
  )
}
