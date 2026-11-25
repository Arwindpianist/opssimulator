"use client"

import { GitCompareArrows, Users, X } from "lucide-react"
import type { SimulationApi } from "@/hooks/use-simulation"
import { ESCALATION_LABELS } from "@/lib/sim/engine"
import { CompareBar } from "./sim-widgets"

export function RunComparePanel({ sim }: { sim: SimulationApi }) {
  const { frame, saved } = sim
  const aUtil = saved?.kpis.netUtilization ?? 0
  const aFriction = saved?.kpis.frictionRejection ?? 0
  const aSla = saved?.kpis.slaCompliance ?? 0
  const aGhost = saved?.kpis.ghostBooking ?? 0

  return (
    <section className="bottom-row">
      <article className="compare-panel">
        <div className="bottom-heading">
          <span>
            <GitCompareArrows /> RUN COMPARISON
          </span>
          <button type="button" onClick={sim.saveRunA}>
            CAPTURE RUN A
          </button>
        </div>
        {saved ? (
          <div className="bar-compare">
            <CompareBar label="NET UTILIZATION" a={aUtil} b={frame.kpis.netUtilization} />
            <CompareBar label="FRICTION / REJECTION" a={aFriction} b={frame.kpis.frictionRejection} inverse />
            <CompareBar label="SLA HEALTH" a={aSla} b={frame.kpis.slaCompliance} />
            <CompareBar label="GHOST BOOKINGS" a={aGhost} b={frame.kpis.ghostBooking} inverse />
          </div>
        ) : (
          <p className="compare-empty">Capture Run A to compare against live Run B.</p>
        )}
        <div className="pdca-strip">
          <span className="pdca-title">PDCA LOG</span>
          {sim.model.pdcaLog.length === 0 && <small>No red-flag corrective actions yet.</small>}
          {sim.model.pdcaLog.slice(0, 3).map((e) => (
            <div className="pdca-item" key={e.id}>
              <b>
                {e.createdAt} · {e.kpi}
              </b>
              <span>
                {e.value}% vs {e.threshold}% · {e.plan}
              </span>
            </div>
          ))}
        </div>
      </article>
      <article className="health-panel">
        <div className="bottom-heading">
          <span>
            <Users /> DEPARTMENT HEALTH
          </span>
          <small>
            {ESCALATION_LABELS[frame.vendorEscalation]} · {frame.departments.length} UNITS
          </small>
        </div>
        <div className="health-pills">
          {frame.departments.slice(0, 8).map((d, i) => (
            <div className={`health-pill health-${d.health.toLowerCase()}`} key={d.deptId}>
              <i className={`health-light h${i % 5}`} />
              <span>{d.name}</span>
              <b>
                {d.health} · T{d.escalationTier}
              </b>
            </div>
          ))}
        </div>
        <div className="kpi-extras">
          <span>
            REOPEN RATE <b className="tabular">{frame.kpis.reopenRate}%</b>
          </span>
          <span>
            TRUE DOWNTIME <b className="tabular">{frame.kpis.trueDowntimeMinutes}m</b>
          </span>
          {frame.kpis.maskedSlaBoost > 0 && (
            <span className="masked-sla">
              MASKED SLA BOOST <b>+{frame.kpis.maskedSlaBoost}</b>
            </span>
          )}
        </div>
      </article>
    </section>
  )
}

export function CompareModal({ open, onClose, sim }: { open: boolean; onClose: () => void; sim: SimulationApi }) {
  if (!open) return null
  const { frame, saved } = sim
  return (
    <div className="modal-scrim" onClick={onClose}>
      <section className="compare-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-dialog" type="button" onClick={onClose} aria-label="Close compare">
          <X />
        </button>
        <span className="eyebrow">
          <GitCompareArrows /> RUN DELTA
        </span>
        <h2>Baseline Run A vs live Run B</h2>
        {saved ? (
          <>
            <CompareBar label="NET UTILIZATION" a={saved.kpis.netUtilization} b={frame.kpis.netUtilization} />
            <CompareBar label="FRICTION / REJECTION" a={saved.kpis.frictionRejection} b={frame.kpis.frictionRejection} inverse />
            <CompareBar label="SLA HEALTH" a={saved.kpis.slaCompliance} b={frame.kpis.slaCompliance} />
            <CompareBar label="GHOST BOOKINGS" a={saved.kpis.ghostBooking} b={frame.kpis.ghostBooking} inverse />
            <CompareBar label="REOPEN RATE" a={saved.kpis.reopenRate} b={frame.kpis.reopenRate} inverse />
          </>
        ) : (
          <p>Capture Run A to compare live performance.</p>
        )}
      </section>
    </div>
  )
}
