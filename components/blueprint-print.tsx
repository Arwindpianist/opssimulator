"use client"

import type { Model, SimFrame } from "@/lib/sim/types"
import { KPI_THRESHOLDS } from "@/lib/sim/pdca"
import { ESCALATION_LABELS } from "@/lib/sim/engine"

export function BlueprintPrint({
  open,
  onClose,
  model,
  frame,
}: {
  open: boolean
  onClose: () => void
  model: Model
  frame: SimFrame
}) {
  if (!open) return null

  const print = () => {
    window.print()
  }

  return (
    <div className="blueprint-scrim no-print-hide">
      <div className="blueprint-toolbar no-print">
        <button type="button" className="action-btn export" onClick={print}>
          Print / Save PDF
        </button>
        <button type="button" className="action-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <article className="blueprint-doc" id="blueprint-print-root">
        <header>
          <h1>OpsSim 30-60-90 Day Blueprint</h1>
          <p>
            {model.org} · Shift {model.shiftMode} · Hours {String(model.openHour).padStart(2, "0")}:00 to{" "}
            {String(model.closeHour).padStart(2, "0")}:00
          </p>
        </header>

        <section>
          <h2>1. Departments</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Headcount</th>
                <th>Field %</th>
                <th>Peak</th>
                <th>Tier</th>
                <th>Influence</th>
                <th>Escalation</th>
              </tr>
            </thead>
            <tbody>
              {model.departments.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.headcount}</td>
                  <td>{d.fieldDutyRatio}</td>
                  <td>{d.peakArrivalWindow}:00</td>
                  <td>{d.priorityTier}</td>
                  <td>{d.stakeholderInfluence}</td>
                  <td>{ESCALATION_LABELS[d.escalationTier]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>2. Resource Pools</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Capacity</th>
                <th>Allocation</th>
                <th>Live Occupied</th>
                <th>Ghost</th>
              </tr>
            </thead>
            <tbody>
              {frame.pools.map((p) => (
                <tr key={p.poolId}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.capacity}</td>
                  <td>{p.allocationMode}</td>
                  <td>{p.occupied}</td>
                  <td>{p.ghost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>3. Active SOP / SLA Rules</h2>
          <ul>
            <li>Field-to-HQ Roster Sync: {model.rules.sync ? "ON" : "OFF"}</li>
            <li>No-Show Auto-Release: {model.rules.noShowMinutes > 0 ? `${model.rules.noShowMinutes} minutes` : "OFF"}</li>
            <li>Close Checklist SOP: {model.rules.checklist ? "ON" : "OFF"}</li>
            <li>Allow Clock-Pausing: {model.rules.allowClockPause ? "ON (loophole)" : "OFF (sealed)"}</li>
            <li>Anti-Gaming Counter-Metrics: {model.rules.antiGaming ? "ON" : "OFF"}</li>
            <li>4-Tier Escalation Ladder: {model.rules.escalation ? "ARMED" : "OFF"}</li>
            <li>Preventive Capacity Buffer: {model.rules.preventiveCapacityPct}%</li>
          </ul>
        </section>

        <section>
          <h2>4. KPI Targets (Red Flags)</h2>
          <ul>
            <li>
              {KPI_THRESHOLDS.netUtilization.label}: keep between {KPI_THRESHOLDS.netUtilization.redLow}% and{" "}
              {KPI_THRESHOLDS.netUtilization.redHigh}% (live {frame.kpis.netUtilization}%)
            </li>
            <li>
              {KPI_THRESHOLDS.frictionRejection.label}: below {KPI_THRESHOLDS.frictionRejection.redHigh}% (live{" "}
              {frame.kpis.frictionRejection}%)
            </li>
            <li>
              {KPI_THRESHOLDS.slaCompliance.label}: at or above {KPI_THRESHOLDS.slaCompliance.redLow}% (live{" "}
              {frame.kpis.slaCompliance}%)
            </li>
            <li>
              {KPI_THRESHOLDS.ghostBooking.label}: below {KPI_THRESHOLDS.ghostBooking.redHigh}% (live {frame.kpis.ghostBooking}
              %)
            </li>
            <li>
              {KPI_THRESHOLDS.reopenRate.label}: below {KPI_THRESHOLDS.reopenRate.redHigh}% (live {frame.kpis.reopenRate}%)
            </li>
          </ul>
        </section>

        <section>
          <h2>5. PDCA Corrective Log</h2>
          {model.pdcaLog.length === 0 && <p>No PDCA entries recorded yet.</p>}
          {model.pdcaLog.map((e) => (
            <div className="pdca-print" key={e.id}>
              <h3>
                {e.createdAt} · {e.kpi} ({e.value}% vs {e.threshold}%)
              </h3>
              <p>
                <strong>Plan:</strong> {e.plan}
              </p>
              <p>
                <strong>Do:</strong> {e.doStep}
              </p>
              <p>
                <strong>Check:</strong> {e.check}
              </p>
              <p>
                <strong>Act:</strong> {e.act}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h2>6. 30-60-90 Day Rollout Plan</h2>
          <h3>Days 1-30: Stabilize</h3>
          <ul>
            <li>Enable Field-to-HQ sync and no-show auto-release across workstation and parking pools.</li>
            <li>Move critical pools from Siloed to Hybrid allocation; measure friction weekly.</li>
            <li>Assign Accountable (A) owners for every RACI workflow step.</li>
          </ul>
          <h3>Days 31-60: Govern</h3>
          <ul>
            <li>Seal clock-pause loopholes; enforce true elapsed SLA time.</li>
            <li>Arm anti-gaming counter-metrics; track reopen rate as a paired KPI.</li>
            <li>Run weekly PDCA reviews for any red-flag KPI breaches.</li>
          </ul>
          <h3>Days 61-90: Institutionalize</h3>
          <ul>
            <li>Lock preferred shift mode and preventive capacity buffer into SOP.</li>
            <li>Escalate chronic offenders through Tier 3 penalty / reallocation.</li>
            <li>Present executive Tier 4 review pack with Run A vs Run B deltas.</li>
          </ul>
        </section>

        <section>
          <h2>7. RACI Roster</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Assignments</th>
              </tr>
            </thead>
            <tbody>
              {model.people.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.role}</td>
                  <td>
                    {Object.entries(p.assignments)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
    </div>
  )
}
