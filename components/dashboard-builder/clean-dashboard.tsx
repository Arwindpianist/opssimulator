"use client"

import type { DashboardBlueprint } from "@/lib/dashboard/types"
import { kpiFaceScore } from "@/lib/dashboard/score"

export function CleanDashboard({
  blueprint,
  overall,
  showBanner = true,
}: {
  blueprint: DashboardBlueprint
  overall: number
  showBanner?: boolean
}) {
  return (
    <section className="messy-dashboard clean-dashboard">
      {showBanner && (
        <div className="messy-banner">
          <span className="eyebrow">CLEAN OPERATIONS DASHBOARD</span>
          <p>
            Persona {blueprint.persona} · Cadence {blueprint.cadence} · Role {blueprint.roleDepartment || "Unassigned"} ·
            Overall {Math.round(overall)}%
          </p>
        </div>
      )}

      <div className="messy-grid clean-kpi-grid">
        <article className="flaw-card clean-card clean-card-overall">
          <span className="messy-horizon">{blueprint.cadence.toUpperCase()}</span>
          <span className="messy-label">Overall Dashboard Score</span>
          <b className="messy-value tabular">{Math.round(overall)}%</b>
          <small className="clean-meta">Weighted composite across all KPIs</small>
        </article>

        {blueprint.kpis.map((k) => {
          const score = Math.round(kpiFaceScore(k))
          const tone = score < k.redFlag ? "breach" : score < k.target ? "watch" : "ok"
          return (
            <article key={k.id} className={`flaw-card clean-card clean-${tone}`}>
              <span className="messy-horizon">
                {k.cadence.toUpperCase()} · {k.indicatorType.toUpperCase()} · WT {k.weightPct}%
              </span>
              <span className="messy-label">{k.name}</span>
              <b className="messy-value tabular">{score}%</b>
              <small className="clean-meta">
                Owner {k.owner || "Unassigned"} · Target {k.target}% · Red flag {k.redFlag}%
              </small>
              <small className="clean-counter">
                Counter-metric: {k.antiGamingCounter || "None paired"}
              </small>
              {k.subMetrics.length > 0 && (
                <div className="clean-sub-strip">
                  {k.subMetrics.slice(0, 3).map((m) => (
                    <span key={m.id}>
                      {m.name} {Math.round(m.value)}
                      {m.target ? `/${m.target}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="clean-pdca-block">
        <span className="eyebrow">PDCA CORRECTIVE LOG</span>
        {!blueprint.pdcaLog.length && <p className="clean-pdca-empty">No PDCA entries. Thresholds are armed for live breaches.</p>}
        <div className="messy-grid clean-pdca-grid">
          {blueprint.pdcaLog.slice(0, 6).map((e) => (
            <article key={e.id} className="flaw-card clean-card clean-pdca-card">
              <span className="messy-horizon">{e.createdAt}</span>
              <span className="messy-label">{e.kpi}</span>
              <b className="messy-value tabular projector-kpi-label">
                {e.value}%
                <small> / {e.threshold}%</small>
              </b>
              <small className="clean-meta">{e.plan}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
