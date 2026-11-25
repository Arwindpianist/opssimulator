"use client"

const FLAWED = [
  {
    id: "tickets",
    label: "Raw Tickets Closed",
    value: "412",
    horizon: "Today",
    tag: "Vanity Count",
    detail: "Activity without outcome context",
  },
  {
    id: "emails",
    label: "Emails Sent",
    value: "1,280",
    horizon: "Today",
    tag: "Vanity Count",
    detail: "Volume metric with no service impact",
  },
  {
    id: "calls",
    label: "Ad-Hoc Calls Logged",
    value: "95",
    horizon: "Today",
    tag: "Missing Formula",
    detail: "No definition or data source shown",
  },
  {
    id: "closure",
    label: "Fast Closure Rate",
    value: "99%",
    horizon: "QTD Avg",
    tag: "No Counter-Metric",
    detail: "Hides 38% Repeat / Reopen Rate",
    hiddenTruth: "Repeat / Reopen Rate: 38%",
  },
  {
    id: "unowned",
    label: "Avg Desk Moves",
    value: "7.4",
    horizon: "QTD Avg",
    tag: "Unowned Metric",
    detail: "No role owner or cadence",
  },
  {
    id: "lag",
    label: "Quarterly CSAT Snapshot",
    value: "4.2",
    horizon: "Quarterly",
    tag: "Lagging Only",
    detail: "No leading predictor paired",
  },
] as const

export function MessyDashboard({ inspect }: { inspect: boolean }) {
  return (
    <section className={`messy-dashboard ${inspect ? "inspect-on" : ""}`}>
      <div className="messy-banner">
        <span className="eyebrow">SAMPLE MESSY DASHBOARD</span>
        <p>Diagnose anti-patterns before building a clean dashboard. Mix of vanity counts, missing formulas, and clashing horizons.</p>
      </div>
      <div className="messy-grid">
        {FLAWED.map((card) => (
          <article key={card.id} className={`flaw-card ${inspect ? "inspect-on" : ""}`} data-flaw={card.tag}>
            {inspect && <span className="flaw-tag">{card.tag}</span>}
            <span className="messy-horizon">{card.horizon}</span>
            <span className="messy-label">{card.label}</span>
            <b className="messy-value tabular">{card.value}</b>
            {inspect && <small className="flaw-detail">{card.detail}</small>}
            {inspect && "hiddenTruth" in card && card.hiddenTruth && (
              <small className="flaw-truth">{card.hiddenTruth}</small>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
