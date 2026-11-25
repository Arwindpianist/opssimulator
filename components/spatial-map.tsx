"use client"

import { AlertTriangle, Building2, MapPin, Users, X, Zap } from "lucide-react"
import type { SimEvent, SimFrame } from "@/lib/sim/types"

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n)

export function SpatialMap({
  tab,
  setTab,
  hour,
  frame,
  banner,
  countdown,
  onDismiss,
  onSlotClick,
  onConfigure,
}: {
  tab: string
  setTab: (t: string) => void
  hour: number
  frame: SimFrame
  banner: SimEvent | undefined
  countdown: number
  onDismiss: () => void
  onSlotClick: (label: string) => void
  onConfigure: () => void
}) {
  const util = frame.kpis.netUtilization
  return (
    <section className="map-panel">
      <div className="map-header">
        <div className="map-heading">
          <span className="eyebrow">
            <MapPin /> LIVE SPATIAL MAP
          </span>
          <h2>
            Operations floor <span>·</span> {String(hour).padStart(2, "0")}:00
          </h2>
        </div>
        <div className="legend">
          <span>
            <i className="legend-dot occupied" />
            OCCUPIED
          </span>
          <span>
            <i className="legend-dot ghost" />
            GHOST BOOKING
          </span>
          <span>
            <i className="legend-dot reclaimed" />
            RECLAIMED
          </span>
          <span>
            <i className="legend-dot free" />
            AVAILABLE
          </span>
        </div>
        <div className="view-switch" role="tablist" aria-label="Operations map view">
          {["Floor", "Flow", "Departments"].map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {banner && (
        <div className={`event-banner ${banner.severity === "P1" ? "urgent" : ""}`}>
          <span className="banner-icon">{banner.severity === "P1" ? <AlertTriangle /> : <Zap />}</span>
          <strong>{banner.title}</strong>
          <span className="banner-tag">{banner.severity} EVENT</span>
          <div className="count-ring">
            <b>{`${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`}</b>
          </div>
          <span className="banner-desc">{banner.detail}</span>
          <button aria-label="Dismiss event" type="button" onClick={onDismiss}>
            <X />
          </button>
        </div>
      )}

      <div className={`map-body ${tab.toLowerCase()}`}>
        <div className="flow-rail">
          {frame.departments.slice(0, 8).map((d, i) => (
            <div className="flow-source" key={d.deptId}>
              <span className={`flow-dot flow${i % 6}`} />
              <span>{d.name}</span>
              <b>{d.onSite}</b>
              <i className={d.congested ? "congested" : ""} />
            </div>
          ))}
        </div>
        <div className="flow-lines" aria-hidden="true">
          {frame.departments.slice(0, 8).map((d, i) => (
            <svg key={d.deptId} viewBox="0 0 220 44" preserveAspectRatio="none">
              <path
                className={d.congested ? "line-hot" : "line-calm"}
                d={`M0 ${8 + i * 4} C65 ${8 + i * 4}, 125 ${34 - i * 3}, 220 ${22 + (i % 2) * 5}`}
              />
              <circle className={d.congested ? "pulse-hot" : "pulse-calm"} r="3">
                <animateMotion
                  dur={`${d.congested ? 1.1 : 2.3 + (i % 3) * 0.4}s`}
                  repeatCount="indefinite"
                  path={`M0 ${8 + i * 4} C65 ${8 + i * 4}, 125 ${34 - i * 3}, 220 ${22 + (i % 2) * 5}`}
                />
              </circle>
            </svg>
          ))}
        </div>
        <div className="zones">
          {frame.pools.map((p, pi) => {
            return (
              <article className="zone" key={p.poolId}>
                <div className="zone-head">
                  <div>
                    <span className={`zone-symbol z${pi % 4}`}>
                      <Building2 />
                    </span>
                    <div>
                      <h3>{p.name}</h3>
                      <small>
                        {p.category.toUpperCase()} · {p.allocationMode.toUpperCase()}
                      </small>
                    </div>
                  </div>
                  <div className="zone-stats">
                    <b>
                      {p.occupied}
                      <small> / {p.capacity}</small>
                    </b>
                    <span>ACTIVE SLOTS</span>
                  </div>
                </div>
                <div className="slot-matrix" aria-label={`${p.name} slot occupancy`} style={{ gridTemplateColumns: "repeat(12, minmax(5px, 1fr))" }}>
                  {p.tiles.map((state, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${p.name} slot ${i + 1}: ${state}`}
                      className={`slot slot-${state === "occupied" ? "occupied" : state === "ghost" ? "ghost" : state === "reclaimed" ? "reclaimed" : "free"}`}
                      onClick={() => onSlotClick(`${p.name} · bay ${i + 1}`)}
                    />
                  ))}
                </div>
                <div className="zone-foot">
                  <span>{Math.round(Math.min(100, (p.booked / Math.max(1, p.capacity)) * 100))}% booked</span>
                  <div className="zone-bar">
                    <i style={{ width: `${Math.min(100, (p.booked / Math.max(1, p.capacity)) * 100)}%` }} />
                  </div>
                  <span>{p.ghost} ghost</span>
                  {p.overflow > 0 && (
                    <span className="overflow-pill">
                      <Users />
                      {p.overflow} QUEUE
                    </span>
                  )}
                </div>
              </article>
            )
          })}
          {!frame.pools.length && (
            <div className="empty-map">
              <Building2 />
              <b>NO RESOURCE ZONES</b>
              <button type="button" onClick={onConfigure}>
                Configure world
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="map-footer">
        <span>
          <span className="pulse-dot" /> LIVE MOVEMENT
        </span>
        <span>
          FLOW PRESSURE <b className={util > 85 ? "hot" : "calm"}>{util > 85 ? "CONGESTED" : "NORMAL"}</b>
        </span>
        <span>{frame.departments.length} DEPARTMENTS</span>
        <span>{fmt(frame.kpis.totalCapacity)} TOTAL UNITS</span>
      </div>
    </section>
  )
}
