"use client"

import type { ReactNode } from "react"

export function GaugeCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <article className="gauge-card">
      <div className={`gauge-ring ${tone}`}>
        <svg viewBox="0 0 88 88" aria-hidden="true">
          <circle className="gauge-track" cx="44" cy="44" r={r} />
          <circle className="gauge-value" cx="44" cy="44" r={r} strokeDasharray={c} strokeDashoffset={offset} />
        </svg>
        <b>
          {value}
          <small>%</small>
        </b>
      </div>
      <span>{label}</span>
    </article>
  )
}

export function Policy({
  label,
  enabled,
  onClick,
  icon,
  impact,
}: {
  label: string
  enabled: boolean
  onClick: () => void
  icon: ReactNode
  impact: string
}) {
  return (
    <button className={`policy-tile ${enabled ? "enabled" : ""}`} onClick={onClick} aria-pressed={enabled} type="button">
      <span className="policy-icon">{icon}</span>
      <span className="policy-name">{label}</span>
      <span className="policy-impact">{impact}</span>
      <i className="toggle-dot" />
    </button>
  )
}

export function CompareBar({
  label,
  a,
  b,
  inverse = false,
  showDelta = true,
}: {
  label: string
  a: number
  b: number
  inverse?: boolean
  showDelta?: boolean
}) {
  const delta = Math.round(b - a)
  const good = inverse ? delta < 0 : delta > 0
  const sign = delta > 0 ? "+" : ""
  return (
    <div className="compare-bar">
      <span>{label}</span>
      <div>
        <i className="bar-a" style={{ width: `${Math.max(0, Math.min(a, 100))}%` }} />
        <i className={`bar-b ${good ? "better" : "worse"}`} style={{ width: `${Math.max(0, Math.min(b, 100))}%` }} />
      </div>
      <b>
        {a}
        <small> to </small>
        <em className={good ? "better-text" : "worse-text"}>{b}</em>
        {showDelta && (
          <span className={`delta-badge ${good ? "better-text" : "worse-text"}`}>
            {sign}
            {delta}%
          </span>
        )}
      </b>
    </div>
  )
}
