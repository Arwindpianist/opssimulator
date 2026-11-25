"use client"

import type { CalculatorsApi } from "@/hooks/use-calculators"

export function CalculatorsPrint({
  open,
  onClose,
  api,
}: {
  open: boolean
  onClose: () => void
  api: CalculatorsApi
}) {
  if (!open) return null
  const { state } = api
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
      <article className="blueprint-doc">
        <header>
          <h1>OpsSim Governance & Operations Calculator Worksheet</h1>
          <p>Composite Index {Math.round(api.composite)}% · Scorecard {api.tierLabel} · SLA gap +{api.slaResult.distortion} pts</p>
        </header>
        <section>
          <h2>1. KPI Weightage</h2>
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Weight</th>
                <th>Score</th>
                <th>Counter-metric</th>
              </tr>
            </thead>
            <tbody>
              {state.weightage.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>{k.weightPct}%</td>
                  <td>{Math.round(api.kpiWeightedScore(k))}%</td>
                  <td>
                    {k.counterMetricName} {k.counterValue}% / {k.counterThreshold}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2>2. RACI Audit</h2>
          <ul>
            <li>Orphan A steps: {api.raciAudit.orphanSteps.join(", ") || "none"}</li>
            <li>Multiple A steps: {api.raciAudit.multiA.join(", ") || "none"}</li>
            <li>Missing R steps: {api.raciAudit.missingR.join(", ") || "none"}</li>
            <li>Overloaded roles: {api.raciAudit.overloadedRoles.join(", ") || "none"}</li>
          </ul>
        </section>
        <section>
          <h2>3. Scorecard</h2>
          <p>
            {state.scorecard.subject}: {Math.round(api.scoreTotal)}% · {api.tierLabel} · Penalty ${api.penalty.toLocaleString()}
          </p>
        </section>
        <section>
          <h2>4. SLA Clock</h2>
          <p>
            Reported {api.slaResult.reportedSla}% vs True {api.slaResult.trueSla}% · MTTR {api.slaResult.mttr} · FTF{" "}
            {api.slaResult.firstTimeFixRate}%
          </p>
        </section>
        <section>
          <h2>5. Capacity</h2>
          <p>
            Workstations {api.capacityResult.requiredWorkstations} · Parking {api.capacityResult.requiredParking} · Common{" "}
            {api.capacityResult.commonAreaSeats} · Saved {api.capacityResult.netSpaceSaved}
          </p>
        </section>
        <section>
          <h2>6. Stakeholders</h2>
          <ul>
            {api.stakeholderViews.map((s) => (
              <li key={s.id}>
                {s.name}: {s.quadrant} (P{s.power}/I{s.interest})
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  )
}
